/**
 * Three Mathematically-Justified Scoring Algorithms for PDS Matching
 *
 * Algorithm 1: Weighted Sum Scoring (Primary) - Linear combination with normalized weights
 * Algorithm 2: Skill-Experience Composite (Secondary) - Exponential decay weighting
 * Algorithm 3: Eligibility-Education Tie-breaker - Boolean matching with priority
 *
 * References:
 * - Weighted Sum Model: Fishburn, P. C. (1967). "Additive Utilities with Incomplete Product Set"
 * - Exponential Weighting: Kahneman & Tversky (1979). "Prospect Theory"
 * - Boolean Matching: Gale-Shapley Algorithm for stable matching
 */

export interface JobRequirements {
  title?: string; // Job title for relevance matching
  description?: string; // Job description for context
  degreeRequirement: string;
  eligibilities: string[];
  skills: string[];
  yearsOfExperience: number;
}

export interface ApplicantData {
  highestEducationalAttainment: string;
  eligibilities: Array<{ eligibilityTitle: string }>;
  skills: string[];
  totalYearsExperience: number;
  workExperienceTitles?: string[]; // Job titles from work history for relevance matching
}

export interface ScoreBreakdown {
  educationScore: number;
  experienceScore: number;
  skillsScore: number;
  eligibilityScore: number;
  totalScore: number;
  algorithmUsed: string;
  reasoning: string;
  matchedSkillsCount: number; // Number of job skills matched by applicant
  matchedEligibilitiesCount: number; // Number of job eligibilities matched by applicant
}

/**
 * Helper function to normalize skill strings into tokens
 * Removes punctuation, splits by whitespace, filters short/common words
 */
function normalizeSkill(skill: string): string[] {
  return skill
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(token => token.length > 2 && !['the', 'and', 'for', 'with'].includes(token));
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy string matching in education and eligibility scoring
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate string similarity percentage (0-100)
 * Uses Levenshtein distance for fuzzy matching
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;

  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  const similarity = ((maxLen - distance) / maxLen) * 100;

  return Math.max(0, Math.min(100, similarity));
}

/**
 * Clean degree requirement string by removing contaminating text
 * Removes eligibilities, skills, or experience text that was mistakenly appended
 *
 * @param degreeReq - Raw degree requirement string (may contain contaminating text)
 * @returns Cleaned degree requirement string
 *
 * @example
 * cleanDegreeRequirement("BS in IT or CS Eligibilities: A+, Network+")
 * // "BS in IT or CS"
 *
 * @example
 * cleanDegreeRequirement("Bachelor in Engineering Skills: AutoCAD, MATLAB")
 * // "Bachelor in Engineering"
 */
function cleanDegreeRequirement(degreeReq: string): string {
  // Remove anything after "Eligibilities:", "Skills:", or "Experience:"
  // This handles cases where job data was manually entered with extra text
  const cleaned = degreeReq.split(/\s+(Eligibilities|Skills|Experience):/i)[0].trim();
  return cleaned;
}

/**
 * Extract the core field from a degree string (what comes after "in" or "of")
 * This normalizes different degree prefixes to compare only the actual field of study.
 *
 * @param degree - Full degree string
 * @returns The core field of study
 *
 * @example
 * extractDegreeField("Bachelor of Science in Information Technology") // "Information Technology"
 * extractDegreeField("Bachelor's Degree in Computer Science") // "Computer Science"
 * extractDegreeField("BS in IT") // "IT"
 * extractDegreeField("Master of Arts") // "Arts"
 */
function extractDegreeField(degree: string): string {
  // Extract field after "in" (most common pattern)
  const inMatch = degree.match(/\bin\s+(.+)$/i);
  if (inMatch) return inMatch[1].trim();

  // Fallback to field after "of" (e.g., "Bachelor of Arts")
  const ofMatch = degree.match(/\bof\s+(.+)$/i);
  if (ofMatch) return ofMatch[1].trim();

  // If no pattern matches, return full degree
  return degree.trim();
}

/**
 * Match degree requirement that may contain "OR" conditions
 * Handles requirements like "Bachelor of Science in Office Administration or Public Administration"
 *
 * For OR conditions, extracts and compares core fields only to handle degree prefix variations:
 * - "Bachelor's Degree in IT" vs "BS in IT or CS" → compares "IT" vs "IT" → 100%
 * - "Bachelor of Science in IT" vs "BS in IT or CS" → compares "IT" vs "IT" → 100%
 *
 * @param jobDegree - The job's degree requirement (may contain "or" to specify alternatives)
 * @param applicantDegree - The applicant's degree
 * @returns Similarity score (0-100) - takes the highest match from all OR options
 *
 * @example
 * matchDegreeRequirement(
 *   "Bachelor of Science in Office Administration or Public Administration",
 *   "Bachelor of Science in Public Administration"
 * ) // Returns 100 (matches second option)
 *
 * @example
 * matchDegreeRequirement(
 *   "Bachelor of Science in Information Technology or Computer Science",
 *   "Bachelor's Degree in Information Technology"
 * ) // Returns 100 (core field "Information Technology" matches first option)
 */
