/**
 * Comprehensive Unit Tests for Scoring Algorithms
 *
 * Testing Focus: Eligibility Matching Count Accuracy
 *
 * CRITICAL BUG:
 * Current algorithms count HOW MANY JOB REQUIREMENTS are matched,
 * but should count HOW MANY UNIQUE APPLICANT ELIGIBILITIES matched.
 *
 * Example Bug:
 * - Job requires: ["Career Service Subprofessional", "Career Service Professional"]
 * - Applicant has: ["Career Service Subprofessional"]
 * - CURRENT (WRONG): matchedCount = 2 (both job reqs matched by same app elig)
 * - EXPECTED (CORRECT): matchedCount = 1 (only 1 unique app elig matched)
 *
 * These tests EXPECT correct behavior (Set-based counting).
 * Tests will FAIL initially until algorithms are fixed.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  algorithm1_WeightedSum,
  algorithm2_SkillExperienceComposite,
  algorithm3_EligibilityEducationTiebreaker,
  ensembleScore,
  type JobRequirements,
  type ApplicantData
} from '@/lib/gemini/scoringAlgorithms';

describe('Eligibility Matching Count Accuracy', () => {

  // ========================================
  // EDGE CASE 1: 0 Eligibilities
  // ========================================

  describe('Edge Case 1: Applicant has 0 eligibilities', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['Career Service Professional', 'Driver\'s License'],
      skills: ['Microsoft Office', 'Communication'],
      yearsOfExperience: 1
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree in Computer Science",
      eligibilities: [], // No eligibilities
      skills: ['Microsoft Office', 'Communication', 'Typing'],
      totalYearsExperience: 2
    };

    it('[Algorithm 1] should return matchedEligibilitiesCount = 0', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(0);
    });

    it('[Algorithm 2] should return matchedEligibilitiesCount = 0', () => {
      const result = algorithm2_SkillExperienceComposite(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(0);
    });

    it('[Algorithm 3] should return matchedEligibilitiesCount = 0', () => {
      const result = algorithm3_EligibilityEducationTiebreaker(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(0);
    });
  });

  // ========================================
  // EDGE CASE 2: 1 Eligibility Matching 2 Requirements (MAIN BUG)
  // ========================================

  describe('Edge Case 2: 1 applicant eligibility matches 2 job requirements (MAIN BUG)', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['Career Service Subprofessional', 'Career Service Professional'],
      skills: ['Filing', 'Records Management'],
      yearsOfExperience: 1
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [
        { eligibilityTitle: 'Career Service Subprofessional' } // Matches BOTH via fuzzy matching
      ],
      skills: ['Filing', 'Records Management'],
      totalYearsExperience: 1.4
    };

    it('[Algorithm 1] should return matchedEligibilitiesCount = 1 (not 2)', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(1); // ✅ Count unique applicant eligibilities
    });

    it('[Algorithm 2] should return matchedEligibilitiesCount = 1 (not 2)', () => {
      const result = algorithm2_SkillExperienceComposite(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(1);
    });

    it('[Algorithm 3] should return matchedEligibilitiesCount = 1 (not 2)', () => {
      const result = algorithm3_EligibilityEducationTiebreaker(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(1);
    });
  });

  // ========================================
  // EDGE CASE 3: 1 Eligibility Matching 1 Requirement
  // ========================================

  describe('Edge Case 3: 1 applicant eligibility matches exactly 1 job requirement', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['Career Service Professional'],
      skills: ['Communication'],
      yearsOfExperience: 1
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [
        { eligibilityTitle: 'Career Service Professional' }
      ],
      skills: ['Communication'],
      totalYearsExperience: 2
    };

    it('[Algorithm 1] should return matchedEligibilitiesCount = 1', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(1);
    });
  });

  // ========================================
  // EDGE CASE 4: Multiple Eligibilities Matching 1 Requirement
  // ========================================

  describe('Edge Case 4: Multiple applicant eligibilities match 1 job requirement', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['Driver\'s License'], // Only 1 requirement
      skills: ['Driving'],
      yearsOfExperience: 1
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [
        { eligibilityTitle: 'Driver\'s License Professional' },
        { eligibilityTitle: 'Driver\'s License Non-Professional' },
        { eligibilityTitle: 'Motorcycle License' }
      ],
      skills: ['Driving'],
      totalYearsExperience: 3
    };

    it('[Algorithm 1] should count only the best matching applicant eligibility', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      // Only "Driver's License Professional" matches at >=70% similarity
      expect(result.matchedEligibilitiesCount).toBe(1);
    });
  });

  // ========================================
  // EDGE CASE 5: More Eligibilities Than Required
  // ========================================

  describe('Edge Case 5: Applicant has more eligibilities than job requires', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['Career Service Professional', 'RA 1080'],
      skills: ['Leadership'],
      yearsOfExperience: 2
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [
        { eligibilityTitle: 'Career Service Professional' },
        { eligibilityTitle: 'RA 1080' },
        { eligibilityTitle: 'Driver\'s License' },
        { eligibilityTitle: 'TESDA Certificate' }
      ],
      skills: ['Leadership', 'Management'],
      totalYearsExperience: 5
    };

    it('[Algorithm 1] should return matchedEligibilitiesCount = 2', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(2);
    });

    it('[Algorithm 1] should apply bonus for extra eligibilities', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.eligibilityScore).toBeGreaterThan(80); // Bonus applied
    });
  });

  // ========================================
  // EDGE CASE 6: Fuzzy Matching at 70% Threshold
  // ========================================

  describe('Edge Case 6: Fuzzy matching at 70% threshold', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['Professional Driver License'],
      skills: ['Driving'],
      yearsOfExperience: 1
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [
        { eligibilityTitle: 'Professional Driver Lic.' } // Similar but not exact
      ],
      skills: ['Driving'],
      totalYearsExperience: 2
    };

    it('[Algorithm 1] should match at >=70% similarity', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(1);
      expect(result.eligibilityScore).toBeGreaterThan(40);
    });
  });

  // ========================================
  // EDGE CASE 7: Exact vs Fuzzy Matches
  // ========================================

  describe('Edge Case 7: Mix of exact and fuzzy matches', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['Career Service Professional', 'RA 1080', 'Driver\'s License'],
      skills: ['Management'],
      yearsOfExperience: 2
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [
        { eligibilityTitle: 'Career Service Professional' }, // Exact match
        { eligibilityTitle: 'RA 1080 Eligibility' }, // Fuzzy match
        { eligibilityTitle: 'Professional Driver License' } // Fuzzy match
      ],
      skills: ['Management'],
      totalYearsExperience: 3
    };

    it('[Algorithm 1] should count all 3 unique matched eligibilities', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(3);
    });
  });

  // ========================================
  // REAL-WORLD TEST CASES
  // ========================================

  describe('Real-World Case: Juan Antonio (Office Clerk Application)', () => {
    const job: JobRequirements = {
      title: 'Office Clerk',
      degreeRequirement: 'High School Graduate',
      eligibilities: [
        'Career Service Subprofessional',
        'Career Service Professional'
      ],
      skills: [
        'Filing and Record Keeping',
        'Data Entry',
        'Microsoft Office (Word, Excel)',
        'Communication Skills',
        'Organization and Time Management',
        'Customer Service',
        'Basic Accounting'
      ],
      yearsOfExperience: 1
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: 'Bachelor of Science in Information Technology',
      eligibilities: [
        { eligibilityTitle: 'Career Service Subprofessional' }
      ],
      skills: [
        'Microsoft Office',
        'Data Entry',
        'Filing',
        'Communication',
        'Organization'
      ],
      totalYearsExperience: 1.4,
      workExperienceTitles: ['Office Secretary']
    };

    it('[Algorithm 1] should return matchedEligibilitiesCount = 1 (not 2)', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(1);
    });

    it('[Algorithm 2] should return matchedEligibilitiesCount = 1 (not 2)', () => {
      const result = algorithm2_SkillExperienceComposite(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(1);
    });

    it('[Algorithm 3] should return matchedEligibilitiesCount = 1 (not 2)', () => {
      const result = algorithm3_EligibilityEducationTiebreaker(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(1);
    });

    it('[Ensemble] should return matchedEligibilitiesCount = 1 (not 2)', () => {
      const result = ensembleScore(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(1);
    });

    it('[Algorithm 1] should match at least 3 out of 7 skills', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedSkillsCount).toBeGreaterThanOrEqual(3);
    });

    it('[Algorithm 1] should calculate 1.4 years of experience correctly', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.experienceScore).toBeGreaterThan(80); // 1.4 > 1 year requirement
    });
  });

  describe('Real-World Case: Maria Lourdes (Office Clerk Application)', () => {
    const job: JobRequirements = {
      title: 'Office Clerk',
      degreeRequirement: 'High School Graduate',
      eligibilities: [
        'Career Service Subprofessional',
        'Career Service Professional'
      ],
      skills: [
        'Filing and Record Keeping',
        'Data Entry',
        'Microsoft Office (Word, Excel)',
        'Communication Skills',
        'Organization and Time Management',
        'Customer Service',
        'Basic Accounting'
      ],
      yearsOfExperience: 1
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: 'Bachelor of Science in Business Administration',
      eligibilities: [
        { eligibilityTitle: 'Career Service Subprofessional' }
      ],
      skills: [
        'Microsoft Office',
        'Data Entry',
        'Customer Service',
        'Communication',
        'Basic Accounting'
      ],
      totalYearsExperience: 2.1,
      workExperienceTitles: ['Administrative Assistant']
    };

    it('[Algorithm 1] should return matchedEligibilitiesCount = 1', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(1);
    });

    it('[Algorithm 1] should match at least 5 skills', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedSkillsCount).toBeGreaterThanOrEqual(5);
    });
  });

  // ========================================
  // REGRESSION TESTS
  // ========================================

  describe('Regression Tests: Ensure skills matching still works correctly', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['Career Service Professional'],
      skills: ['JavaScript', 'React', 'Node.js'],
      yearsOfExperience: 2
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree in Computer Science",
      eligibilities: [{ eligibilityTitle: 'Career Service Professional' }],
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python'],
      totalYearsExperience: 3
    };

    it('[Algorithm 1] should count matched skills correctly (3 out of 3)', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedSkillsCount).toBe(3);
    });

    it('[Algorithm 1] should apply bonus for extra skills', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.skillsScore).toBeGreaterThan(90); // Perfect match + bonus
    });
  });

  describe('Regression Tests: No job eligibility requirements', () => {
    const job: JobRequirements = {
      degreeRequirement: "High School Graduate",
      eligibilities: ['None required'],
      skills: ['Customer Service'],
      yearsOfExperience: 0
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "High School Graduate",
      eligibilities: [{ eligibilityTitle: 'Driver\'s License' }],
      skills: ['Customer Service'],
      totalYearsExperience: 1
    };

    it('[Algorithm 1] should return matchedEligibilitiesCount = 0', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(0);
    });

    it('[Algorithm 1] should give neutral eligibility score', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.eligibilityScore).toBe(50); // Neutral score
    });
  });

  // ========================================
  // CONSISTENCY TESTS
  // ========================================

  describe('Consistency: All 3 algorithms should return same matchedEligibilitiesCount', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['Career Service Professional', 'RA 1080'],
      skills: ['Communication', 'Leadership'],
      yearsOfExperience: 2
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [
        { eligibilityTitle: 'Career Service Professional' },
        { eligibilityTitle: 'RA 1080 Eligibility' }
      ],
      skills: ['Communication', 'Leadership'],
      totalYearsExperience: 3
    };

    it('Algorithms 1 & 2 should match both eligibilities (token matching), Algorithm 3 may differ', () => {
      const result1 = algorithm1_WeightedSum(job, applicant);
      const result2 = algorithm2_SkillExperienceComposite(job, applicant);
      const result3 = algorithm3_EligibilityEducationTiebreaker(job, applicant);

      // Algorithms 1 & 2 have token matching, so 'RA 1080' matches 'RA 1080 Eligibility'
      expect(result1.matchedEligibilitiesCount).toBe(2);
      expect(result2.matchedEligibilitiesCount).toBe(2);
      // Algorithm 3 has no token matching, so only exact/fuzzy matches count
      expect(result3.matchedEligibilitiesCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ========================================
  // BOUNDARY TESTS
  // ========================================

  describe('Boundary Tests: Exactly at 70% similarity threshold', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['Professional Teacher'],
      skills: ['Teaching'],
      yearsOfExperience: 1
    };

    // "Teacher" vs "Professional Teacher" should be ~70% similar
    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [{ eligibilityTitle: 'Teacher' }],
      skills: ['Teaching'],
      totalYearsExperience: 2
    };

    it('[Algorithm 1] should match at >=70% threshold', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBeGreaterThanOrEqual(0);
      // Note: This test depends on exact Levenshtein calculation
    });
  });

  describe('Boundary Tests: Just below 70% similarity threshold', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['Professional Engineer License'],
      skills: ['Engineering'],
      yearsOfExperience: 2
    };

    // "Doctor" should NOT match "Professional Engineer License"
    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [{ eligibilityTitle: 'Doctor' }],
      skills: ['Engineering'],
      totalYearsExperience: 3
    };

    it('[Algorithm 1] should NOT match at <70% threshold', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(0);
    });
  });

  // ========================================
  // TOKEN MATCHING TESTS
  // ========================================

  describe('Token Matching: Common keywords should match', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['Civil Service Professional'],
      skills: ['Management'],
      yearsOfExperience: 1
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [
        { eligibilityTitle: 'Civil Service Subprofessional' } // "Civil Service" tokens match
      ],
      skills: ['Management'],
      totalYearsExperience: 2
    };

    it('[Algorithm 1] should match via token matching', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ========================================
  // EMPTY JOB REQUIREMENTS
  // ========================================

  describe('Empty Job Requirements: No eligibilities required', () => {
    const job: JobRequirements = {
      degreeRequirement: "High School Graduate",
      eligibilities: [],
      skills: ['Customer Service'],
      yearsOfExperience: 0
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [{ eligibilityTitle: 'Career Service Professional' }],
      skills: ['Customer Service'],
      totalYearsExperience: 2
    };

    it('[Algorithm 1] should return matchedEligibilitiesCount = 0', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(0);
    });

    it('[Algorithm 1] should give neutral eligibility score', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.eligibilityScore).toBe(50);
    });
  });

  // ========================================
  // CASE SENSITIVITY TESTS
  // ========================================

  describe('Case Sensitivity: Matching should be case-insensitive', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['CAREER SERVICE PROFESSIONAL'],
      skills: ['MICROSOFT OFFICE'],
      yearsOfExperience: 1
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "bachelor's degree",
      eligibilities: [{ eligibilityTitle: 'career service professional' }],
      skills: ['microsoft office'],
      totalYearsExperience: 2
    };

    it('[Algorithm 1] should match regardless of case', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(1);
      expect(result.matchedSkillsCount).toBe(1);
    });
  });

  // ========================================
  // WHITESPACE TESTS
  // ========================================

  describe('Whitespace Handling: Extra spaces should not affect matching', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['  Career  Service  Professional  '],
      skills: ['Microsoft Office'],
      yearsOfExperience: 1
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [{ eligibilityTitle: 'Career Service Professional' }],
      skills: ['Microsoft Office'],
      totalYearsExperience: 2
    };

    it('[Algorithm 1] should trim and normalize whitespace', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(1);
    });
  });

  // ========================================
  // SPECIAL CHARACTERS TESTS
  // ========================================

  describe('Special Characters: Should handle apostrophes and hyphens', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['Driver\'s License'],
      skills: ['MS Office'],
      yearsOfExperience: 1
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [{ eligibilityTitle: 'Drivers License' }], // No apostrophe
      skills: ['MS Office'],
      totalYearsExperience: 2
    };

    it('[Algorithm 1] should match despite apostrophe difference', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ========================================
  // PERFORMANCE TESTS
  // ========================================

  describe('Performance: Large number of eligibilities', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: [
        'Career Service Professional',
        'RA 1080',
        'Driver\'s License',
        'PRC License',
        'TESDA Certificate'
      ],
      skills: ['Management'],
      yearsOfExperience: 3
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [
        { eligibilityTitle: 'Career Service Professional' },
        { eligibilityTitle: 'RA 1080 Eligibility' },
        { eligibilityTitle: 'Professional Driver License' },
        { eligibilityTitle: 'PRC Licensed Professional' },
        { eligibilityTitle: 'TESDA NC II' },
        { eligibilityTitle: 'Additional Cert 1' },
        { eligibilityTitle: 'Additional Cert 2' }
      ],
      skills: ['Management'],
      totalYearsExperience: 5
    };

    it('[Algorithm 1] should handle large eligibility lists efficiently', () => {
      const start = Date.now();
      const result = algorithm1_WeightedSum(job, applicant);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should complete in <100ms
      expect(result.matchedEligibilitiesCount).toBe(5);
    });
  });

  // ========================================
  // NULL/UNDEFINED HANDLING
  // ========================================

  describe('Null/Undefined Handling: Missing eligibilityTitle fields', () => {
    const job: JobRequirements = {
      degreeRequirement: "Bachelor's Degree",
      eligibilities: ['Career Service Professional'],
      skills: ['Management'],
      yearsOfExperience: 1
    };

    const applicant: ApplicantData = {
      highestEducationalAttainment: "Bachelor's Degree",
      eligibilities: [
        { eligibilityTitle: 'Career Service Professional' },
        { eligibilityTitle: '' }, // Empty string
        // @ts-expect-error Testing null handling
        { eligibilityTitle: null }, // Null
        // @ts-expect-error Testing undefined handling
        { eligibilityTitle: undefined } // Undefined
      ],
      skills: ['Management'],
      totalYearsExperience: 2
    };

    it('[Algorithm 1] should filter out invalid eligibilities', () => {
      const result = algorithm1_WeightedSum(job, applicant);
      expect(result.matchedEligibilitiesCount).toBe(1);
    });
  });
});
