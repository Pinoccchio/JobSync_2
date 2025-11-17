import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

/**
 * Gemini AI Model Configuration
 *
 * Model options:
 * - gemini-1.5-pro: Best quality, slower, higher cost (recommended for production ranking)
 * - gemini-1.5-flash: Faster, lower cost (good for development/testing)
 * - gemini-1.0-pro: Legacy model (not recommended)
 */

export const GEMINI_CONFIG = {
  // Model selection
  model: 'gemini-1.5-pro' as const,

  // Generation parameters
  generationConfig: {
    temperature: 0.2, // Lower = more deterministic (good for ranking consistency)
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  },

  // Safety settings (adjust as needed)
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
};

/**
 * Prompts for different ranking algorithms
 * These will be used to rank applicants based on their PDS data
 */
export const RANKING_PROMPTS = {
  // Algorithm 1: Education match scoring
  educationMatch: `
You are an expert HR analyst. Analyze the candidate's educational background against the job requirements.
Score the match from 0-100 based on:
- Degree level match (Bachelor's, Master's, PhD)
- Field of study relevance
- Institution reputation (if provided)
- Additional certifications

Return ONLY a JSON object with this structure:
{
  "score": <number 0-100>,
  "reasoning": "<brief explanation>",
  "algorithm": "Education Match Algorithm - Weighted scoring based on degree level (40%), field relevance (40%), and certifications (20%)"
}
`,

  // Algorithm 2: Experience match scoring
  experienceMatch: `
You are an expert HR analyst. Analyze the candidate's work experience against the job requirements.
Score the match from 0-100 based on:
- Total years of relevant experience
- Seniority level of previous roles
- Industry relevance
- Job responsibilities alignment

Return ONLY a JSON object with this structure:
{
  "score": <number 0-100>,
  "reasoning": "<brief explanation>",
  "algorithm": "Experience Match Algorithm - Exponential scoring: score = min(100, years_of_experience * 15 + seniority_multiplier)"
}
`,

  // Algorithm 3: Skills & eligibility match (tie-breaker)
  skillsMatch: `
You are an expert HR analyst. Analyze the candidate's skills and eligibilities against the job requirements.
Score the match from 0-100 based on:
- Technical skills alignment
- Soft skills relevance
- Civil service eligibility
- Professional licenses

This is a TIE-BREAKER algorithm - be precise and differentiate candidates carefully.

Return ONLY a JSON object with this structure:
{
  "score": <number 0-100>,
  "reasoning": "<brief explanation>",
  "algorithm": "Skills & Eligibility Match - Tie-breaker using skill coverage ratio and eligibility bonus: score = (matched_skills / required_skills) * 70 + eligibility_bonus * 30"
}
`,
};
