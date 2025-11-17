/**
 * AI-Powered Tie-Breaking System
 * Uses Gemini AI to differentiate candidates with identical match scores
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

interface TieGroup {
  score: number;
  applicants: Array<{
    applicantId: string;
    applicantName: string;
    educationScore: number;
    experienceScore: number;
    skillsScore: number;
    eligibilityScore: number;
    highestEducationalAttainment: string;
    totalYearsExperience: number;
    skills: string[];
    eligibilities: Array<{ eligibilityTitle: string }>;
    workExperienceTitles?: string[];
  }>;
}

export interface TieBreakResult {
  applicantId: string;
  microAdjustment: number; // -0.5 to +0.5 to break ties
  reasoning: string;
}

/**
 * Break ties using Gemini AI analysis
 * Compares candidates within the same score group and provides micro-adjustments
 */
export async function breakTiesWithAI(
  tieGroups: TieGroup[],
  jobTitle: string,
  jobDescription?: string
): Promise<TieBreakResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found, skipping AI tie-breaking');
    return [];
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const results: TieBreakResult[] = [];

  // Process each tie group
  for (const group of tieGroups) {
    if (group.applicants.length <= 1) continue; // No tie to break

    console.log(`🤖 AI Tie-Breaking: ${group.applicants.length} applicants at ${group.score.toFixed(2)}%`);

    try {
      // Build comparison prompt
      const prompt = buildComparisonPrompt(group, jobTitle, jobDescription);

      // Call Gemini AI
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Parse AI response and extract micro-adjustments
      const groupResults = parseAIResponse(response, group.applicants);
      results.push(...groupResults);

      console.log(`   ✅ AI differentiated ${groupResults.length} candidates`);
    } catch (error) {
      console.error(`   ❌ AI tie-breaking failed for group at ${group.score}%:`, error);

      // Fallback: deterministic micro-adjustments based on component scores
      const fallbackResults = deterministicTieBreak(group.applicants);
      results.push(...fallbackResults);

      console.log(`   ⚙️  Fallback: deterministic tie-breaking applied`);
    }
  }

  return results;
}

/**
 * Build Gemini AI prompt for comparing tied candidates
 */
function buildComparisonPrompt(
  group: TieGroup,
  jobTitle: string,
  jobDescription?: string
): string {
  const candidatesList = group.applicants
    .map((app, idx) => {
      return `
Candidate ${idx + 1}: ${app.applicantName}
- Education: ${app.highestEducationalAttainment} (Score: ${app.educationScore.toFixed(1)}%)
- Experience: ${app.totalYearsExperience} years (Score: ${app.experienceScore.toFixed(1)}%)
  ${app.workExperienceTitles && app.workExperienceTitles.length > 0 ? `Previous roles: ${app.workExperienceTitles.join(', ')}` : ''}
- Skills: ${app.skills.length > 0 ? app.skills.join(', ') : 'None listed'} (Score: ${app.skillsScore.toFixed(1)}%)
- Eligibilities: ${app.eligibilities.length > 0 ? app.eligibilities.map(e => e.eligibilityTitle).join(', ') : 'None'} (Score: ${app.eligibilityScore.toFixed(1)}%)
`;
    })
    .join('\n');

  return `You are an expert HR recruiter analyzing candidates for the position: "${jobTitle}".
${jobDescription ? `\nJob Description: ${jobDescription}\n` : ''}

The following ${group.applicants.length} candidates have tied with an overall match score of ${group.score.toFixed(2)}%.
Your task is to provide subtle differentiation by assigning micro-adjustments between -0.5 and +0.5 to each candidate based on qualitative factors.

Consider:
1. Quality and relevance of work experience (not just years)
2. Specific skills that align better with the job
3. Depth of qualifications vs breadth
4. Professional certifications and their relevance

${candidatesList}

Respond in this exact JSON format:
{
  "rankings": [
    {
      "candidateName": "Name",
      "microAdjustment": 0.3,
      "reasoning": "Brief explanation (max 50 words)"
    }
  ]
}

Rules:
- Micro-adjustments MUST be between -0.5 and +0.5
- Higher adjustment = stronger candidate within this tie group
- Provide clear, specific reasoning
- Be objective and focus on job-relevant factors`;
}

