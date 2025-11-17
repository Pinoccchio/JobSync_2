import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PDS Retrieval by ID API Route
 *
 * Endpoint:
 * - GET /api/pds/[id] - Retrieve specific PDS by ID (for HR/PESO viewing)
 */

// GET /api/pds/[id] - Retrieve specific PDS by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: pdsId } = await params;

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // 2. Get user profile to check role
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

    // 3. Fetch PDS data
    // If user is HR/ADMIN/PESO, they can view any PDS
    // If user is APPLICANT, they can only view their own PDS
    let query = supabase
      .from('applicant_pds')
      .select('*')
      .eq('id', pdsId)
      .single();

    const { data: pds, error: pdsError } = await query;

    // If no PDS found
    if (pdsError && pdsError.code === 'PGRST116') {
      return NextResponse.json({
        success: false,
        error: 'PDS not found',
      }, { status: 404 });
    }

    if (pdsError) {
      console.error('Error fetching PDS:', pdsError);
      return NextResponse.json(
        { success: false, error: pdsError.message },
        { status: 500 }
      );
    }

    // 4. Authorization check: APPLICANT can only view their own PDS
    if (profile.role === 'APPLICANT' && pds.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only view your own PDS' },
        { status: 403 }
      );
    }

    // 5. Return PDS data
    return NextResponse.json({
      success: true,
      data: pds,
    });

  } catch (error: any) {
    console.error('Server error in GET /api/pds/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
