import { Database } from './database.types';

/**
 * Supabase Type Helpers
 *
 * These types provide convenient access to database table types
 * and help with type-safe database queries
 */

// Table row types (for SELECT queries)
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Job = Database['public']['Tables']['jobs']['Row'];
export type Application = Database['public']['Tables']['applications']['Row'];
export type ApplicantProfile = Database['public']['Tables']['applicant_profiles']['Row'];
export type TrainingProgram = Database['public']['Tables']['training_programs']['Row'];
export type TrainingApplication = Database['public']['Tables']['training_applications']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
export type Announcement = Database['public']['Tables']['announcements']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type AuditTrail = Database['public']['Tables']['audit_trail']['Row'];

// Insert types (for INSERT queries)
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type JobInsert = Database['public']['Tables']['jobs']['Insert'];
export type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];
export type ApplicantProfileInsert = Database['public']['Tables']['applicant_profiles']['Insert'];
export type TrainingProgramInsert = Database['public']['Tables']['training_programs']['Insert'];
export type TrainingApplicationInsert = Database['public']['Tables']['training_applications']['Insert'];
export type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert'];
export type AnnouncementInsert = Database['public']['Tables']['announcements']['Insert'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

// Update types (for UPDATE queries)
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type JobUpdate = Database['public']['Tables']['jobs']['Update'];
export type ApplicationUpdate = Database['public']['Tables']['applications']['Update'];
export type ApplicantProfileUpdate = Database['public']['Tables']['applicant_profiles']['Update'];
export type TrainingProgramUpdate = Database['public']['Tables']['training_programs']['Update'];
export type TrainingApplicationUpdate = Database['public']['Tables']['training_applications']['Update'];
export type AnnouncementUpdate = Database['public']['Tables']['announcements']['Update'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

// Enum types
export type UserRole = Database['public']['Enums']['user_role'];
export type ApplicationStatus = Database['public']['Enums']['application_status'];
export type JobStatus = Database['public']['Enums']['job_status'];

// Extended types with relations (for joined queries)
export interface ApplicationWithRelations extends Application {
  applicant?: ApplicantProfile;
  job?: Job;
}

export interface JobWithApplications extends Job {
  applications?: Application[];
}

export interface TrainingProgramWithApplications extends TrainingProgram {
  applications?: TrainingApplication[];
}

// Gemini AI Ranking Types
export interface RankingScores {
  education_score: number;
  experience_score: number;
  skills_score: number;
  eligibility_score: number;
  match_score: number;
}

export interface RankingDetails {
  score: number;
  reasoning: string;
  algorithm: string;
}

export interface FullRankingResult {
  application_id: string;
  education: RankingDetails;
  experience: RankingDetails;
  skills: RankingDetails;
  eligibility: RankingDetails;
  final: RankingDetails;
  ranked_at: string;
}

// Extended types with profile relations
export interface ApplicationWithProfile extends Application {
  applicant: Profile;
  applicant_profile?: ApplicantProfile;
  job?: Job;
}

export interface NotificationWithUser extends Notification {
  user: Profile;
}