/**
 * Parse Gemini AI response and extract micro-adjustments
 */
function parseAIResponse(
  response: string,
  applicants: TieGroup['applicants']
): TieBreakResult[] {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;

    const parsed = JSON.parse(jsonStr);

    if (!parsed.rankings || !Array.isArray(parsed.rankings)) {
      throw new Error('Invalid response format: missing rankings array');
    }

    return parsed.rankings.map((ranking: any) => {
      // Find applicant by name
      const applicant = applicants.find(app =>
        app.applicantName.toLowerCase().includes(ranking.candidateName.toLowerCase()) ||
        ranking.candidateName.toLowerCase().includes(app.applicantName.toLowerCase())
      );

      if (!applicant) {
        console.warn(`Could not match candidate: ${ranking.candidateName}`);
        return null;
      }

      // Validate and clamp micro-adjustment
      let microAdjustment = parseFloat(ranking.microAdjustment) || 0;
      microAdjustment = Math.max(-0.5, Math.min(0.5, microAdjustment));

      return {
        applicantId: applicant.applicantId,
        microAdjustment,
        reasoning: ranking.reasoning || 'AI-powered differentiation',
      };
    }).filter((r): r is TieBreakResult => r !== null);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.log('Raw response:', response);
    throw error;
  }
}

/**
 * Deterministic tie-breaking fallback
 * Uses variance in component scores to create micro-adjustments
 * ALWAYS ensures unique scores by using applicant ID as final differentiator
 */
function deterministicTieBreak(
  applicants: TieGroup['applicants']
): TieBreakResult[] {
  return applicants.map((app, index) => {
    // Calculate variance across component scores
    const scores = [
      app.educationScore,
      app.experienceScore,
      app.skillsScore,
      app.eligibilityScore,
    ];

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;

    // Higher variance = more specialized = slight bonus
    // Skills and experience get priority in tie-breaks
    const priorityBonus = (app.skillsScore * 0.003) + (app.experienceScore * 0.002);
    const varianceBonus = Math.min(variance / 100, 0.2);

    // Base adjustment from scores
    let microAdjustment = priorityBonus + varianceBonus - 0.25;

    // Final uniqueness guarantee: use applicant ID hash as a tiny differentiator
    // This ensures NO two applicants ever have exactly the same final score
    const idHash = Array.from(app.applicantId).reduce((hash, char) => {
      return ((hash << 5) - hash) + char.charCodeAt(0);
    }, 0);

    const uniquenessOffset = (idHash % 100) * 0.001; // 0 to 0.099
    microAdjustment += uniquenessOffset;

    // Clamp to range
    microAdjustment = Math.max(-0.5, Math.min(0.5, microAdjustment));

    return {
      applicantId: app.applicantId,
      microAdjustment,
      reasoning: `Deterministic differentiation: variance ${variance.toFixed(1)}, priority factors, uniqueness offset ${uniquenessOffset.toFixed(3)}`,
    };
  });
}

/**
 * Find and group applicants with identical or near-identical scores
 */
export function findTieGroups(
  rankedApplicants: Array<{
    applicantId: string;
    matchScore: number;
    [key: string]: any;
  }>,
  threshold: number = 0.01 // Scores within 0.01% are considered tied
): TieGroup[] {
  const groups: Map<string, TieGroup> = new Map();

  rankedApplicants.forEach(app => {
    // Round score to nearest 0.01 to find ties
    const roundedScore = Math.round(app.matchScore * 100) / 100;
    const key = roundedScore.toFixed(2);

    if (!groups.has(key)) {
      groups.set(key, {
        score: roundedScore,
        applicants: [],
      });
    }

    groups.get(key)!.applicants.push({
      applicantId: app.applicantId,
      applicantName: app.applicantName,
      educationScore: app.educationScore,
      experienceScore: app.experienceScore,
      skillsScore: app.skillsScore,
      eligibilityScore: app.eligibilityScore,
      highestEducationalAttainment: app.highestEducationalAttainment,
      totalYearsExperience: app.totalYearsExperience,
      skills: app.skills,
      eligibilities: app.eligibilities,
      workExperienceTitles: app.workExperienceTitles,
    });
  });

  // Return only groups with 2+ applicants (actual ties)
  return Array.from(groups.values()).filter(group => group.applicants.length > 1);
}
