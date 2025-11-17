/**
 * Database Migration Script: Fix Eligibility Counts
 *
 * This script re-calculates matched_eligibilities_count for all existing
 * ranked applications using the FIXED algorithms.
 *
 * BEFORE FIX:
 * - Algorithms counted HOW MANY JOB REQUIREMENTS were matched
 * - Juan Antonio: 1 eligibility matched 2 requirements → count = 2 ❌
 *
 * AFTER FIX:
 * - Algorithms count HOW MANY UNIQUE APPLICANT ELIGIBILITIES matched
 * - Juan Antonio: 1 eligibility matched 2 requirements → count = 1 ✅
 *
 * Usage:
 *   ts-node scripts/fix-eligibility-counts.ts
 */

import { createClient } from '@supabase/supabase-js';
import { ensembleScore } from '../src/lib/gemini/scoringAlgorithms';
import type { JobRequirements, ApplicantData } from '../src/lib/gemini/scoringAlgorithms';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface Application {
  id: string;
  applicant_id: string;
  job_id: string;
  matched_eligibilities_count: number;
}

interface Job {
  id: string;
  title: string;
  degree_requirement: string;
  eligibilities: string[];
  skills: string[];
  years_of_experience: number;
}

// Applicant profile is fetched directly from applicant_profiles table

async function main() {
  console.log('🔧 Database Migration: Fix Eligibility Counts');
  console.log('═══════════════════════════════════════════════\n');

  // Step 1: Fetch all applications with rankings
  console.log('📊 Step 1: Fetching all ranked applications...');
  const { data: applications, error: appsError } = await supabase
    .from('applications')
    .select('id, applicant_id, job_id, matched_eligibilities_count')
    .not('rank', 'is', null)
    .order('job_id');

  if (appsError) {
    console.error('❌ Error fetching applications:', appsError);
    process.exit(1);
  }

  console.log(`✓ Found ${applications?.length || 0} ranked applications\n`);

  if (!applications || applications.length === 0) {
    console.log('✅ No applications to migrate');
    return;
  }

  // Step 2: Process each application
  let successCount = 0;
  let errorCount = 0;
  let unchangedCount = 0;

  console.log('🔄 Step 2: Re-calculating eligibility counts...\n');

  for (let i = 0; i < applications.length; i++) {
    const app = applications[i] as Application;
    const progress = `[${i + 1}/${applications.length}]`;

    try {
      // Fetch job details
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', app.job_id)
        .single();

      if (jobError || !job) {
        console.error(`${progress} ❌ Job not found for application ${app.id}`);
        errorCount++;
        continue;
      }

      // Fetch applicant profile from applicant_profiles table
      const { data: applicantProfile, error: profileError } = await supabase
        .from('applicant_profiles')
        .select('*')
        .eq('user_id', app.applicant_id)
        .single();

      if (profileError || !applicantProfile) {
        console.error(`${progress} ❌ Applicant profile not found for ${app.applicant_id}`);
        errorCount++;
        continue;
      }

      // Extract eligibilities from JSONB
      const eligibilitiesData = applicantProfile.eligibilities || [];
      const eligibilities = Array.isArray(eligibilitiesData)
        ? eligibilitiesData
            .filter((e: any) => e && e.eligibilityTitle)
            .map((e: any) => ({
              eligibilityTitle: e.eligibilityTitle || ''
            }))
        : [];

      // Extract skills from array
      const skills = Array.isArray(applicantProfile.skills)
        ? applicantProfile.skills
        : [];

      // Extract work experience titles from JSONB
      const workExpData = applicantProfile.work_experience || [];
      const workExperienceTitles = Array.isArray(workExpData)
        ? workExpData
            .map((w: any) => w.positionTitle || w.position || w.title || '')
            .filter(Boolean)
        : [];

      // Prepare data for scoring
      const jobRequirements: JobRequirements = {
        title: (job as Job).title,
        degreeRequirement: (job as Job).degree_requirement || 'None',
        eligibilities: (job as Job).eligibilities || [],
        skills: (job as Job).skills || [],
        yearsOfExperience: (job as Job).years_of_experience || 0
      };

      const applicantData: ApplicantData = {
        highestEducationalAttainment: applicantProfile.highest_educational_attainment || '',
        eligibilities,
        skills,
        totalYearsExperience: Number(applicantProfile.total_years_experience) || 0,
        workExperienceTitles
      };

      // Re-calculate using FIXED algorithms
      const scoreBreakdown = ensembleScore(jobRequirements, applicantData);
      const newCount = scoreBreakdown.matchedEligibilitiesCount;
      const oldCount = app.matched_eligibilities_count;

      // Update database if count changed
      if (newCount !== oldCount) {
        const { error: updateError } = await supabase
          .from('applications')
          .update({ matched_eligibilities_count: newCount })
          .eq('id', app.id);

        if (updateError) {
          console.error(`${progress} ❌ Failed to update application ${app.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`${progress} ✅ Updated: ${oldCount} → ${newCount} (Job: ${jobRequirements.title})`);
          successCount++;
        }
      } else {
        unchangedCount++;
      }

    } catch (error) {
      console.error(`${progress} ❌ Error processing application ${app.id}:`, error);
      errorCount++;
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 Migration Summary');
  console.log('═══════════════════════════════════════════════');
  console.log(`✅ Updated:    ${successCount}`);
  console.log(`➖ Unchanged:  ${unchangedCount}`);
  console.log(`❌ Errors:     ${errorCount}`);
  console.log(`📝 Total:      ${applications.length}`);
  console.log('═══════════════════════════════════════════════\n');

  if (successCount > 0) {
    console.log('✨ Migration completed successfully!');
  } else if (errorCount > 0) {
    console.log('⚠️ Migration completed with errors');
  } else {
    console.log('ℹ️ No changes needed');
  }
}

// Run migration
main()
  .then(() => {
    console.log('\n✅ Script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
