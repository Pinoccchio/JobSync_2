import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePDSPDF } from '@/lib/pds/pdfGenerator';
import { generateCSCFormatPDF } from '@/lib/pds/pdfGeneratorCSC';
import { generatePDSExcel, generatePDSFilename } from '@/lib/pds/pdsExcelGenerator';
import { transformPDSFromDatabase } from '@/lib/utils/dataTransformers';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch PDS data
    const { data: pdsData, error: pdsError } = await supabase
      .from('applicant_pds')
      .select('*')
      .eq('id', id)
      .single();

    if (pdsError || !pdsData) {
      return NextResponse.json(
        { success: false, error: 'PDS not found' },
        { status: 404 }
      );
    }

    // Authorization check: User can only download their own PDS, or HR/ADMIN can download any
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = pdsData.user_id === user.id;
    const isAuthorized = isOwner || profile?.role === 'HR' || profile?.role === 'ADMIN';

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to download this PDS' },
        { status: 403 }
      );
    }

    // Get applicant name
    const { data: applicantProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', pdsData.user_id)
      .single();

    const applicantName = applicantProfile?.full_name || 'Unknown Applicant';

    // Read format, includeSignature and useCurrentDate from query parameters
    const format = request.nextUrl.searchParams.get('format') || 'modern'; // 'csc' | 'modern' | 'excel'
    const includeSignature = request.nextUrl.searchParams.get('includeSignature') === 'true';
    const useCurrentDate = request.nextUrl.searchParams.get('useCurrentDate') === 'true';

    // Transform database format (snake_case) to application format (camelCase)
    const transformedPDSData = transformPDSFromDatabase(pdsData);

    // Handle Excel export - GENERATE FILLED EXCEL FILE
    if (format === 'excel') {
      try {
        console.log('📊 Generating filled Excel PDS for:', transformedPDSData.personalInfo?.firstName, transformedPDSData.personalInfo?.surname);
        
        // Generate the filled Excel file
        const excelBuffer = await generatePDSExcel(transformedPDSData);
        
        // Generate filename
        const fileName = generatePDSFilename(transformedPDSData.personalInfo);

        console.log('✅ Excel file generated successfully:', fileName);

        // Convert Buffer to ArrayBuffer for NextResponse
        const arrayBuffer: ArrayBuffer = excelBuffer.buffer.slice(
          excelBuffer.byteOffset,
          excelBuffer.byteOffset + excelBuffer.byteLength
        ) as ArrayBuffer;

        // Return filled Excel file as downloadable
        return new NextResponse(arrayBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': excelBuffer.length.toString(),
          },
        });
      } catch (error) {
        console.error('❌ Error generating Excel PDS:', error);
        return NextResponse.json(
          { success: false, error: `Failed to generate Excel PDS: ${error instanceof Error ? error.message : String(error)}` },
          { status: 500 }
        );
      }
    }

    // Generate PDF using appropriate generator based on format
    const doc = format === 'csc'
      ? await generateCSCFormatPDF(transformedPDSData, includeSignature, true, useCurrentDate)
      : await generatePDSPDF(transformedPDSData, includeSignature, true, useCurrentDate);

    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate PDF document' },
        { status: 500 }
      );
    }

    const pdfBuffer = doc.output('arraybuffer');

    // Create filename with format indicator
    const surname = pdsData.personal_info?.surname || applicantName.split(' ')[0] || 'Unknown';
    const firstName = pdsData.personal_info?.firstName || applicantName.split(' ').slice(1).join('_') || 'User';
    const formatLabel = format === 'csc' ? 'CSC' : 'Modern';
    const fileName = `PDS_${formatLabel}_${surname}_${firstName}_${new Date().getTime()}.pdf`;

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDS PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}