function matchDegreeRequirement(jobDegree: string, applicantDegree: string): number {
  // Clean job degree requirement to remove contaminating text (e.g., eligibilities appended to degree)
  const cleanedJobDegree = cleanDegreeRequirement(jobDegree);

  // Split by " or " to handle multiple acceptable degrees
  const degreeOptions = cleanedJobDegree.split(/ or /i);

  if (degreeOptions.length > 1) {
    // OR condition detected - compare core fields only to handle degree prefix variations
    // This ensures "Bachelor's Degree in IT" matches "BS in IT or CS" → 100%
    const applicantField = extractDegreeField(applicantDegree);
    let maxScore = 0;

    for (const option of degreeOptions) {
      const requiredField = extractDegreeField(option.trim());
      const similarity = stringSimilarity(requiredField, applicantField);

      // ✅ FIX: Normalize OR conditions - treat high similarity (≥85%) as perfect match
      // This ensures "Information Technology" and "Information Technology" score 100%
      // even if full degree strings differ ("Bachelor's Degree" vs "Bachelor of Science")
      if (similarity >= 85) {
        return 100; // Perfect match for any OR option with high similarity
      }

      maxScore = Math.max(maxScore, similarity);
    }

    return maxScore;
  }

  // Non-OR condition - compare full strings (existing behavior)
  return stringSimilarity(cleanedJobDegree, applicantDegree);
}

/**
 * Calculate skill match score using weighted matching
 * Scoring:
 * - Exact match: 100 points per skill
 * - High similarity (>80%): 80 points per skill
 * - Medium similarity (50-80%): 50 points per skill
 * - Token match: 30 points per skill
 * - No match: 0 points
 *
 * Examples:
 * - Exact: "JavaScript" === "JavaScript" → 100 points
 * - Fuzzy: "Patient Care" vs "Patient Care Assistant" → 80 points
 * - Token: "Data Analysis" vs "Data Entry" → 30 points
 * - None: "Vue.js" vs "Patient Care" → 0 points
 *
 * @returns Object with score (0-100) and matchedCount (number of matched skills)
 */
function calculateSkillMatch(jobSkills: string[], applicantSkills: string[]): { score: number; matchedCount: number } {
  if (jobSkills.length === 0) return { score: 50, matchedCount: 0 }; // No requirements = neutral score
  if (applicantSkills.length === 0) return { score: 0, matchedCount: 0 }; // No skills = 0%

  let totalScore = 0;
  let matchedCount = 0;
  const maxScore = jobSkills.length * 100; // Each skill worth 100 points max

  for (const jobSkill of jobSkills) {
    let bestMatch = 0;

    for (const appSkill of applicantSkills) {
      const similarity = stringSimilarity(jobSkill, appSkill);

      if (similarity === 100) {
        // Exact match
        bestMatch = 100;
        break;
      } else if (similarity >= 80) {
        // High similarity
        bestMatch = Math.max(bestMatch, 80);
      } else if (similarity >= 50) {
        // Medium similarity
        bestMatch = Math.max(bestMatch, 50);
      } else {
        // Check token-based matching for partial matches
        const jobTokens = normalizeSkill(jobSkill);
        const appTokens = normalizeSkill(appSkill);
        const commonTokens = jobTokens.filter(token => appTokens.includes(token));

        if (commonTokens.length > 0) {
          const tokenMatchScore = (commonTokens.length / jobTokens.length) * 30;
          bestMatch = Math.max(bestMatch, tokenMatchScore);
        }
      }
    }

    // Count as matched if similarity >= 50% OR has token matches (>= 30 points)
    if (bestMatch >= 30) {
      matchedCount++;
    }

    totalScore += bestMatch;
  }

  // Calculate percentage score
  const finalScore = (totalScore / maxScore) * 100;

  // Add bonus for having more skills than required
  const bonusSkills = Math.max(0, applicantSkills.length - jobSkills.length);
  const bonus = Math.min(bonusSkills * 2, 10); // Max 10% bonus

  return {
    score: Math.min(finalScore + bonus, 100),
    matchedCount
  };
}

