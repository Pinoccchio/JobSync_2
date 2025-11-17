import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/applicants/[id]/profile
 * Fetch applicant profile data (OCR-extracted or web-based PDS)
 *
 * This endpoint retrieves structured applicant data from the applicant_profiles table.
 * Used by HR to view PDS data for applications using uploaded PDFs (OCR-processed).
 *
 * Authorization: HR and ADMIN only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: applicantId } = await params;

    if (!applicantId) {
      return NextResponse.json(
        { success: false, error: 'Missing applicant ID' },
        { status: 400 }
      );
    }

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // 2. Check user role - only HR and ADMIN can access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (profile.role !== 'HR' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - HR or ADMIN access required' },
        { status: 403 }
      );
    }

    // 3. Fetch applicant_profiles data with email from profiles table
    const { data: applicantProfile, error: fetchError } = await supabase
      .from('applicant_profiles')
      .select(`
        id,
        user_id,
        surname,
        first_name,
        middle_name,
        date_of_birth,
        place_of_birth,
        sex,
        civil_status,
        citizenship,
        height,
        weight,
        blood_type,
        residential_address,
        permanent_address,
        phone_number,
        mobile_number,
        education,
        work_experience,
        eligibilities,
        skills,
        trainings_attended,
        total_years_experience,
        highest_educational_attainment,
        ocr_processed,
        extraction_confidence,
        extraction_date,
        ai_processed,
        created_at,
        updated_at,
        profiles:user_id (
          email
        )
      `)
      .eq('user_id', applicantId)
      .single();

    if (fetchError) {
      console.error('Error fetching applicant profile:', fetchError);

      // Handle case where applicant_profile doesn't exist yet
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Applicant profile not found',
            details: 'This applicant has not completed their profile or uploaded a PDS yet.'
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!applicantProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Applicant profile not found',
          details: 'This applicant has not completed their profile or uploaded a PDS yet.'
        },
        { status: 404 }
      );
    }

    // 4. Transform data to format expected by PDSViewModal (matches applicant_pds structure)
    const transformedData = {
      // Personal Information - matches PDSViewModal expected format
      personal_info: {
        surname: applicantProfile.surname || '',
        firstName: applicantProfile.first_name || '',
        middleName: applicantProfile.middle_name || '',
        nameExtension: '', // Not captured in OCR
        dateOfBirth: applicantProfile.date_of_birth || '',
        placeOfBirth: applicantProfile.place_of_birth || '',
        sex: applicantProfile.sex || '',
        sexAtBirth: applicantProfile.sex || '', // PDSViewModal expects this field name
        civilStatus: applicantProfile.civil_status || '',
        height: applicantProfile.height || '',
        weight: applicantProfile.weight || '',
        bloodType: applicantProfile.blood_type || '',
        citizenship: applicantProfile.citizenship || '',

        // Address fields - stored as TEXT in applicant_profiles (OCR extracts as plain text)
        // formatAddress() utility now handles both string and object formats
        residentialAddress: applicantProfile.residential_address || '',
        permanentAddress: applicantProfile.permanent_address || '',

        // Contact info - map to correct field names (handle both naming conventions)
        phoneNumber: applicantProfile.phone_number || '',
        telephoneNo: applicantProfile.phone_number || '', // Modal expects this field name
        mobileNumber: applicantProfile.mobile_number || '',
        mobileNo: applicantProfile.mobile_number || '', // Alternative field name
        email: (applicantProfile as any).profiles?.email || '', // Email from profiles table
        emailAddress: (applicantProfile as any).profiles?.email || '', // Alternative field name

        // Government IDs - not captured by current OCR (will show N/A for now)
        // Future OCR improvements will populate these fields
        gsisIdNo: '',
        umidNo: '',
        pagibigNo: '',
        pagibigIdNo: '',
        philhealthNo: '',
        philsysNo: '',
        sssNo: '',
        tinNo: '',
        agencyEmployeeNo: '',
      },

      // Family Background - not captured in OCR
      family_background: {},

      // Educational Background - matches PDSViewModal format
      educational_background: applicantProfile.education || [],

      // Work Experience - matches PDSViewModal format
      work_experience: applicantProfile.work_experience || [],

      // Eligibility - matches PDSViewModal format
      eligibility: applicantProfile.eligibilities || [],

      // Trainings - matches PDSViewModal format
      trainings: applicantProfile.trainings_attended || [],

      // Voluntary Work - not captured in OCR
      voluntary_work: [],

      // Other Information - include skills
      other_information: {
        skills: applicantProfile.skills || [],
        totalYearsExperience: applicantProfile.total_years_experience || 0,
        highestEducationalAttainment: applicantProfile.highest_educational_attainment || '',
      },

      // OCR Metadata - for debugging and quality tracking
      ocr_processed: applicantProfile.ocr_processed || false,
      extraction_confidence: applicantProfile.extraction_confidence || 0,
      extraction_date: applicantProfile.extraction_date || null,
      ai_processed: applicantProfile.ai_processed || false,

      // Timestamps
      created_at: applicantProfile.created_at,
      updated_at: applicantProfile.updated_at,
    };

    // 5. Return success response
    return NextResponse.json({
      success: true,
      data: transformedData,
      metadata: {
        applicantId: applicantProfile.user_id,
        profileId: applicantProfile.id,
        dataSource: 'ocr', // Data from OCR-processed uploaded PDF
        ocrProcessed: applicantProfile.ocr_processed || false,
        confidence: applicantProfile.extraction_confidence || 0,
        extractionDate: applicantProfile.extraction_date || null,
        lastUpdated: applicantProfile.updated_at,
      },
    });

  } catch (error: any) {
    console.error('Server error in GET /api/applicants/[id]/profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
