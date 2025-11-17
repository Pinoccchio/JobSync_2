'use client';
import React, { useState } from 'react';
import { Modal, Badge } from '@/components/ui';
import {
  Award,
  GraduationCap,
  Briefcase,
  Wrench,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  Trophy,
  BarChart3,
} from 'lucide-react';
import {
  getPercentileText,
  getOrdinalRank,
  getRelativePositionMessage,
} from '@/lib/utils/rankingStatistics';
import { AlgorithmInfoModal } from './AlgorithmInfoModal';

/**
 * Calculate string similarity percentage using Levenshtein distance
 * Used for checking OR-condition matches in education requirements
 * @returns Similarity percentage (0-100)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 100;

  // Substring match (high similarity)
  if (s1.includes(s2) || s2.includes(s1)) return 90;

  // Levenshtein distance calculation for fuzzy matching
  const len1 = s1.length;
  const len2 = s2.length;

  // Create matrix for dynamic programming
  const matrix: number[][] = [];

  // Initialize first column and row
  for (let i = 0; i <= len1; i++) matrix[i] = [i];
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill matrix with edit distances
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  // Convert edit distance to similarity percentage
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 100;

  const distance = matrix[len1][len2];
  return ((maxLen - distance) / maxLen) * 100;
}

/**
 * Round experience years to 1 decimal place to eliminate floating-point precision errors
 * @param years - Number of years (may have floating-point precision errors)
 * @returns Rounded value with 1 decimal place precision
 * @example roundExperience(0.3999999999999999) → 0.4
 */
function roundExperience(years: number): number {
  return Math.round(years * 10) / 10;
}