/**
 * ALGORITHM 1: Weighted Sum Scoring Model
 *
 * Mathematical Basis: Linear weighted combination with normalized scores
 * Formula: Score = w₁·E + w₂·X + w₃·S + w₄·L
 * where:
 * - E = Education match (0-100)
 * - X = Experience match (0-100)
 * - S = Skills match (0-100)
 * - L = License/Eligibility match (0-100)
 * - w₁ = 0.30 (30% weight for education)
 * - w₂ = 0.25 (25% weight for experience)
 * - w₃ = 0.25 (25% weight for skills)
 * - w₄ = 0.20 (20% weight for eligibility)
 *
 * Weights sum to 1.0 for proper normalization.
 */
export function algorithm1_WeightedSum(
  job: JobRequirements,
  applicant: ApplicantData
): ScoreBreakdown {
  // Education Score: Continuous scoring using string similarity (0-100)
  const jobDegree = job.degreeRequirement.toLowerCase().trim();
  const applicantDegree = applicant.highestEducationalAttainment.toLowerCase().trim();

  // Calculate base similarity (handles "OR" conditions in degree requirements)
  let educationScore = matchDegreeRequirement(jobDegree, applicantDegree);

  // Boost for same degree level (bachelor's, master's, etc.)
  const degreeLevels = ['elementary', 'secondary', 'vocational', 'bachelor', 'master', 'doctoral', 'graduate studies'];
  const jobLevel = degreeLevels.find(level => jobDegree.includes(level));
  const applicantLevel = degreeLevels.find(level => applicantDegree.includes(level));

  if (jobLevel && applicantLevel) {
    if (jobLevel === applicantLevel) {
      // Tiered floor based on existing similarity:
      // - If fields are somewhat similar (40%+), boost to 60% (related but not exact match)
      // - If completely different fields (<40%), floor at 40% (same level, different specialization)
      if (educationScore >= 40) {
        educationScore = Math.max(educationScore, 60);
      } else {
        educationScore = Math.max(educationScore, 40);
      }
    }

    // Higher degree than required gets bonus
    const jobLevelIndex = degreeLevels.indexOf(jobLevel);
    const applicantLevelIndex = degreeLevels.indexOf(applicantLevel);
    if (applicantLevelIndex > jobLevelIndex) {
      educationScore = Math.min(educationScore + 15, 100); // Bonus for higher degree
    } else if (applicantLevelIndex < jobLevelIndex) {
      educationScore = Math.max(educationScore - 20, 30); // Penalty for lower degree
    }
  }

  // Check for related fields (IT/CS, Engineering, Business/Admin fields, etc.)
  const relatedFields: Record<string, string[]> = {
    'information technology': ['computer science', 'software engineering', 'information systems'],
    'computer science': ['information technology', 'software engineering', 'computer engineering'],
    'civil engineering': ['architecture', 'structural engineering', 'construction management'],
    'nursing': ['midwifery', 'health sciences', 'medical technology'],
    // Business & Administration cluster
    // Note: Accounting and Office/Public Admin are DIFFERENT specializations, not related
    'accounting': ['finance', 'business administration'], // Financial/bookkeeping focus
    'office administration': ['public administration', 'business administration', 'secretarial'], // Clerical/admin focus
    'public administration': ['office administration', 'business administration', 'political science'], // Government/policy focus
    'business administration': ['management', 'organizational development'], // General business management
  };

  for (const [field, related] of Object.entries(relatedFields)) {
    if (jobDegree.includes(field)) {
      for (const relatedField of related) {
        if (applicantDegree.includes(relatedField)) {
          educationScore = Math.max(educationScore, 85); // Related field gets at least 85%
          break;
        }
      }
    }
  }

  // Ensure minimum score
  educationScore = Math.max(educationScore, 30);

  // Experience Score: Years + Job Title Relevance (70% years + 30% relevance)
  const requiredYears = job.yearsOfExperience || 1;
  const applicantYears = applicant.totalYearsExperience || 0;

  // Years component (70% weight) - 3-tier system based on job requirement
  let yearsScore;
  if (applicantYears >= requiredYears) {
    // Tier 1: Meets or exceeds requirement → 100% of years component
    yearsScore = 100;
  } else if (applicantYears > 0) {
    // Tier 2: Has some experience but doesn't meet requirement → 66.7% of years component
    yearsScore = 66.7;
  } else {
    // Tier 3: No experience → 33.3% of years component
    yearsScore = 33.3;
  }

  // Job title relevance component (30% weight)
  let relevanceScore = 50; // Default neutral score
  if (job.title && applicant.workExperienceTitles && applicant.workExperienceTitles.length > 0) {
    const jobTitleLower = job.title.toLowerCase().trim();
    let bestTitleMatch = 0;

    for (const expTitle of applicant.workExperienceTitles) {
      const similarity = stringSimilarity(jobTitleLower, expTitle.toLowerCase().trim());
      bestTitleMatch = Math.max(bestTitleMatch, similarity);

      // Check for keyword matches in job titles
      const jobTokens = normalizeSkill(jobTitleLower);
      const expTokens = normalizeSkill(expTitle.toLowerCase());
      const commonTokens = jobTokens.filter(token => expTokens.includes(token));

      if (commonTokens.length > 0) {
        const tokenScore = (commonTokens.length / jobTokens.length) * 80;
        bestTitleMatch = Math.max(bestTitleMatch, tokenScore);
      }
    }

    relevanceScore = bestTitleMatch;
  }

  // Combined experience score: 70% years + 30% relevance
  const experienceScore = (yearsScore * 0.7) + (relevanceScore * 0.3);

  // Skills Score: Token-based matching with exact match priority
  const skillsMatch = calculateSkillMatch(job.skills, applicant.skills);
  const skillsScore = skillsMatch.score;
  const matchedSkillsCount = skillsMatch.matchedCount;

  // Eligibility Score: Proportional matching with fuzzy similarity
  const jobEligibilities = job.eligibilities.map(e => e.toLowerCase().trim());
  const applicantEligibilities = applicant.eligibilities
    .filter(e => e && e.eligibilityTitle)
    .map(e => e.eligibilityTitle.toLowerCase().trim());

  let eligibilityScore = 50; // Default for no requirements
  let matchedEligibilitiesCount = 0;

  if (jobEligibilities.length > 0 && !jobEligibilities.some(e => e.includes('none') || e.includes('not required'))) {
    let totalScore = 0;
    const matchedEligibilities = new Set<string>(); // ✅ Track unique applicant eligibilities

    for (const reqElig of jobEligibilities) {
      let bestMatch = 0;
      let bestMatchingAppElig = ''; // ✅ Track WHICH applicant eligibility matched

      for (const appElig of applicantEligibilities) {
        const similarity = stringSimilarity(reqElig, appElig);

        if (similarity >= 70) {
          // Strong match (exact or very similar)
          if (similarity > bestMatch) {
            bestMatch = similarity;
            bestMatchingAppElig = appElig; // ✅ Store the applicant eligibility
          }
        } else if (similarity >= 40) {
          // Moderate match
          const moderateScore = similarity * 0.7;
          if (moderateScore > bestMatch) {
            bestMatch = moderateScore;
            bestMatchingAppElig = appElig; // ✅ Store the applicant eligibility
          }
        } else {
          // Check for keyword matches (e.g., "Civil Service" in both)
          const reqTokens = normalizeSkill(reqElig);
          const appTokens = normalizeSkill(appElig);
          const commonTokens = reqTokens.filter(token => appTokens.includes(token));

          if (commonTokens.length > 0) {
            const tokenMatchScore = (commonTokens.length / reqTokens.length) * 40;
            if (tokenMatchScore > bestMatch) {
              bestMatch = tokenMatchScore;
              bestMatchingAppElig = appElig; // ✅ Store the applicant eligibility
            }
          }
        }
      }

      if (bestMatchingAppElig) {
        matchedEligibilities.add(bestMatchingAppElig); // ✅ Add unique applicant eligibility to Set
      }
      totalScore += bestMatch;
    }

    matchedEligibilitiesCount = matchedEligibilities.size; // ✅ Count unique applicant eligibilities

    // Debug logging for eligibility matching
    console.log(`🔍 [Algorithm 1] Eligibility matching:`, {
      jobEligibilities,
      applicantEligibilities,
      matchedEligibilities: Array.from(matchedEligibilities),
      matchedCount: matchedEligibilitiesCount,
      totalScore
    });

    // Calculate proportional score
    const matchRatio = matchedEligibilitiesCount / jobEligibilities.length;
    const avgSimilarity = totalScore / jobEligibilities.length;

    // Combined score: 60% match ratio + 40% similarity quality
    eligibilityScore = (matchRatio * 60) + (avgSimilarity * 0.4);

    // Bonus for having more eligibilities than required
    const bonusElig = Math.max(0, applicantEligibilities.length - jobEligibilities.length);
    const bonus = Math.min(bonusElig * 5, 15); // Max 15% bonus
    eligibilityScore = Math.min(eligibilityScore + bonus, 100);

    // Ensure minimum score if some matches found
    if (matchedEligibilitiesCount > 0) {
      eligibilityScore = Math.max(eligibilityScore, 40);
    } else {
      eligibilityScore = Math.min(eligibilityScore, 25); // Penalty for no matches
    }
  }

  // Weighted sum calculation
  const weights = { education: 0.30, experience: 0.20, skills: 0.20, eligibility: 0.30 };
  const totalScore =
    weights.education * educationScore +
    weights.experience * experienceScore +
    weights.skills * skillsScore +
    weights.eligibility * eligibilityScore;

  return {
    educationScore,
    experienceScore,
    skillsScore,
    eligibilityScore,
    totalScore: Math.round(totalScore * 100) / 100,
    algorithmUsed: 'Weighted Sum Model',
    reasoning: `Education (30%): ${educationScore.toFixed(1)}, Experience (20%): ${experienceScore.toFixed(1)}, Skills (20%): ${skillsScore.toFixed(1)}, Eligibility (30%): ${eligibilityScore.toFixed(1)}`,
    matchedSkillsCount,
    matchedEligibilitiesCount
  };
}

