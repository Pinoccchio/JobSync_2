/**
 * API Endpoint: Rank Applicants for a Specific Job
 * POST /api/jobs/[id]/rank
 *
 * This endpoint triggers the Gemini AI-powered ranking system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { rankApplicantsForJob } from '@/lib/gemini/rankApplicants';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Use service role key to bypass RLS for ranking operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // 2. Fetch all pending applications for this job with applicant profiles AND PDS data
    const { data: applications, error: applicationsError } = await supabase
      .from('applications')
      .select(`
        id,
        applicant_id,
        applicant_profile_id,
        pds_id,
        applicant_profiles (
          id,
          first_name,
          surname,
          highest_educational_attainment,
          total_years_experience,
          skills,
          eligibilities
        ),
        applicant_pds!pds_id (
          id,
          user_id,
          educational_background,
          work_experience,
          eligibility,
          other_information
        )
      `)
      .eq('job_id', jobId)
      .eq('status', 'pending');

    console.log('Applications query result:', { applications, error: applicationsError, jobId });

    if (applicationsError) {
      return NextResponse.json(
        { error: 'Failed to fetch applications', details: applicationsError.message },
        { status: 500 }
      );
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json(
        { message: 'No pending applications to rank' },
        { status: 200 }
      );
    }

    // 3. Prepare applicant data for ranking
    // Extract data from PDS (preferred) or applicant_profiles (fallback)
    const applicantsData = applications
      .filter(app => {
        // Skip applications without either PDS or profile data
        if (!app.applicant_pds && !app.applicant_profiles) {
          console.warn(`Skipping application ${app.id}: missing both PDS and profile data`);
          return false;
        }
        return true;
      })
      .map(app => {
        const profile = app.applicant_profiles as any;
        const pds = app.applicant_pds as any;

        // --- EXTRACT HIGHEST EDUCATION ---
        let highestEducation = profile?.highest_educational_attainment || 'Not specified';

        if (pds?.educational_background && Array.isArray(pds.educational_background)) {
          // Education level hierarchy (highest to lowest)
          const levels: Record<string, number> = {
            'GRADUATE STUDIES': 5,
            'COLLEGE': 4,
            'VOCATIONAL': 3,
            'SECONDARY': 2,
            'ELEMENTARY': 1
          };

          const highest = pds.educational_background
            .filter((edu: any) => edu && edu.level)
            .reduce((max: any, current: any) => {
              const currentLevel = levels[current.level.toUpperCase() as keyof typeof levels] || 0;
              const maxLevel = max ? (levels[max.level.toUpperCase() as keyof typeof levels] || 0) : 0;
              return currentLevel > maxLevel ? current : max;
            }, null);

          if (highest) {
            // Extract degree name only (not level prefix) to match algorithm expectations
            // Use basicEducationDegreeCourse (actual PDS field) with fallbacks
            highestEducation = highest.basicEducationDegreeCourse || highest.course || highest.level;
          }
        }

        // --- CALCULATE TOTAL YEARS OF EXPERIENCE ---
        let totalYears = profile?.total_years_experience || 0;

        // Helper function to get current date/time in Philippine timezone (UTC+8)
        const getPhilippineTime = (): Date => {
          const now = new Date();
          // Get UTC time and add 8 hours for Philippine timezone (UTC+8)
          const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
          const philippineTime = new Date(utcTime + (8 * 3600000)); // UTC + 8 hours
          return philippineTime;
        };

        // Helper function to parse dates in multiple formats
        const parseFlexibleDate = (dateStr: string): Date | null => {
          if (!dateStr || dateStr === 'Present') return null;

          // Try ISO format first (YYYY-MM-DD)
          let parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) return parsed;

          // Try MM/DD/YYYY format
          const mmddyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (mmddyyyy) {
            parsed = new Date(`${mmddyyyy[3]}-${mmddyyyy[1].padStart(2, '0')}-${mmddyyyy[2].padStart(2, '0')}`);
            if (!isNaN(parsed.getTime())) return parsed;
          }

          // Try DD/MM/YYYY format
          const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (ddmmyyyy) {
            parsed = new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`);
            if (!isNaN(parsed.getTime())) return parsed;
          }

          console.warn(`⚠️ Could not parse date: "${dateStr}"`);
          return null;
        };

        if (pds?.work_experience && Array.isArray(pds.work_experience)) {
          console.log(`📝 Processing ${pds.work_experience.length} work experience records for ${profile?.first_name} ${profile?.surname}`);

          totalYears = pds.work_experience
            .filter((work: any) => {
              if (!work) return false;
              // Check for dates in nested periodOfService object first, then direct properties
              const hasFrom = work.periodOfService?.from || work.from || work.fromDate || work.dateFrom;
              const hasTo = work.periodOfService?.to || work.to || work.toDate || work.dateTo;
              if (!hasFrom || !hasTo) {
                console.warn(`⚠️ Work experience missing dates:`, { work });
              }
              return hasFrom && hasTo;
            })
            .reduce((total: number, work: any) => {
              try {
                // Check multiple possible field names for dates (including nested periodOfService)
                const fromDateStr = work.periodOfService?.from || work.from || work.fromDate || work.dateFrom;
                const toDateStr = work.periodOfService?.to || work.to || work.toDate || work.dateTo;

                const from = parseFlexibleDate(fromDateStr);
                const to = (toDateStr === 'Present' || toDateStr === 'present')
                  ? getPhilippineTime() // ✅ Use Philippine timezone (UTC+8) for "Present"
                  : parseFlexibleDate(toDateStr);

                if (!from || !to) {
                  console.warn(`⚠️ Invalid work dates: from="${fromDateStr}", to="${toDateStr}"`);
                  return total;
                }

                const years = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                const calculatedYears = Math.max(0, years);

                console.log(`  ✓ Work experience: ${work.positionTitle || work.position || 'Unknown'} - ${calculatedYears.toFixed(1)} years`);
                return total + calculatedYears;
              } catch (error) {
                console.error(`❌ Error calculating work experience duration:`, error, work);
                return total;
              }
            }, 0);

          // Round to 1 decimal place and fix floating-point precision issues
          totalYears = Math.round(totalYears * 10) / 10;
          totalYears = parseFloat(totalYears.toFixed(1)); // Eliminate floating-point artifacts
          console.log(`📊 Total work experience: ${totalYears} years`);
        } else {
          console.log(`⚠️ No work experience array found in PDS for ${profile?.first_name} ${profile?.surname}`);
        }

        // --- EXTRACT SKILLS ---
        let skills: string[] = profile?.skills || [];

        // Check multiple possible locations for skills in PDS
        const extractSkills = (data: any): string[] => {
          const extracted: string[] = [];

          // Location 1: other_information.skills
          const skillsData = data?.other_information?.skills || data?.skills;

          if (Array.isArray(skillsData)) {
            // Skills are array of objects: [{skillName: "..."}, ...] or array of strings
            skillsData.forEach((s: any) => {
              if (typeof s === 'string' && s.trim()) {
                extracted.push(s.trim());
              } else if (s && s.skillName && typeof s.skillName === 'string') {
                extracted.push(s.skillName.trim());
              } else if (s && s.name && typeof s.name === 'string') {
                extracted.push(s.name.trim());
              }
            });
          } else if (typeof skillsData === 'string') {
            // If skills is a JSON string, parse it
            try {
              const parsed = JSON.parse(skillsData);
              if (Array.isArray(parsed)) {
                return extractSkills({ other_information: { skills: parsed } });
              } else {
                // Single skill as string
                extracted.push(skillsData.trim());
              }
            } catch (error) {
              // Not JSON, treat as single skill
              if (skillsData.trim()) {
                extracted.push(skillsData.trim());
              }
            }
          }

          // Location 2: other_information.specialSkills
          if (data?.other_information?.specialSkills && Array.isArray(data.other_information.specialSkills)) {
            data.other_information.specialSkills.forEach((s: any) => {
              if (typeof s === 'string' && s.trim()) {
                extracted.push(s.trim());
              } else if (s && (s.skillName || s.name)) {
                extracted.push((s.skillName || s.name).trim());
              }
            });
          }

          // Location 3: other_information.skills_hobbies
          if (data?.other_information?.skills_hobbies && Array.isArray(data.other_information.skills_hobbies)) {
            data.other_information.skills_hobbies.forEach((s: any) => {
              if (typeof s === 'string' && s.trim()) {
                extracted.push(s.trim());
              } else if (s && (s.skillName || s.name)) {
                extracted.push((s.skillName || s.name).trim());
              }
            });
          }

          return [...new Set(extracted)]; // Remove duplicates
        };

        if (pds) {
          const pdsSkills = extractSkills(pds);
          if (pdsSkills.length > 0) {
            skills = pdsSkills;
            console.log(`  ✓ Extracted ${skills.length} skills from PDS:`, skills);
          } else {
            console.log(`⚠️ No skills found in PDS. Raw other_information:`, JSON.stringify(pds.other_information || {}, null, 2));
          }
        }

        // --- EXTRACT ELIGIBILITIES ---
        let eligibilities: Array<{eligibilityTitle: string}> = profile?.eligibilities || [];

        // Check multiple possible field names for eligibilities
        const extractEligibilities = (data: any): Array<{eligibilityTitle: string}> => {
          const extracted: Array<{eligibilityTitle: string}> = [];

          // Try multiple possible field names
          const eligData = data?.eligibility || data?.eligibilities || data?.civil_service_eligibilities;

          if (Array.isArray(eligData)) {
            eligData.forEach((e: any) => {
              if (!e) return;

              // Try multiple possible field names for the title
              // IMPORTANT: Check 'careerService' first (the actual field name in PDS forms)
              const title = e.careerService || e.eligibilityTitle || e.title || e.name || e.eligibility || e.eligibilityName;

              if (title && typeof title === 'string' && title.trim()) {
                extracted.push({ eligibilityTitle: title.trim() });
              } else if (typeof e === 'string' && e.trim()) {
                // Eligibility stored as plain string
                extracted.push({ eligibilityTitle: e.trim() });
              }
            });
          }

          return extracted;
        };

        if (pds) {
          const pdsEligibilities = extractEligibilities(pds);
          if (pdsEligibilities.length > 0) {
            eligibilities = pdsEligibilities;
            console.log(`  ✓ Extracted ${eligibilities.length} eligibilities from PDS:`, eligibilities.map(e => e.eligibilityTitle));
          } else {
            console.log(`⚠️ No eligibilities found in PDS. Raw eligibility data:`, JSON.stringify(pds.eligibility || pds.eligibilities || {}, null, 2));
          }
        }

        // --- EXTRACT WORK EXPERIENCE TITLES ---
        let workExperienceTitles: string[] = [];

        if (pds?.work_experience && Array.isArray(pds.work_experience)) {
          workExperienceTitles = pds.work_experience
            .filter((work: any) => {
              if (!work) return false;
              const title = work.positionTitle || work.position || work.jobTitle;
              return title && typeof title === 'string';
            })
            .map((work: any) => {
              const title = work.positionTitle || work.position || work.jobTitle;
              return title.trim();
            })
            .filter((title: string) => title && title.length > 0);

          console.log(`  ✓ Extracted ${workExperienceTitles.length} work experience titles:`, workExperienceTitles);
        }

        // --- COMPREHENSIVE DATA VALIDATION ---
        console.log(`\n═══════════════════════════════════════════════════`);
        console.log(`📊 FINAL EXTRACTED DATA for ${profile?.first_name} ${profile?.surname}`);
        console.log(`═══════════════════════════════════════════════════`);
        console.log(`  🎓 Education: ${highestEducation}`);
        console.log(`  💼 Total Experience: ${totalYears} years`);
        console.log(`  📝 Work Titles: ${workExperienceTitles.length} (${workExperienceTitles.join(', ') || 'None'})`);
        console.log(`  🔧 Skills: ${skills.length} (${skills.join(', ') || 'None'})`);
        console.log(`  🏆 Eligibilities: ${eligibilities.length} (${eligibilities.map(e => e.eligibilityTitle).join(', ') || 'None'})`);
        console.log(`  📦 Data Source: ${pds ? 'PDS (Web Form)' : 'Profile (Fallback)'}`);

        // Validation warnings
        if (pds && totalYears === 0 && pds.work_experience && Array.isArray(pds.work_experience) && pds.work_experience.length > 0) {
          console.warn(`⚠️ WARNING: Work experience records exist but years calculated as 0!`);
          console.warn(`   Raw work experience data:`, JSON.stringify(pds.work_experience, null, 2));
        }

        if (pds && skills.length === 0) {
          console.warn(`⚠️ WARNING: No skills extracted from PDS!`);
          console.warn(`   Check if skills are properly saved in other_information`);
        }

        if (pds && eligibilities.length === 0) {
          console.warn(`⚠️ WARNING: No eligibilities extracted from PDS!`);
          console.warn(`   Check if eligibilities are properly saved`);
        }

        console.log(`═══════════════════════════════════════════════════\n`);

        return {
          applicationId: app.id,
          applicantId: app.applicant_id,
          applicantProfileId: app.applicant_profile_id,
          applicantName: `${profile?.first_name || 'Unknown'} ${profile?.surname || ''}`.trim(),
          highestEducationalAttainment: highestEducation,
          eligibilities: eligibilities,
          skills: skills,
          totalYearsExperience: totalYears,
          workExperienceTitles: workExperienceTitles
        };
      });

    // Check if we have any eligible applications to rank after filtering
    if (applicantsData.length === 0) {
      return NextResponse.json(
        { message: 'No eligible applications to rank (missing profile data). Please ensure applicants have completed their profiles.' },
        { status: 200 }
      );
    }

    // 3.5. Update applicant_profiles with extracted PDS data for frontend display
    console.log('💾 Saving extracted data to applicant_profiles...');
    for (const applicantData of applicantsData) {
      if (applicantData.applicantProfileId) {
        const { error: profileUpdateError } = await supabase
          .from('applicant_profiles')
          .update({
            highest_educational_attainment: applicantData.highestEducationalAttainment,
            total_years_experience: applicantData.totalYearsExperience,
            skills: applicantData.skills,
            eligibilities: applicantData.eligibilities
          })
          .eq('id', applicantData.applicantProfileId);

        if (profileUpdateError) {
          console.error(`❌ Failed to update applicant_profiles ${applicantData.applicantProfileId}:`, profileUpdateError);
        } else {
          console.log(`✅ Updated profile for ${applicantData.applicantName}`);
        }
      }
    }

    // 4. Rank applicants using Gemini AI-powered algorithms
    console.log(`Ranking ${applicantsData.length} applicants for job: ${job.title}`);

    const rankedApplicants = await rankApplicantsForJob(
      {
        id: job.id,
        title: job.title, // Include job title for relevance matching
        description: job.description, // Include description for context
        degreeRequirement: job.degree_requirement,
        eligibilities: job.eligibilities || [],
        skills: job.skills || [],
        yearsOfExperience: job.years_of_experience || 0
      },
      applicantsData
    );

    // 5. Update applications with ranking results
    const updates = rankedApplicants.map(applicant => {
      const appData = applicantsData.find(a => a.applicantId === applicant.applicantId);

      // Debug logging for match counts before database save
      console.log(`🔍 [API] Preparing update for ${applicant.applicantName}:`, {
        rank: applicant.rank,
        matchedSkillsCount: applicant.matchedSkillsCount,
        matchedEligibilitiesCount: applicant.matchedEligibilitiesCount,
        eligibilityScore: applicant.eligibilityScore
      });

      return {
        id: appData!.applicationId,
        rank: applicant.rank,
        match_score: applicant.matchScore,
        education_score: applicant.educationScore,
        experience_score: applicant.experienceScore,
        skills_score: applicant.skillsScore,
        eligibility_score: applicant.eligibilityScore,
        algorithm_used: applicant.algorithmUsed,
        ranking_reasoning: applicant.rankingReasoning + (applicant.geminiInsights ? ` | Gemini Insight: ${applicant.geminiInsights}` : ''),
        algorithm_details: applicant.algorithmDetails ? JSON.stringify(applicant.algorithmDetails) : null,
        matched_skills_count: applicant.matchedSkillsCount,
        matched_eligibilities_count: applicant.matchedEligibilitiesCount
      };
    });

    // Batch update all applications
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          rank: update.rank,
          match_score: update.match_score,
          education_score: update.education_score,
          experience_score: update.experience_score,
          skills_score: update.skills_score,
          eligibility_score: update.eligibility_score,
          algorithm_used: update.algorithm_used,
          ranking_reasoning: update.ranking_reasoning,
          algorithm_details: update.algorithm_details,
          matched_skills_count: update.matched_skills_count,
          matched_eligibilities_count: update.matched_eligibilities_count
        })
        .eq('id', update.id);

      if (updateError) {
        console.error(`Failed to update application ${update.id}:`, updateError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ranked ${rankedApplicants.length} applicants for ${job.title}`,
      jobId: job.id,
      jobTitle: job.title,
      totalApplicants: rankedApplicants.length,
      rankings: rankedApplicants.map(r => ({
        rank: r.rank,
        applicantName: r.applicantName,
        matchScore: r.matchScore,
        algorithm: r.algorithmUsed
      }))
    });

  } catch (error: any) {
    console.error('Error ranking applicants:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check current rankings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Use service role key to bypass RLS for ranking operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        id,
        rank,
        match_score,
        education_score,
        experience_score,
        skills_score,
        eligibility_score,
        algorithm_used,
        ranking_reasoning,
        status,
        applicant_profiles (
          first_name,
          surname,
          highest_educational_attainment,
          total_years_experience
        )
      `)
      .eq('job_id', jobId)
      .order('rank', { ascending: true, nullsFirst: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch rankings', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      totalApplicants: applications?.length || 0,
      rankedApplicants: applications?.filter(a => a.rank !== null).length || 0,
      unrankedApplicants: applications?.filter(a => a.rank === null).length || 0,
      applications: applications || []
    });

  } catch (error: any) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
