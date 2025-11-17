/**
 * Statistical Utilities for Ranking Analysis
 * Provides functions for calculating percentiles, statistics, and comparisons
 * for applicant ranking across all jobs
 */

export interface Statistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
}

export interface DistributionData {
  buckets: Array<{ range: string; count: number }>;
  total: number;
}

/**
 * Calculate statistical measures for a set of values
 */
export function calculateStatistics(values: number[]): Statistics {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
  }

  // Remove null/undefined values and sort
  const validValues = values.filter(v => v != null && !isNaN(v));
  if (validValues.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
  }

  const sorted = [...validValues].sort((a, b) => a - b);

  // Min and Max
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // Mean
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / sorted.length;

  // Median
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  // Standard Deviation
  const squaredDiffs = sorted.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / sorted.length;
  const stdDev = Math.sqrt(avgSquaredDiff);

  return {
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    mean: Math.round(mean * 10) / 10,
    median: Math.round(median * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
  };
}

/**
 * Calculate percentile ranking for a value within a dataset
 * Returns a number from 0-100, where 100 means the value is better than everyone
 */
export function calculatePercentile(value: number, allValues: number[]): number {
  if (allValues.length === 0 || value == null || isNaN(value)) {
    return 0;
  }

  // Remove null/undefined values
  const validValues = allValues.filter(v => v != null && !isNaN(v));
  if (validValues.length === 0) {
    return 0;
  }

  // Count how many values are strictly less than the current value
  const countBelow = validValues.filter(v => v < value).length;

  // Percentile = (count below / total count) * 100
  const percentile = (countBelow / validValues.length) * 100;

  return Math.round(percentile);
}

/**
 * Get distribution data for visualization (histogram buckets)
 */
export function getDistributionData(values: number[], bucketCount: number = 5): DistributionData {
  const validValues = values.filter(v => v != null && !isNaN(v));

  if (validValues.length === 0) {
    return { buckets: [], total: 0 };
  }

  const stats = calculateStatistics(validValues);
  const bucketSize = (stats.max - stats.min) / bucketCount;

  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const rangeStart = stats.min + (i * bucketSize);
    const rangeEnd = i === bucketCount - 1 ? stats.max : rangeStart + bucketSize;

    const count = validValues.filter(v => v >= rangeStart && v <= rangeEnd).length;

    return {
      range: `${Math.round(rangeStart)}-${Math.round(rangeEnd)}`,
      count,
    };
  });

  return {
    buckets,
    total: validValues.length,
  };
}

/**
 * Calculate the gap from the top performer
 */
export function calculateGapFromTop(
  currentScore: number,
  topScore: number
): { absolute: number; percentage: number } {
  if (topScore === 0) {
    return { absolute: 0, percentage: 0 };
  }

  const absolute = Math.round((topScore - currentScore) * 10) / 10;
  const percentage = Math.round(((topScore - currentScore) / topScore) * 100 * 10) / 10;

  return {
    absolute,
    percentage,
  };
}

/**
 * Get a human-readable performance message based on percentile
 */
export function getPerformanceMessage(percentile: number): string {
  if (percentile >= 90) return 'Exceptional';
  if (percentile >= 75) return 'Above Average';
  if (percentile >= 50) return 'Average';
  if (percentile >= 25) return 'Below Average';
  return 'Needs Improvement';
}

/**
 * Get a color class based on percentile for UI styling
 */
export function getPercentileColor(percentile: number): string {
  if (percentile >= 80) return 'text-green-600';
  if (percentile >= 60) return 'text-blue-600';
  if (percentile >= 40) return 'text-yellow-600';
  if (percentile >= 20) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get comparison text for percentile
 * Example: "Better than 75% of applicants"
 */
export function getPercentileText(percentile: number, totalApplicants: number): string {
  if (totalApplicants <= 1) {
    return 'Only applicant';
  }

  if (percentile === 100) {
    return `Best among all ${totalApplicants} applicants`;
  }

  if (percentile === 0) {
    return `Lowest among all ${totalApplicants} applicants`;
  }

  return `Better than ${percentile}% of applicants`;
}

/**
 * Get ordinal rank text (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalRank(rank: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = rank % 100;

  return rank + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
}

/**
 * Determine if an applicant is in the top tier
 */
export function isTopTier(rank: number, totalApplicants: number): boolean {
  if (totalApplicants <= 3) {
    return rank === 1;
  }

  // Top 33% or top 3, whichever is smaller
  const topTierSize = Math.max(3, Math.ceil(totalApplicants * 0.33));
  return rank <= topTierSize;
}

/**
 * Calculate relative position message
 */
export function getRelativePositionMessage(rank: number, totalApplicants: number): string {
  if (totalApplicants === 1) {
    return 'Only applicant for this position';
  }

  const percentFromTop = ((rank - 1) / (totalApplicants - 1)) * 100;

  if (rank === 1) {
    return 'Top-ranked candidate';
  }

  if (rank === 2) {
    return 'Second highest-ranked candidate';
  }

  if (rank === 3) {
    return 'Third highest-ranked candidate';
  }

  if (percentFromTop <= 25) {
    return 'Among top quarter of applicants';
  }

  if (percentFromTop <= 50) {
    return 'In upper half of applicants';
  }

  if (percentFromTop <= 75) {
    return 'In lower half of applicants';
  }

  return 'Among bottom quarter of applicants';
}