/**
 * ALGORITHM 2: Skill-Experience Composite Scoring
 *
 * Mathematical Basis: Exponential decay function for experience weighting
 * Formula: Score = α·S·exp(β·X) + γ·E + δ·L
 * where:
 * - S = Skills match ratio
 * - X = Experience adequacy (years/required)
 * - E = Education match
 * - L = License match
 * - α = 0.30 (skills-experience composite weight)
 * - β = 0.5 (decay rate)
 * - γ = 0.35 (education weight)
 * - δ = 0.35 (eligibility weight)
 *
 * This algorithm prioritizes candidates with both relevant skills AND experience.
 */
export function algorithm2_SkillExperienceComposite(
  job: JobRequirements,
  applicant: ApplicantData
): ScoreBreakdown {
  // Skills matching: Enhanced weighted matching
  const skillsMatch = calculateSkillMatch(job.skills, applicant.skills);
  const skillsScore = skillsMatch.score;
  const matchedSkillsCount = skillsMatch.matchedCount;

  // Experience adequacy with exponential weighting + job title relevance
  const requiredYears = job.yearsOfExperience || 1;
  const applicantYears = applicant.totalYearsExperience || 0;
  const experienceRatio = applicantYears / requiredYears;

  // Years component - 3-tier system based on job requirement
  let yearsScore;
  if (applicantYears >= requiredYears) {
    // Tier 1: Meets or exceeds requirement → 100% of years component
    yearsScore = 100;
  } else if (applicantYears > 0) {
    // Tier 2: Has some experience but doesn't meet requirement → 66.7% of years component
    yearsScore = 66.7;
  } else {
    // Tier 3: No experience → 33.3% of years component
    yearsScore = 33.3;
  }

  // Job title relevance component
  let relevanceScore = 50;
  if (job.title && applicant.workExperienceTitles && applicant.workExperienceTitles.length > 0) {
    const jobTitleLower = job.title.toLowerCase().trim();
    let bestTitleMatch = 0;

    for (const expTitle of applicant.workExperienceTitles) {
      const similarity = stringSimilarity(jobTitleLower, expTitle.toLowerCase().trim());
      bestTitleMatch = Math.max(bestTitleMatch, similarity);

      const jobTokens = normalizeSkill(jobTitleLower);
      const expTokens = normalizeSkill(expTitle.toLowerCase());
      const commonTokens = jobTokens.filter(token => expTokens.includes(token));

      if (commonTokens.length > 0) {
        const tokenScore = (commonTokens.length / jobTokens.length) * 80;
        bestTitleMatch = Math.max(bestTitleMatch, tokenScore);
      }
    }

    relevanceScore = bestTitleMatch;
  }

  const experienceScore = (yearsScore * 0.7) + (relevanceScore * 0.3);

  // Skill-Experience composite with exponential function
  const beta = 0.5;
  const composite = skillsScore * Math.exp(beta * Math.min(experienceRatio, 2)) / Math.exp(beta * 2);

  // Education scoring: Enhanced continuous scoring (handles "OR" conditions)
  const jobDegree = job.degreeRequirement.toLowerCase().trim();
  const applicantDegree = applicant.highestEducationalAttainment.toLowerCase().trim();

  let educationScore = matchDegreeRequirement(jobDegree, applicantDegree);

  const degreeLevels = ['elementary', 'secondary', 'vocational', 'bachelor', 'master', 'doctoral', 'graduate studies'];
  const jobLevel = degreeLevels.find(level => jobDegree.includes(level));
  const applicantLevel = degreeLevels.find(level => applicantDegree.includes(level));

  if (jobLevel && applicantLevel) {
    if (jobLevel === applicantLevel) {
      // Tiered floor based on existing similarity (consistent with Algorithm 1):
      // - If fields are somewhat similar (40%+), boost to 60% (related but not exact match)
      // - If completely different fields (<40%), floor at 40% (same level, different specialization)
      if (educationScore >= 40) {
        educationScore = Math.max(educationScore, 60);
      } else {
        educationScore = Math.max(educationScore, 40);
      }
    }

    const jobLevelIndex = degreeLevels.indexOf(jobLevel);
    const applicantLevelIndex = degreeLevels.indexOf(applicantLevel);
    if (applicantLevelIndex > jobLevelIndex) {
      educationScore = Math.min(educationScore + 15, 100);
    } else if (applicantLevelIndex < jobLevelIndex) {
      educationScore = Math.max(educationScore - 20, 30);
    }
  }

  educationScore = Math.max(educationScore, 30);

  // Eligibility scoring: Enhanced proportional matching
  const jobEligibilities = job.eligibilities.map(e => e.toLowerCase().trim());
  const applicantEligibilities = applicant.eligibilities
    .filter(e => e && e.eligibilityTitle)
    .map(e => e.eligibilityTitle.toLowerCase().trim());

  let eligibilityScore = 50;
  let matchedEligibilitiesCount = 0;

  if (jobEligibilities.length > 0 && !jobEligibilities.some(e => e.includes('none') || e.includes('not required'))) {
    let totalScore = 0;
    const matchedEligibilities = new Set<string>(); // ✅ Track unique applicant eligibilities

    for (const reqElig of jobEligibilities) {
      let bestMatch = 0;
      let bestMatchingAppElig = ''; // ✅ Track WHICH applicant eligibility matched

      for (const appElig of applicantEligibilities) {
        const similarity = stringSimilarity(reqElig, appElig);

        if (similarity >= 70) {
          if (similarity > bestMatch) {
            bestMatch = similarity;
            bestMatchingAppElig = appElig; // ✅ Store the applicant eligibility
          }
        } else if (similarity >= 40) {
          const moderateScore = similarity * 0.7;
          if (moderateScore > bestMatch) {
            bestMatch = moderateScore;
            bestMatchingAppElig = appElig; // ✅ Store the applicant eligibility
          }
        } else {
          const reqTokens = normalizeSkill(reqElig);
          const appTokens = normalizeSkill(appElig);
          const commonTokens = reqTokens.filter(token => appTokens.includes(token));

          if (commonTokens.length > 0) {
            const tokenMatchScore = (commonTokens.length / reqTokens.length) * 40;
            if (tokenMatchScore > bestMatch) {
              bestMatch = tokenMatchScore;
              bestMatchingAppElig = appElig; // ✅ Store the applicant eligibility
            }
          }
        }
      }

      if (bestMatchingAppElig) {
        matchedEligibilities.add(bestMatchingAppElig); // ✅ Add unique applicant eligibility to Set
      }
      totalScore += bestMatch;
    }

    matchedEligibilitiesCount = matchedEligibilities.size; // ✅ Count unique applicant eligibilities

    const matchRatio = matchedEligibilitiesCount / jobEligibilities.length;
    const avgSimilarity = totalScore / jobEligibilities.length;

    eligibilityScore = (matchRatio * 60) + (avgSimilarity * 0.4);

    const bonusElig = Math.max(0, applicantEligibilities.length - jobEligibilities.length);
    const bonus = Math.min(bonusElig * 5, 15);
    eligibilityScore = Math.min(eligibilityScore + bonus, 100);

    if (matchedEligibilitiesCount > 0) {
      eligibilityScore = Math.max(eligibilityScore, 40);
    } else {
      eligibilityScore = Math.min(eligibilityScore, 25);
    }
  }

  // Composite calculation
  const totalScore = 0.30 * composite + 0.35 * educationScore + 0.35 * eligibilityScore;

  return {
    educationScore,
    experienceScore,
    skillsScore,
    eligibilityScore,
    totalScore: Math.round(totalScore * 100) / 100,
    algorithmUsed: 'Skill-Experience Composite',
    reasoning: `Skill-Experience Composite (30%): ${composite.toFixed(1)}, Education (35%): ${educationScore.toFixed(1)}, Eligibility (35%): ${eligibilityScore.toFixed(1)}`,
    matchedSkillsCount,
    matchedEligibilitiesCount
  };
}

