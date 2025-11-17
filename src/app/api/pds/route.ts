import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PDS Management API Routes
 *
 * Endpoints:
 * - GET /api/pds - Retrieve user's PDS data
 * - POST /api/pds - Create new PDS
 * - PUT /api/pds - Update existing PDS (auto-save)
 */

// GET /api/pds - Retrieve user's PDS data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Fetch PDS data for current user
    const { data: pds, error: pdsError } = await supabase
      .from('applicant_pds')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no PDS found, return empty structure
    if (pdsError && pdsError.code === 'PGRST116') {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No PDS found for this user',
      });
    }

    if (pdsError) {
      console.error('Error fetching PDS:', pdsError);
      return NextResponse.json(
        { success: false, error: pdsError.message },
        { status: 500 }
      );
    }

    // Ensure all array fields have defaults to prevent undefined errors
    return NextResponse.json({
      success: true,
      data: {
        ...pds,
        educational_background: pds.educational_background || [],
        eligibility: pds.eligibility || [],
        work_experience: pds.work_experience || [],
        voluntary_work: pds.voluntary_work || [],
        trainings: pds.trainings || [],
        // Ensure nested objects have array defaults
        family_background: {
          children: [],
          ...(pds.family_background || {}),
        },
        other_information: {
          skills: [],
          references: [],
          recognitions: [],
          memberships: [],
          ...(pds.other_information || {}),
        },
      },
    });

  } catch (error) {
    console.error('Server error in GET /api/pds:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/pds - Create new PDS
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Check if user already has a PDS
    const { data: existingPDS } = await supabase
      .from('applicant_pds')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingPDS) {
      return NextResponse.json(
        { success: false, error: 'PDS already exists. Use PUT to update.' },
        { status: 409 }
      );
    }

    // VALIDATION: Ensure completion_percentage is always 0-100 (database constraint)
    const validatedPercentage = typeof body.completionPercentage === 'number'
      ? Math.max(0, Math.min(100, Math.round(body.completionPercentage)))
      : 0;

    // Extract signature data from otherInformation.declaration if exists
    const signatureUrl = body.otherInformation?.declaration?.signatureUrl || null;
    const signatureUploadedAt = body.otherInformation?.declaration?.signatureUploadedAt || null;

    // Create new PDS
    const { data: pds, error: insertError } = await supabase
      .from('applicant_pds')
      .insert({
        user_id: user.id,
        personal_info: body.personalInfo || {},
        family_background: body.familyBackground || {},
        educational_background: body.educationalBackground || [],
        eligibility: body.eligibility || [],
        work_experience: body.workExperience || [],
        voluntary_work: body.voluntaryWork || [],
        trainings: body.trainings || [],
        other_information: body.otherInformation || {},
        completion_percentage: validatedPercentage,
        is_completed: body.isCompleted || false,
        last_saved_section: body.lastSavedSection || null,
        signature_url: signatureUrl,
        signature_uploaded_at: signatureUploadedAt,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating PDS:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pds,
      message: 'PDS created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Server error in POST /api/pds:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/pds - Update existing PDS (auto-save)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Build update object dynamically based on what was provided
    const updateData: any = {};

    if (body.personalInfo !== undefined) updateData.personal_info = body.personalInfo;
    if (body.familyBackground !== undefined) updateData.family_background = body.familyBackground;
    if (body.educationalBackground !== undefined) updateData.educational_background = body.educationalBackground;
    if (body.eligibility !== undefined) updateData.eligibility = body.eligibility;
    if (body.workExperience !== undefined) updateData.work_experience = body.workExperience;
    if (body.voluntaryWork !== undefined) updateData.voluntary_work = body.voluntaryWork;
    if (body.trainings !== undefined) updateData.trainings = body.trainings;
    if (body.otherInformation !== undefined) updateData.other_information = body.otherInformation;

    // Extract and save signature data from otherInformation.declaration if exists
    if (body.otherInformation?.declaration?.signatureUrl !== undefined) {
      updateData.signature_url = body.otherInformation.declaration.signatureUrl;
    }
    if (body.otherInformation?.declaration?.signatureUploadedAt !== undefined) {
      updateData.signature_uploaded_at = body.otherInformation.declaration.signatureUploadedAt;
    }

    // VALIDATION: Ensure completion_percentage is always 0-100 (database constraint)
    if (body.completionPercentage !== undefined) {
      const percentage = typeof body.completionPercentage === 'number'
        ? Math.max(0, Math.min(100, Math.round(body.completionPercentage)))
        : 0;
      updateData.completion_percentage = percentage;
    }

    if (body.isCompleted !== undefined) updateData.is_completed = body.isCompleted;
    if (body.lastSavedSection !== undefined) updateData.last_saved_section = body.lastSavedSection;

    // Update PDS
    const { data: pds, error: updateError } = await supabase
      .from('applicant_pds')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating PDS:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pds,
      message: 'PDS updated successfully',
    });

  } catch (error) {
    console.error('Server error in PUT /api/pds:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