/**
 * Extract the core field from a degree string (what comes after "in" or "of")
 * This normalizes different degree prefixes to compare only the actual field of study.
 * Matches the same logic used in the ranking algorithms for consistency.
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

interface Statistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
}

interface TopPerformer {
  name: string;
  rank: number;
  matchScore: number;
  educationScore: number;
  experienceScore: number;
  skillsScore: number;
  eligibilityScore: number;
}

interface AlgorithmDetails {
  algorithm1Score?: number;
  algorithm2Score?: number;
  algorithm3Score?: number;
  ensembleMethod: 'weighted_average' | 'tie_breaker';
  algorithm1Weight?: number;
  algorithm2Weight?: number;
  isTieBreaker: boolean;
  scoreDifference?: number;
}

interface RankingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: {
    name: string;
    jobTitle: string;
    rank: number;
    matchScore: number;
    educationScore: number;
    experienceScore: number;
    skillsScore: number;
    eligibilityScore: number;
    algorithmUsed: string;
    reasoning: string;
    education?: string;
    experience?: number;
    skills?: string[];
    eligibilities?: string[];
    algorithmDetails?: AlgorithmDetails;
    matchedSkillsCount?: number;
    matchedEligibilitiesCount?: number;
    // Statistical context
    statistics?: {
      matchScore: Statistics;
      educationScore: Statistics;
      experienceScore: Statistics;
      skillsScore: Statistics;
      eligibilityScore: Statistics;
    };
    percentiles?: {
      matchScore: number;
      educationScore: number;
      experienceScore: number;
      skillsScore: number;
      eligibilityScore: number;
    };
    topPerformers?: TopPerformer[];
    totalApplicants?: number;
  } | null;
  jobRequirements?: {
    degreeRequirement: string;
    eligibilities: string[];
    skills: string[];
    yearsOfExperience: number;
  } | null;
}

export function RankingDetailsModal({ isOpen, onClose, applicant, jobRequirements }: RankingDetailsModalProps) {
  const [isAlgorithmInfoOpen, setIsAlgorithmInfoOpen] = useState(false);

  if (!applicant) return null;

  // Generate plain English explanation of ranking
  const generateRankingExplanation = (): string => {
    if (!jobRequirements) {
      return 'This candidate was ranked based on their overall qualifications and match to the job requirements.';
    }

    const explanations: string[] = [];

    // Experience analysis
    if (applicant.experience !== undefined) {
      // Round to 1 decimal place to eliminate floating-point precision issues
      const roundedExperience = Math.round((applicant.experience || 0) * 10) / 10;
      const excessYears = Math.round(((applicant.experience || 0) - jobRequirements.yearsOfExperience) * 10) / 10;
      const percentageAbove = jobRequirements.yearsOfExperience > 0
        ? Math.round((excessYears / jobRequirements.yearsOfExperience) * 100)
        : 0;

      if (excessYears > 0) {
        explanations.push(
          `This candidate has ${roundedExperience} years of experience, exceeding the ${jobRequirements.yearsOfExperience}-year requirement by ${excessYears} ${excessYears === 1 ? 'year' : 'years'} (${percentageAbove}% more than required).`
        );
      } else if (excessYears === 0) {
        explanations.push(
          `This candidate has exactly ${roundedExperience} years of experience, precisely meeting the ${jobRequirements.yearsOfExperience}-year requirement.`
        );
      } else {
        explanations.push(
          `This candidate has ${roundedExperience} years of experience, which is ${Math.abs(excessYears)} ${Math.abs(excessYears) === 1 ? 'year' : 'years'} below the ${jobRequirements.yearsOfExperience}-year requirement.`
        );
      }
    }

    // Skills analysis
    if (applicant.skills && jobRequirements.skills && jobRequirements.skills.length > 0) {
      // Use stored match count from database (calculated with fuzzy matching)
      const matchedSkillsCount = applicant.matchedSkillsCount ?? 0;
      const matchPercentage = Math.round((matchedSkillsCount / jobRequirements.skills.length) * 100);

      if (matchedSkillsCount === 0) {
        explanations.push(
          `They possess 0 out of ${jobRequirements.skills.length} required skills (0% match).`
        );
      } else if (matchedSkillsCount === jobRequirements.skills.length) {
        explanations.push(
          `They possess all ${jobRequirements.skills.length} required skills (100% match).`
        );
      } else {
        explanations.push(
          `They possess ${matchedSkillsCount} out of ${jobRequirements.skills.length} required skills (${matchPercentage}% match).`
        );
      }
    }

    // Education analysis
    if (applicant.education && jobRequirements.degreeRequirement) {
      const educationLower = applicant.education.toLowerCase();
      const requiredLower = jobRequirements.degreeRequirement.toLowerCase();

      // Check if requirement has OR conditions (e.g., "Office Administration or Public Administration")
      const degreeOptions = jobRequirements.degreeRequirement.split(/ or /i).map(opt => opt.trim());

      // Check if applicant's education matches any OR option
      let matchesOrCondition = false;
      let bestMatchScore = 0;

      if (degreeOptions.length > 1) {
        // OR condition detected - compare core fields only to handle degree prefix variations
        // This ensures "Bachelor's Degree in IT" matches "BS in IT or CS" → 100%
        const applicantField = extractDegreeField(applicant.education);

        for (const option of degreeOptions) {
          const requiredField = extractDegreeField(option);
          const similarity = calculateStringSimilarity(requiredField, applicantField);
          bestMatchScore = Math.max(bestMatchScore, similarity);

          // Consider it a match if similarity >= 85% (matches algorithm normalization threshold)
          if (similarity >= 85) {
            matchesOrCondition = true;
            break;
          }
        }
      } else {
        // Non-OR condition - compare full strings
        bestMatchScore = calculateStringSimilarity(applicant.education, jobRequirements.degreeRequirement);
        matchesOrCondition = bestMatchScore >= 85;
      }

      // Generate explanation based on both OR matching AND score thresholds
      // Tiered system: 80% = meets, 60% = related field, 40% = same level, <40% = does not meet
      if (matchesOrCondition || applicant.educationScore >= 80) {
        explanations.push(
          `Their ${applicant.education} meets the ${jobRequirements.degreeRequirement} requirement.`
        );
      } else if (applicant.educationScore >= 60) {
        explanations.push(
          `Their ${applicant.education} partially meets the ${jobRequirements.degreeRequirement} requirement (related field).`
        );
      } else if (applicant.educationScore >= 40) {
        explanations.push(
          `Their ${applicant.education} shows the same degree level but different specialization from the ${jobRequirements.degreeRequirement} requirement.`
        );
      } else {
        explanations.push(
          `Their ${applicant.education} does not meet the ${jobRequirements.degreeRequirement} requirement.`
        );
      }
    }

    // Eligibility analysis
    if (applicant.eligibilities && jobRequirements.eligibilities && jobRequirements.eligibilities.length > 0) {
      // Use stored match count from database (calculated with fuzzy matching)
      const matchedEligibilitiesCount = applicant.matchedEligibilitiesCount ?? 0;

      if (matchedEligibilitiesCount === 0) {
        explanations.push(
          `They have 0 out of ${jobRequirements.eligibilities.length} required eligibilities.`
        );
      } else if (matchedEligibilitiesCount === jobRequirements.eligibilities.length) {
        explanations.push(
          `They have all ${jobRequirements.eligibilities.length} required eligibilities.`
        );
      } else {
        explanations.push(
          `They have ${matchedEligibilitiesCount} out of ${jobRequirements.eligibilities.length} required eligibilities.`
        );
      }
    }

    // Overall ranking conclusion
    if (applicant.rank === 1) {
      explanations.push(
        `These qualifications make them the top-ranked candidate for this position.`
      );
    } else if (applicant.rank <= 3) {
      explanations.push(
        `These qualifications place them among the top candidates for this position.`
      );
    } else {
      explanations.push(
        `Their ranking reflects the overall match between their qualifications and the job requirements.`
      );
    }

    return explanations.join(' ');
  };

  const ScoreBar = ({ score, label, icon: Icon, color }: { score: number; label: string; icon: any; color: string }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        <span className={`text-lg font-bold ${color}`}>{Math.round(score * 10) / 10}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            score >= 80 ? 'bg-green-500' :
            score >= 60 ? 'bg-yellow-500' :
            score >= 40 ? 'bg-orange-500' :
            'bg-red-500'
          }`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );

  const getRankBadgeVariant = (rank: number): 'success' | 'info' | 'warning' | 'default' => {
    switch (rank) {
      case 1: return 'success';
      case 2: return 'info';
      case 3: return 'warning';
      default: return 'default';
    }
  };

  // Generate highlight badges based on qualifications
  const generateHighlightBadges = (): { label: string; icon: any; variant: 'success' | 'info' | 'warning' }[] => {
    const badges: { label: string; icon: any; variant: 'success' | 'info' | 'warning' }[] = [];

    // Check if top in experience
    if (applicant.topPerformers && applicant.topPerformers.length > 0) {
      const topExperience = Math.max(...applicant.topPerformers.map(p => p.experienceScore));
      if (applicant.experienceScore >= topExperience && applicant.experienceScore >= 90) {
        badges.push({ label: '⭐ Top Experience', icon: Briefcase, variant: 'success' });
      }
    }

    // Check if education champion
    if (applicant.educationScore === 100) {
      badges.push({ label: '🎓 Education Match', icon: GraduationCap, variant: 'info' });
    }

    // Check if skills leader
    if (applicant.topPerformers && applicant.topPerformers.length > 0) {
      const topSkills = Math.max(...applicant.topPerformers.map(p => p.skillsScore));
      if (applicant.skillsScore >= topSkills && applicant.skillsScore >= 80) {
        badges.push({ label: '🛠️ Skills Leader', icon: Wrench, variant: 'warning' });
      }
    }

    // Check if fully eligible
    if (applicant.eligibilityScore === 100) {
      badges.push({ label: '🏅 Fully Eligible', icon: ShieldCheck, variant: 'success' });
    }

    // Check if exceeds all requirements
    if (
      applicant.educationScore >= 100 &&
      applicant.experienceScore >= 100 &&
      applicant.skillsScore >= 80 &&
      applicant.eligibilityScore >= 80
    ) {
      badges.push({ label: '⚡ Exceeds Requirements', icon: Star, variant: 'success' });
    }

    // If rank 1 and no other badges
    if (applicant.rank === 1 && badges.length === 0) {
      badges.push({ label: '🏆 Top Ranked', icon: Trophy, variant: 'success' });
    }

    return badges;
  };

  // Generate key differentiator message
  const generateKeyDifferentiator = (): string => {
    if (!applicant.totalApplicants) {
      return getRelativePositionMessage(applicant.rank, 1);
    }

    const totalApplicants = applicant.totalApplicants;

    // Check if there are tied scores
    const tiedCandidates = applicant.topPerformers?.filter(
      p => Math.abs(p.matchScore - applicant.matchScore) < 0.1
    );

    if (tiedCandidates && tiedCandidates.length > 1 && applicant.rank > 1) {
      // This applicant is tied with others - explain tie-breaking
      const higherRanked = tiedCandidates.find(p => p.rank < applicant.rank);
      if (higherRanked && jobRequirements) {
        // Find the tie-breaking factor
        if (applicant.experience && higherRanked.experienceScore === applicant.experienceScore) {
          // Same percentage score but different raw years
          return `Tied at ${applicant.matchScore.toFixed(1)}% with other candidates. Ranked ${getOrdinalRank(applicant.rank)} due to actual years of experience.`;
        }
        return `Tied at ${applicant.matchScore.toFixed(1)}% with other candidates. Ranking determined by tie-breaking criteria.`;
      }
    }

    // Rank #1
    if (applicant.rank === 1) {
      if (totalApplicants === 1) {
        return 'Only applicant for this position';
      }
      if (applicant.experience && jobRequirements && applicant.experience > jobRequirements.yearsOfExperience) {
        const excess = roundExperience(applicant.experience - jobRequirements.yearsOfExperience);
        return `Top-ranked candidate - Exceeds experience requirement by ${excess} ${excess === 1 ? 'year' : 'years'}`;
      }
      return 'Top-ranked candidate with highest overall qualifications';
    }

    // Rank #2-3
    if (applicant.rank <= 3 && applicant.topPerformers && applicant.topPerformers.length > 0) {
      const topCandidate = applicant.topPerformers[0];
      const scoreDiff = topCandidate.matchScore - applicant.matchScore;

      if (scoreDiff < 5) {
        return `Ranked ${getOrdinalRank(applicant.rank)} - Very competitive, within ${scoreDiff.toFixed(1)} points of top candidate`;
      }
      return `Ranked ${getOrdinalRank(applicant.rank)} - ${scoreDiff.toFixed(1)} points below top candidate`;
    }

    // Other ranks
    return getRelativePositionMessage(applicant.rank, totalApplicants);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={applicant.name}
      showFooter={false}
    >
      <div className="relative">
        {/* Applicant Info Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
          <Badge variant={getRankBadgeVariant(applicant.rank)}>
            Rank #{applicant.rank}
          </Badge>
          <span className="text-gray-400">•</span>
          <p className="text-gray-600 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            {applicant.jobTitle}
          </p>
          {applicant.totalApplicants && (
            <span className="text-gray-400 ml-auto text-sm">
              {getOrdinalRank(applicant.rank)} of {applicant.totalApplicants} applicants
            </span>
          )}
        </div>

        {/* Highlight Badges */}
        {(() => {
          const badges = generateHighlightBadges();
          if (badges.length > 0) {
            return (
              <div className="flex flex-wrap gap-2 mb-4">
                {badges.map((badge, idx) => (
                  <Badge key={idx} variant={badge.variant}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
            );
          }
          return null;
        })()}

        {/* Key Differentiator Callout Box */}
        <div className="mb-6 p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-purple-900 mb-1 flex items-center gap-2">
                WHY THIS RANK?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {generateKeyDifferentiator()}
              </p>
            </div>
          </div>
        </div>

        {/* Overall Match Score */}
        <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Overall Match Score</p>
                <p className="text-4xl font-bold text-green-600">{applicant.matchScore.toFixed(1)}%</p>
              </div>
            </div>
            <Award className="w-16 h-16 text-green-200" />
          </div>
        </div>

        {/* Why This Rank - Explanation Section */}
        {jobRequirements && (
          <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              Why This Rank?
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              {generateRankingExplanation()}
            </p>
          </div>
        )}

        {/* Score Breakdown */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#22A555]" />
            Score Breakdown
          </h3>

          <ScoreBar
            score={applicant.educationScore}
            label="Education Match"
            icon={GraduationCap}
            color="text-blue-600"
          />
          {applicant.education && (
            <p className="text-sm text-gray-600 ml-7 -mt-2">{applicant.education}</p>
          )}

          <ScoreBar
            score={applicant.experienceScore}
            label="Experience Match"
            icon={Briefcase}
            color="text-purple-600"
          />
          {applicant.experience !== undefined && (
            <div className="ml-7 -mt-2">
              <p className="text-sm text-gray-600">
                {applicant.experience} years of experience
                {jobRequirements && (
                  <span className="ml-2 font-semibold">
                    {applicant.experience > jobRequirements.yearsOfExperience ? (
                      <>
                        {(() => {
                          const excess = roundExperience(applicant.experience - jobRequirements.yearsOfExperience);
                          return (
                            <span className="text-green-600">
                              (+{excess} {excess === 1 ? 'year' : 'years'} above minimum) ⭐
                            </span>
                          );
                        })()}
                      </>
                    ) : applicant.experience === jobRequirements.yearsOfExperience ? (
                      <span className="text-blue-600">(Exactly meets requirement) ✓</span>
                    ) : (
                      <>
                        {(() => {
                          const shortage = roundExperience(jobRequirements.yearsOfExperience - applicant.experience);
                          return (
                            <span className="text-red-600">
                              (-{shortage} {shortage === 1 ? 'year' : 'years'} below minimum) ⚠
                            </span>
                          );
                        })()}
                      </>
                    )}
                  </span>
                )}
              </p>
              {applicant.percentiles && applicant.totalApplicants && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <BarChart3 className="w-3 h-3" />
                  {getPercentileText(applicant.percentiles.experienceScore, applicant.totalApplicants)}
                </p>
              )}
            </div>
          )}

          <ScoreBar
            score={applicant.skillsScore}
            label="Skills Match"
            icon={Wrench}
            color="text-orange-600"
          />
          {applicant.skills && applicant.skills.length > 0 && (
            <div className="ml-7 -mt-2">
              <div className="flex flex-wrap gap-2">
                {applicant.skills.slice(0, 5).map((skill, idx) => (
                  <Badge key={idx} variant="default">{skill}</Badge>
                ))}
                {applicant.skills.length > 5 && (
                  <Badge variant="default">+{applicant.skills.length - 5} more</Badge>
                )}
              </div>
              {jobRequirements && jobRequirements.skills && jobRequirements.skills.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-semibold">
                    {(() => {
                      // Use stored match count from database (calculated with fuzzy matching)
                      const matchedSkillsCount = applicant.matchedSkillsCount ?? 0;
                      const matchPercentage = Math.round((matchedSkillsCount / jobRequirements.skills.length) * 100);

                      if (matchedSkillsCount === 0) {
                        // Check if there's a non-zero score despite 0 exact matches (indicates partial/token matching)
                        if (applicant.skillsScore > 0) {
                          return <span className="text-orange-600">(Partial alignment detected - related skills found) 🔸</span>;
                        }
                        return <span className="text-red-600">(0 out of {jobRequirements.skills.length} required skills) ⚠</span>;
                      } else if (matchedSkillsCount === jobRequirements.skills.length) {
                        return <span className="text-green-600">(All {jobRequirements.skills.length} required skills matched) ⭐</span>;
                      } else {
                        return <span className="text-yellow-600">({matchedSkillsCount} out of {jobRequirements.skills.length} required skills - {matchPercentage}%) ⚡</span>;
                      }
                    })()}
                  </span>
                </p>
              )}
              {applicant.percentiles && applicant.totalApplicants && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <BarChart3 className="w-3 h-3" />
                  {getPercentileText(applicant.percentiles.skillsScore, applicant.totalApplicants)}
                </p>
              )}
            </div>
          )}

          <ScoreBar
            score={applicant.eligibilityScore}
            label="Eligibility Match"
            icon={ShieldCheck}
            color="text-green-600"
          />
          {applicant.eligibilities && applicant.eligibilities.length > 0 && (
            <div className="ml-7 -mt-2">
              <div className="flex flex-wrap gap-2">
                {applicant.eligibilities.map((elig: any, idx: number) => {
                  // Extract eligibility title from object or use string directly
                  const eligTitle = typeof elig === 'string' ? elig : (elig?.eligibilityTitle || elig?.name || 'Unknown');
                  return <Badge key={idx} variant="success">{eligTitle}</Badge>;
                })}
              </div>
              {jobRequirements && jobRequirements.eligibilities && jobRequirements.eligibilities.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-semibold">
                    {(() => {
                      // Use stored match count from database (calculated with fuzzy matching)
                      const matchedEligibilitiesCount = applicant.matchedEligibilitiesCount ?? 0;
                      const matchPercentage = Math.round((matchedEligibilitiesCount / jobRequirements.eligibilities.length) * 100);

                      if (matchedEligibilitiesCount === 0) {
                        // Check if there's a non-zero score despite 0 exact matches (indicates partial matching)
                        if (applicant.eligibilityScore > 0) {
                          return <span className="text-orange-600">(Partial alignment detected - related eligibilities found) 🔸</span>;
                        }
                        return <span className="text-red-600">(0 out of {jobRequirements.eligibilities.length} required eligibilities) ⚠</span>;
                      } else if (matchedEligibilitiesCount === jobRequirements.eligibilities.length) {
                        return <span className="text-green-600">(All {jobRequirements.eligibilities.length} required eligibilities matched) ⭐</span>;
                      } else {
                        return <span className="text-yellow-600">({matchedEligibilitiesCount} out of {jobRequirements.eligibilities.length} required eligibilities - {matchPercentage}%) ⚡</span>;
                      }
                    })()}
                  </span>
                </p>
              )}
              {applicant.percentiles && applicant.totalApplicants && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <BarChart3 className="w-3 h-3" />
                  {getPercentileText(applicant.percentiles.eligibilityScore, applicant.totalApplicants)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Job Requirements & Comparison */}
        {jobRequirements && (
          <div className="space-y-6 mb-6">
            {/* Job Requirements Section */}
            <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Job Requirements
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Education Required:</p>
                    <p className="text-sm text-gray-900">{jobRequirements.degreeRequirement}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Experience Required:</p>
                    <p className="text-sm text-gray-900">{jobRequirements.yearsOfExperience} years</p>
                  </div>
                </div>
                {jobRequirements.skills && jobRequirements.skills.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Wrench className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Skills Required:</p>
                      <div className="flex flex-wrap gap-2">
                        {jobRequirements.skills.map((skill, idx) => (
                          <Badge key={idx} variant="info">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {jobRequirements.eligibilities && jobRequirements.eligibilities.length > 0 && (
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Eligibilities Required:</p>
                      <div className="flex flex-wrap gap-2">
                        {jobRequirements.eligibilities.map((elig, idx) => (
                          <Badge key={idx} variant="info">{elig}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comparison Section */}
            <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                How This Applicant Matches
              </h3>
              <div className="space-y-4">
                {/* Education Comparison */}
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <GraduationCap className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">Education</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Requires:</span>
                      <span className="font-medium">{jobRequirements.degreeRequirement}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-600">Has:</span>
                      <span className="font-medium">{applicant.education || 'Not specified'}</span>
                      {applicant.educationScore >= 80 && (
                        <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                      )}
                      {applicant.educationScore >= 40 && applicant.educationScore < 80 && (
                        <AlertCircle className="w-5 h-5 text-yellow-500 ml-2" />
                      )}
                      {applicant.educationScore < 40 && (
                        <XCircle className="w-5 h-5 text-red-500 ml-2" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Experience Comparison */}
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <Briefcase className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">Experience</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Requires:</span>
                      <span className="font-medium">{jobRequirements.yearsOfExperience} years</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-600">Has:</span>
                      <span className="font-medium">{applicant.experience || 0} years</span>
                      {applicant.experience !== undefined && applicant.experience >= jobRequirements.yearsOfExperience ? (
                        applicant.experience > jobRequirements.yearsOfExperience * 1.5 ? (
                          <div className="flex items-center ml-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                          </div>
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                        )
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 ml-2" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Skills Comparison */}
                {jobRequirements.skills && jobRequirements.skills.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <Wrench className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-2">Skills Match</p>
                      <div className="space-y-2">
                        {jobRequirements.skills.map((reqSkill, idx) => {
                          const hasSkill = applicant.skills?.some(
                            s => s.toLowerCase().includes(reqSkill.toLowerCase()) ||
                                 reqSkill.toLowerCase().includes(s.toLowerCase())
                          );
                          return (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              {hasSkill ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                              <span className={hasSkill ? 'text-gray-900' : 'text-gray-500'}>
                                {reqSkill}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Eligibility Comparison */}
                {jobRequirements.eligibilities && jobRequirements.eligibilities.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-2">Eligibility Match</p>
                      <div className="space-y-2">
                        {jobRequirements.eligibilities.map((reqElig, idx) => {
                          const hasEligibility = applicant.eligibilities?.some((e: any) => {
                            // Ensure e is a string (handle objects with eligibilityTitle or name property)
                            const eligStr = typeof e === 'string' ? e : (e?.eligibilityTitle || e?.name || String(e));
                            return eligStr.toLowerCase().includes(reqElig.toLowerCase()) ||
                                   reqElig.toLowerCase().includes(eligStr.toLowerCase());
                          });
                          return (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              {hasEligibility ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                              <span className={hasEligibility ? 'text-gray-900' : 'text-gray-500'}>
                                {reqElig}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Executive Summary & Analysis */}
        <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Executive Summary
          </h3>

          {/* Summary Paragraph */}
          {applicant.reasoning && (
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {(() => {
                // Remove technical algorithm references
                let cleanReasoning = applicant.reasoning
                  .replace(/Algo(?:rithm)?\s*\d+:\s*[\d.]+\s*\(\d+%\)[,\s|]*/gi, '')
                  .replace(/Using.*?algorithm/gi, 'Based on comprehensive evaluation')
                  .replace(/ensemble\s*(?:method|approach)/gi, 'multi-factor assessment')
                  .trim();

                // If reasoning is too technical or empty, generate a clean summary
                if (cleanReasoning.length < 20 || cleanReasoning.includes('Algo')) {
                  const summaryParts = [];

                  if (applicant.educationScore >= 80) {
                    summaryParts.push('strong educational background');
                  }
                  if (applicant.experienceScore >= 80) {
                    summaryParts.push(applicant.experience && jobRequirements && applicant.experience > jobRequirements.yearsOfExperience
                      ? 'excellent relevant experience'
                      : 'solid work experience');
                  }
                  if (applicant.skillsScore >= 60) {
                    summaryParts.push('good technical skills match');
                  }
                  if (applicant.eligibilityScore >= 80) {
                    summaryParts.push('appropriate certifications');
                  }

                  if (summaryParts.length > 0) {
                    cleanReasoning = `${applicant.rank === 1 ? 'Strong' : 'Qualified'} candidate with ${summaryParts.join(', ')}. `;
                  } else {
                    cleanReasoning = 'Candidate evaluated across multiple qualification criteria. ';
                  }

                  // Add recommendation
                  if (applicant.matchScore >= 80) {
                    cleanReasoning += 'Highly recommended for interview.';
                  } else if (applicant.matchScore >= 60) {
                    cleanReasoning += 'Recommended for further consideration.';
                  } else {
                    cleanReasoning += 'May require additional assessment.';
                  }
                }

                return cleanReasoning;
              })()}
            </p>
          )}

          {/* Strengths & Gaps Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                STRENGTHS
              </h4>
              <div className="space-y-2 text-sm">
                {applicant.educationScore >= 80 && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>
                      {applicant.educationScore === 100 ? 'Fully meets' : 'Meets'} education requirement
                      {applicant.education && ` (${applicant.education})`}
                    </span>
                  </div>
                )}
                {applicant.experienceScore >= 80 && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>
                      {applicant.experience && jobRequirements && applicant.experience > jobRequirements.yearsOfExperience
                        ? `${roundExperience(applicant.experience - jobRequirements.yearsOfExperience)} years above required experience`
                        : 'Meets experience requirement'}
                    </span>
                  </div>
                )}
                {applicant.skillsScore >= 60 && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Demonstrates relevant technical skills</span>
                  </div>
                )}
                {applicant.eligibilityScore >= 80 && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Has required certifications/eligibilities</span>
                  </div>
                )}
                {applicant.educationScore < 80 && applicant.experienceScore < 80 && applicant.skillsScore < 60 && applicant.eligibilityScore < 80 && (
                  <div className="flex items-start gap-2 text-gray-500 italic">
                    <span>No major strengths identified</span>
                  </div>
                )}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                AREAS FOR IMPROVEMENT
              </h4>
              <div className="space-y-2 text-sm">
                {applicant.educationScore < 80 && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <span className="text-orange-600 mt-0.5">⚠</span>
                    <span>Education level below requirement</span>
                  </div>
                )}
                {applicant.experienceScore < 80 && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <span className="text-orange-600 mt-0.5">⚠</span>
                    <span>
                      {jobRequirements && applicant.experience !== undefined
                        ? `Needs ${jobRequirements.yearsOfExperience - applicant.experience} more years of experience`
                        : 'Limited relevant experience'}
                    </span>
                  </div>
                )}
                {applicant.skillsScore < 60 && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <span className="text-orange-600 mt-0.5">⚠</span>
                    <span>
                      {jobRequirements && jobRequirements.skills && jobRequirements.skills.length > 0
                        ? `Missing ${jobRequirements.skills.length - (applicant.skills?.filter(s =>
                            jobRequirements.skills.some(rs =>
                              s.toLowerCase().includes(rs.toLowerCase()) ||
                              rs.toLowerCase().includes(s.toLowerCase())
                            )
                          ).length || 0)} required skills`
                        : 'Skills gap identified'}
                    </span>
                  </div>
                )}
                {applicant.eligibilityScore < 80 && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <span className="text-orange-600 mt-0.5">⚠</span>
                    <span>Missing some required certifications</span>
                  </div>
                )}
                {applicant.educationScore >= 80 && applicant.experienceScore >= 80 && applicant.skillsScore >= 60 && applicant.eligibilityScore >= 80 && (
                  <div className="flex items-start gap-2 text-gray-500 italic">
                    <span>No significant gaps identified</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommendation Badge */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Recommendation:</span>
              {applicant.matchScore >= 80 ? (
                <Badge variant="success">Highly Recommended for Interview</Badge>
              ) : applicant.matchScore >= 60 ? (
                <Badge variant="info">Recommended for Consideration</Badge>
              ) : applicant.matchScore >= 40 ? (
                <Badge variant="warning">Conditional - Further Assessment Needed</Badge>
              ) : (
                <Badge variant="default">Does Not Meet Minimum Requirements</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Algorithm Analysis Section */}
        {applicant.algorithmDetails && (
          <div className="mt-6 p-5 bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl border-2 border-indigo-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Algorithm Analysis
            </h3>

            {/* Algorithm Method Used */}
            <div className="mb-4 p-4 bg-white rounded-lg">
              <h4 className="text-sm font-semibold text-indigo-700 mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                SCORING METHOD
              </h4>
              <p className="text-sm text-gray-700">
                {applicant.algorithmDetails.isTieBreaker ? (
                  <>
                    <Badge variant="warning" className="mr-2">Tie-breaker Applied</Badge>
                    <span>
                      Algorithm 1 and Algorithm 2 scores were within <strong>{applicant.algorithmDetails.scoreDifference?.toFixed(2)} points</strong> of each other,
                      so Algorithm 3 (Eligibility-Education Tie-breaker) was used to determine the final rank.
                    </span>
                  </>
                ) : (
                  <>
                    <Badge variant="info" className="mr-2">Weighted Average</Badge>
                    <span>
                      Final score calculated using weighted combination: <strong>60% Algorithm 1</strong> + <strong>40% Algorithm 2</strong>
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Individual Algorithm Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Algorithm 1 */}
              {applicant.algorithmDetails.algorithm1Score !== undefined && (
                <div className="p-4 bg-white rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Algorithm 1</p>
                      <p className="text-xs text-gray-500">Weighted Sum</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {applicant.algorithmDetails.algorithm1Score.toFixed(1)}
                  </p>
                  {!applicant.algorithmDetails.isTieBreaker && (
                    <p className="text-xs text-gray-500 mt-1">Weight: 60%</p>
                  )}
                </div>
              )}

              {/* Algorithm 2 */}
              {applicant.algorithmDetails.algorithm2Score !== undefined && (
                <div className="p-4 bg-white rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Algorithm 2</p>
                      <p className="text-xs text-gray-500">Skill-Experience</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {applicant.algorithmDetails.algorithm2Score.toFixed(1)}
                  </p>
                  {!applicant.algorithmDetails.isTieBreaker && (
                    <p className="text-xs text-gray-500 mt-1">Weight: 40%</p>
                  )}
                </div>
              )}

              {/* Algorithm 3 (if tie-breaker) */}
              {applicant.algorithmDetails.algorithm3Score !== undefined && applicant.algorithmDetails.isTieBreaker && (
                <div className="p-4 bg-white rounded-lg border-l-4 border-yellow-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Algorithm 3</p>
                      <p className="text-xs text-gray-500">Tie-breaker</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {applicant.algorithmDetails.algorithm3Score.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Weight: 100%</p>
                </div>
              )}
            </div>

            {/* Calculation Summary */}
            <div className="p-4 bg-white rounded-lg">
              <h4 className="text-sm font-semibold text-indigo-700 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                FINAL CALCULATION
              </h4>
              <div className="text-sm text-gray-700">
                {applicant.algorithmDetails.isTieBreaker ? (
                  <div className="space-y-1">
                    <p>
                      <strong>Algorithm 3 Score:</strong> {applicant.algorithmDetails.algorithm3Score?.toFixed(2)} × 100%
                      = <strong className="text-indigo-600">{applicant.matchScore.toFixed(2)}</strong>
                    </p>
                    <p className="text-xs text-gray-500 italic">
                      Tie-breaker algorithm prioritizes eligibility and education when scores are close.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p>
                      <strong>Algorithm 1:</strong> {applicant.algorithmDetails.algorithm1Score?.toFixed(2)} × 60%
                      = {((applicant.algorithmDetails.algorithm1Score || 0) * 0.6).toFixed(2)}
                    </p>
                    <p>
                      <strong>Algorithm 2:</strong> {applicant.algorithmDetails.algorithm2Score?.toFixed(2)} × 40%
                      = {((applicant.algorithmDetails.algorithm2Score || 0) * 0.4).toFixed(2)}
                    </p>
                    <p className="pt-2 border-t border-gray-200 mt-2">
                      <strong>Final Score:</strong> <strong className="text-indigo-600">{applicant.matchScore.toFixed(2)}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Learn More Button */}
            <div className="mt-4 pt-4 border-t border-indigo-200">
              <button
                onClick={() => setIsAlgorithmInfoOpen(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 transition-colors hover:underline"
              >
                <Sparkles className="w-4 h-4" />
                Learn More About These Algorithms
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Algorithm Info Modal */}
      <AlgorithmInfoModal
        isOpen={isAlgorithmInfoOpen}
        onClose={() => setIsAlgorithmInfoOpen(false)}
      />
    </Modal>
  );
}