/**
 * ALGORITHM 3: Eligibility-Education Tie-breaker
 *
 * Mathematical Basis: Lexicographic ordering with boolean logic
 * Used when scores from Algorithm 1 and 2 are within 5% of each other
 *
 * Priority Order:
 * 1. Professional license/eligibility (100 points if exact match)
 * 2. Exact degree match (50 points)
 * 3. Years over requirement (10 points per year, max 30)
 * 4. Skill diversity (10 points per matched skill, max 20)
 */
export function algorithm3_EligibilityEducationTiebreaker(
  job: JobRequirements,
  applicant: ApplicantData
): ScoreBreakdown {
  let totalScore = 0;
  let reasoning = [];

  // Priority 1: Professional License (highest weight) - Enhanced proportional matching
  const jobEligibilities = job.eligibilities.map(e => e.toLowerCase().trim());
  const applicantEligibilities = applicant.eligibilities
    .filter(e => e && e.eligibilityTitle)
    .map(e => e.eligibilityTitle.toLowerCase().trim());

  let eligibilityScore = 0;
  let matchedEligibilitiesCount = 0;

  if (jobEligibilities.length > 0 && !jobEligibilities.some(e => e.includes('none') || e.includes('not required'))) {
    let totalEligScore = 0;
    const matchedEligibilities = new Set<string>(); // ✅ Track unique applicant eligibilities

    for (const reqElig of jobEligibilities) {
      let bestMatch = 0;
      let bestMatchingAppElig = ''; // ✅ Track WHICH applicant eligibility matched

      for (const appElig of applicantEligibilities) {
        const similarity = stringSimilarity(reqElig, appElig);
        if (similarity >= 70) {
          if (similarity > bestMatch) {
            bestMatch = similarity;
            bestMatchingAppElig = appElig; // ✅ Store the applicant eligibility
          }
        } else if (similarity >= 40) {
          const moderateScore = similarity * 0.7;
          if (moderateScore > bestMatch) {
            bestMatch = moderateScore;
            bestMatchingAppElig = appElig; // ✅ Store the applicant eligibility
          }
        }
      }

      if (bestMatchingAppElig) {
        matchedEligibilities.add(bestMatchingAppElig); // ✅ Add unique applicant eligibility to Set
      }
      totalEligScore += bestMatch;
    }

    matchedEligibilitiesCount = matchedEligibilities.size; // ✅ Count unique applicant eligibilities

    const matchRatio = matchedEligibilitiesCount / jobEligibilities.length;
    const avgSimilarity = totalEligScore / jobEligibilities.length;
    eligibilityScore = (matchRatio * 60) + (avgSimilarity * 0.4);

    const scoreContribution = (eligibilityScore / 100) * 40;
    totalScore += scoreContribution;
    reasoning.push(`Professional license match: ${eligibilityScore.toFixed(1)}% (+${scoreContribution.toFixed(1)})`);
  } else {
    eligibilityScore = 50;
    totalScore += 20; // Neutral score
    reasoning.push('No license required (+20)');
  }

  // Priority 2: Degree match - Enhanced continuous scoring (handles "OR" conditions)
  const jobDegree = job.degreeRequirement.toLowerCase().trim();
  const applicantDegree = applicant.highestEducationalAttainment.toLowerCase().trim();

  let educationScore = matchDegreeRequirement(jobDegree, applicantDegree);

  const degreeLevels = ['elementary', 'secondary', 'vocational', 'bachelor', 'master', 'doctoral', 'graduate studies'];
  const jobLevel = degreeLevels.find(level => jobDegree.includes(level));
  const applicantLevel = degreeLevels.find(level => applicantDegree.includes(level));

  if (jobLevel && applicantLevel) {
    if (jobLevel === applicantLevel) {
      // Tiered floor based on existing similarity (consistent with Algorithm 1 & 2):
      // - If fields are somewhat similar (40%+), boost to 60% (related but not exact match)
      // - If completely different fields (<40%), floor at 40% (same level, different specialization)
      if (educationScore >= 40) {
        educationScore = Math.max(educationScore, 60);
      } else {
        educationScore = Math.max(educationScore, 40);
      }
    }

    const jobLevelIndex = degreeLevels.indexOf(jobLevel);
    const applicantLevelIndex = degreeLevels.indexOf(applicantLevel);
    if (applicantLevelIndex > jobLevelIndex) {
      educationScore = Math.min(educationScore + 15, 100);
    } else if (applicantLevelIndex < jobLevelIndex) {
      educationScore = Math.max(educationScore - 20, 30);
    }
  }

  const eduScoreContribution = (educationScore / 100) * 30;
  totalScore += eduScoreContribution;
  reasoning.push(`Degree match: ${educationScore.toFixed(1)}% (+${eduScoreContribution.toFixed(1)})`);

  // Priority 3: Experience with job title relevance
  const requiredYears = job.yearsOfExperience || 1;
  const applicantYears = applicant.totalYearsExperience || 0;

  // Years component - 3-tier system based on job requirement
  let yearsScore;
  if (applicantYears >= requiredYears) {
    // Tier 1: Meets or exceeds requirement → 100% of years component
    yearsScore = 100;
  } else if (applicantYears > 0) {
    // Tier 2: Has some experience but doesn't meet requirement → 66.7% of years component
    yearsScore = 66.7;
  } else {
    // Tier 3: No experience → 33.3% of years component
    yearsScore = 33.3;
  }

  // Job title relevance
  let relevanceScore = 50;
  if (job.title && applicant.workExperienceTitles && applicant.workExperienceTitles.length > 0) {
    const jobTitleLower = job.title.toLowerCase().trim();
    let bestTitleMatch = 0;

    for (const expTitle of applicant.workExperienceTitles) {
      const similarity = stringSimilarity(jobTitleLower, expTitle.toLowerCase().trim());
      bestTitleMatch = Math.max(bestTitleMatch, similarity);
    }

    relevanceScore = bestTitleMatch;
  }

  const experienceScore = (yearsScore * 0.7) + (relevanceScore * 0.3);
  const excessYears = Math.max(0, applicantYears - requiredYears);
  const experienceBonus = Math.min((experienceScore / 100) * 20, 20);
  totalScore += experienceBonus;
  reasoning.push(`Experience: ${experienceScore.toFixed(1)}%, ${excessYears.toFixed(1)} years over (+${experienceBonus.toFixed(1)})`);

  // Priority 4: Skill diversity (Token-based matching)
  const skillsMatch = calculateSkillMatch(job.skills, applicant.skills);
  const skillsScore = skillsMatch.score;
  const matchedSkillsCount = skillsMatch.matchedCount;

  const skillBonus = Math.min(matchedSkillsCount * 10, 20);
  totalScore += skillBonus * 0.10; // 10% weight
  reasoning.push(`${matchedSkillsCount} matched skills (+${(skillBonus * 0.10).toFixed(1)})`);

  return {
    educationScore,
    experienceScore,
    skillsScore,
    eligibilityScore,
    totalScore: Math.round(totalScore * 100) / 100,
    algorithmUsed: 'Eligibility-Education Tie-breaker',
    reasoning: reasoning.join('; '),
    matchedSkillsCount,
    matchedEligibilitiesCount
  };
}

