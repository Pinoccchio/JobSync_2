import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContent, parseGeminiJSON, RANKING_PROMPTS } from '@/lib/gemini';

/**
 * Gemini AI Ranking API Routes
 *
 * TODO: Implement the following endpoints:
 * - POST /api/gemini/rank - Rank single applicant for a job
 * - POST /api/gemini/rank-all - Rank all applicants for a job
 * - POST /api/gemini/re-rank - Re-rank applicants (triggered when job is edited)
 *
 * Ranking Algorithm Requirements:
 * 1. Education Match Algorithm - Weighted scoring (degree level 40%, relevance 40%, certs 20%)
 * 2. Experience Match Algorithm - Exponential scoring based on years + seniority
 * 3. Skills & Eligibility Match - Tie-breaker using skill coverage + eligibility bonus
 *
 * All algorithms must be mathematically justified and use Gemini AI for scoring.
 */

interface RankingRequest {
  job_id: string;
  applicant_id: string;
  job_requirements: {
    degree: string;
    eligibilities: string[];
    skills: string[];
    years_of_experience: number;
  };
  applicant_data: {
    education: any[];
    experience: any[];
    skills: string[];
    eligibilities: string[];
  };
}

interface ScoreResponse {
  score: number;
  reasoning: string;
  algorithm: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: RankingRequest = await request.json();

    // TODO: Implement full ranking system
    // This is a DEMO showing how to use Gemini AI

    // Step 1: Education Match (Algorithm 1)
    const educationPrompt = `
${RANKING_PROMPTS.educationMatch}

Job Requirements:
- Required Degree: ${body.job_requirements.degree}

Applicant Education:
${JSON.stringify(body.applicant_data.education, null, 2)}
`;

    const educationResponse = await generateContent(educationPrompt);
    const educationScore: ScoreResponse = parseGeminiJSON(educationResponse);

    // Step 2: Experience Match (Algorithm 2)
    const experiencePrompt = `
${RANKING_PROMPTS.experienceMatch}

Job Requirements:
- Years of Experience: ${body.job_requirements.years_of_experience}

Applicant Experience:
${JSON.stringify(body.applicant_data.experience, null, 2)}
`;

    const experienceResponse = await generateContent(experiencePrompt);
    const experienceScore: ScoreResponse = parseGeminiJSON(experienceResponse);

    // Step 3: Skills Match (Algorithm 3 - Tie-breaker)
    const skillsPrompt = `
${RANKING_PROMPTS.skillsMatch}

Job Requirements:
- Required Skills: ${body.job_requirements.skills.join(', ')}
- Required Eligibilities: ${body.job_requirements.eligibilities.join(', ')}

Applicant:
- Skills: ${body.applicant_data.skills.join(', ')}
- Eligibilities: ${body.applicant_data.eligibilities.join(', ')}
`;

    const skillsResponse = await generateContent(skillsPrompt);
    const skillsScore: ScoreResponse = parseGeminiJSON(skillsResponse);

    // Calculate final weighted score (ensemble approach)
    const finalScore = (
      educationScore.score * 0.35 +
      experienceScore.score * 0.40 +
      skillsScore.score * 0.25
    );

    // TODO: Save scores to database
    // await supabase.from('application_scores').insert({
    //   application_id: body.applicant_id,
    //   education_score: educationScore.score,
    //   experience_score: experienceScore.score,
    //   skills_score: skillsScore.score,
    //   final_score: finalScore,
    //   algorithm_details: { educationScore, experienceScore, skillsScore }
    // });

    return NextResponse.json({
      message: 'Ranking completed',
      scores: {
        education: educationScore,
        experience: experienceScore,
        skills: skillsScore,
        final: {
          score: finalScore,
          algorithm: 'Ensemble Weighted Average: Education (35%), Experience (40%), Skills (25%)',
        },
      },
    });
  } catch (error: any) {
    console.error('Gemini ranking error:', error);
    return NextResponse.json(
      { error: error.message || 'Ranking failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Gemini AI Ranking API',
    algorithms: [
      '1. Education Match - Weighted scoring (degree 40%, relevance 40%, certs 20%)',
      '2. Experience Match - Exponential scoring (years * 15 + seniority_multiplier)',
      '3. Skills & Eligibility - Tie-breaker (skill_coverage * 70 + eligibility * 30)',
    ],
    ensemble: 'Final Score = Education(35%) + Experience(40%) + Skills(25%)',
  });
}