/**
 * Ensemble Method: Combines all three algorithms
 *
 * If Algorithm 1 and 2 scores are within 5%, use Algorithm 3 as tie-breaker
 * Otherwise, use weighted average of Algorithm 1 (60%) and Algorithm 2 (40%)
 */
export function ensembleScore(
  job: JobRequirements,
  applicant: ApplicantData
): ScoreBreakdown {
  const score1 = algorithm1_WeightedSum(job, applicant);
  const score2 = algorithm2_SkillExperienceComposite(job, applicant);

  const scoreDiff = Math.abs(score1.totalScore - score2.totalScore);

  // Tie-breaker condition: scores within 5 points
  if (scoreDiff <= 5) {
    const score3 = algorithm3_EligibilityEducationTiebreaker(job, applicant);
    return {
      ...score3,
      algorithmUsed: 'Ensemble (Tie-breaker)',
      reasoning: `Algorithms 1 & 2 within 5% (${score1.totalScore.toFixed(1)} vs ${score2.totalScore.toFixed(1)}). Tie-breaker: ${score3.reasoning}`
    };
  }

  // Weighted ensemble
  const educationScore = score1.educationScore * 0.6 + score2.educationScore * 0.4;
  const experienceScore = score1.experienceScore * 0.6 + score2.experienceScore * 0.4;
  const skillsScore = score1.skillsScore * 0.6 + score2.skillsScore * 0.4;
  const eligibilityScore = score1.eligibilityScore * 0.6 + score2.eligibilityScore * 0.4;
  const totalScore = score1.totalScore * 0.6 + score2.totalScore * 0.4;

  // Generate user-friendly reasoning
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (educationScore >= 80) strengths.push('strong educational background');
  else if (educationScore < 60) gaps.push('education level');

  if (experienceScore >= 80) {
    strengths.push(experienceScore === 100 ? 'excellent relevant experience' : 'solid work experience');
  } else if (experienceScore < 60) {
    gaps.push('years of experience');
  }

  if (skillsScore >= 60) strengths.push('good technical skills');
  else if (skillsScore < 40) gaps.push('required skills');

  if (eligibilityScore >= 80) strengths.push('appropriate certifications');
  else if (eligibilityScore < 60) gaps.push('certifications');

  let reasoning = '';
  if (strengths.length > 0) {
    reasoning = `Candidate demonstrates ${strengths.join(', ')}.`;
  }
  if (gaps.length > 0) {
    reasoning += ` ${gaps.length > 0 && strengths.length > 0 ? 'Areas for development include' : 'Needs improvement in'} ${gaps.join(', ')}.`;
  }
  if (!reasoning) {
    reasoning = 'Candidate evaluated across multiple qualification criteria.';
  }

  return {
    educationScore: Math.round(educationScore * 100) / 100,
    experienceScore: Math.round(experienceScore * 100) / 100,
    skillsScore: Math.round(skillsScore * 100) / 100,
    eligibilityScore: Math.round(eligibilityScore * 100) / 100,
    totalScore: Math.round(totalScore * 100) / 100,
    algorithmUsed: 'Multi-Factor Assessment',
    reasoning: reasoning.trim(),
    matchedSkillsCount: score1.matchedSkillsCount, // Use Algorithm 1 counts (60% weight)
    matchedEligibilitiesCount: score1.matchedEligibilitiesCount
  };
}
