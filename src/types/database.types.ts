export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          details: string
          event_category: Database["public"]["Enums"]["event_category"]
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          status: Database["public"]["Enums"]["event_status"]
          timestamp: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          details: string
          event_category: Database["public"]["Enums"]["event_category"]
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["event_status"]
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          details?: string
          event_category?: Database["public"]["Enums"]["event_category"]
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["event_status"]
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          category: Database["public"]["Enums"]["announcement_category"]
          created_at: string
          created_by: string
          description: string
          id: string
          image_url: string | null
          published_at: string | null
          status: Database["public"]["Enums"]["announcement_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["announcement_category"]
          created_at?: string
          created_by: string
          description: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["announcement_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["announcement_category"]
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["announcement_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_pds: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          educational_background: Json | null
          eligibility: Json | null
          family_background: Json | null
          id: string
          is_completed: boolean | null
          last_saved_section: string | null
          other_information: Json | null
          personal_info: Json | null
          signature_uploaded_at: string | null
          signature_url: string | null
          trainings: Json | null
          updated_at: string | null
          user_id: string
          voluntary_work: Json | null
          work_experience: Json | null
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string | null
          educational_background?: Json | null
          eligibility?: Json | null
          family_background?: Json | null
          id?: string
          is_completed?: boolean | null
          last_saved_section?: string | null
          other_information?: Json | null
          personal_info?: Json | null
          signature_uploaded_at?: string | null
          signature_url?: string | null
          trainings?: Json | null
          updated_at?: string | null
          user_id: string
          voluntary_work?: Json | null
          work_experience?: Json | null
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string | null
          educational_background?: Json | null
          eligibility?: Json | null
          family_background?: Json | null
          id?: string
          is_completed?: boolean | null
          last_saved_section?: string | null
          other_information?: Json | null
          personal_info?: Json | null
          signature_uploaded_at?: string | null
          signature_url?: string | null
          trainings?: Json | null
          updated_at?: string | null
          user_id?: string
          voluntary_work?: Json | null
          work_experience?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "applicant_pds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_profiles: {
        Row: {
          ai_processed: boolean | null
          blood_type: string | null
          citizenship: string | null
          civil_status: string | null
          created_at: string
          date_of_birth: string | null
          education: Json | null
          eligibilities: Json | null
          extraction_confidence: number | null
          extraction_date: string | null
          first_name: string | null
          height: number | null
          highest_educational_attainment: string | null
          id: string
          middle_name: string | null
          mobile_number: string | null
          ocr_processed: boolean | null
          permanent_address: string | null
          phone_number: string | null
          place_of_birth: string | null
          residential_address: string | null
          sex: string | null
          skills: string[] | null
          surname: string | null
          total_years_experience: number | null
          trainings_attended: Json | null
          updated_at: string
          user_id: string
          weight: number | null
          work_experience: Json | null
        }
        Insert: {
          ai_processed?: boolean | null
          blood_type?: string | null
          citizenship?: string | null
          civil_status?: string | null
          created_at?: string
          date_of_birth?: string | null
          education?: Json | null
          eligibilities?: Json | null
          extraction_confidence?: number | null
          extraction_date?: string | null
          first_name?: string | null
          height?: number | null
          highest_educational_attainment?: string | null
          id?: string
          middle_name?: string | null
          mobile_number?: string | null
          ocr_processed?: boolean | null
          permanent_address?: string | null
          phone_number?: string | null
          place_of_birth?: string | null
          residential_address?: string | null
          sex?: string | null
          skills?: string[] | null
          surname?: string | null
          total_years_experience?: number | null
          trainings_attended?: Json | null
          updated_at?: string
          user_id: string
          weight?: number | null
          work_experience?: Json | null
        }
        Update: {
          ai_processed?: boolean | null
          blood_type?: string | null
          citizenship?: string | null
          civil_status?: string | null
          created_at?: string
          date_of_birth?: string | null
          education?: Json | null
          eligibilities?: Json | null
          extraction_confidence?: number | null
          extraction_date?: string | null
          first_name?: string | null
          height?: number | null
          highest_educational_attainment?: string | null
          id?: string
          middle_name?: string | null
          mobile_number?: string | null
          ocr_processed?: boolean | null
          permanent_address?: string | null
          phone_number?: string | null
          place_of_birth?: string | null
          residential_address?: string | null
          sex?: string | null
          skills?: string[] | null
          surname?: string | null
          total_years_experience?: number | null
          trainings_attended?: Json | null
          updated_at?: string
          user_id?: string
          weight?: number | null
          work_experience?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "applicant_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          algorithm_details: Json | null
          algorithm_used: string | null
          applicant_id: string
          applicant_profile_id: string | null
          created_at: string
          denial_reason: string | null
          education_score: number | null
          eligibility_score: number | null
          experience_score: number | null
          hr_notes: string | null
          id: string
          interview_date: string | null
          job_id: string
          match_score: number | null
          next_steps: string | null
          notification_sent: boolean | null
          pds_id: string | null
          rank: number | null
          ranking_reasoning: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          skills_score: number | null
          status: Database["public"]["Enums"]["application_status"]
          status_history: Json | null
          updated_at: string
          withdrawn_at: string | null
          withdrawn_by: string | null
        }
        Insert: {
          algorithm_details?: Json | null
          algorithm_used?: string | null
          applicant_id: string
          applicant_profile_id?: string | null
          created_at?: string
          denial_reason?: string | null
          education_score?: number | null
          eligibility_score?: number | null
          experience_score?: number | null
          hr_notes?: string | null
          id?: string
          interview_date?: string | null
          job_id: string
          match_score?: number | null
          next_steps?: string | null
          notification_sent?: boolean | null
          pds_id?: string | null
          rank?: number | null
          ranking_reasoning?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills_score?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          status_history?: Json | null
          updated_at?: string
          withdrawn_at?: string | null
          withdrawn_by?: string | null
        }
        Update: {
          algorithm_details?: Json | null
          algorithm_used?: string | null
          applicant_id?: string
          applicant_profile_id?: string | null
          created_at?: string
          denial_reason?: string | null
          education_score?: number | null
          eligibility_score?: number | null
          experience_score?: number | null
          hr_notes?: string | null
          id?: string
          interview_date?: string | null
          job_id?: string
          match_score?: number | null
          next_steps?: string | null
          notification_sent?: boolean | null
          pds_id?: string | null
          rank?: number | null
          ranking_reasoning?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills_score?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          status_history?: Json | null
          updated_at?: string
          withdrawn_at?: string | null
          withdrawn_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "applicant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_pds_id_fkey"
            columns: ["pds_id"]
            isOneToOne: false
            referencedRelation: "applicant_pds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_withdrawn_by_fkey"
            columns: ["withdrawn_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trail: {
        Row: {
          changed_fields: string[] | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          operation: Database["public"]["Enums"]["audit_operation"]
          record_id: string
          table_name: string
          timestamp: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          changed_fields?: string[] | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation: Database["public"]["Enums"]["audit_operation"]
          record_id: string
          table_name: string
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          changed_fields?: string[] | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: Database["public"]["Enums"]["audit_operation"]
          record_id?: string
          table_name?: string
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          created_by: string
          degree_requirement: string
          description: string
          eligibilities: string[]
          employment_type: string | null
          experience: string | null
          id: string
          location: string | null
          max_years_experience: number | null
          min_years_experience: number | null
          remote: boolean | null
          skills: string[]
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          years_of_experience: number
        }
        Insert: {
          created_at?: string
          created_by: string
          degree_requirement: string
          description: string
          eligibilities?: string[]
          employment_type?: string | null
          experience?: string | null
          id?: string
          location?: string | null
          max_years_experience?: number | null
          min_years_experience?: number | null
          remote?: boolean | null
          skills?: string[]
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
          years_of_experience?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          degree_requirement?: string
          description?: string
          eligibilities?: string[]
          employment_type?: string | null
          experience?: string | null
          id?: string
          location?: string | null
          max_years_experience?: number | null
          min_years_experience?: number | null
          remote?: boolean | null
          skills?: string[]
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          years_of_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link_url: string | null
          message: string
          read_at: string | null
          related_entity_id: string | null
          related_entity_type:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          last_login_at: string | null
          phone: string | null
          profile_image_url: string | null
          remember_token: string | null
          role: Database["public"]["Enums"]["user_role"]
          signature_url: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          last_login_at?: string | null
          phone?: string | null
          profile_image_url?: string | null
          remember_token?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signature_url?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_login_at?: string | null
          phone?: string | null
          profile_image_url?: string | null
          remember_token?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signature_url?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      training_applications: {
        Row: {
          address: string
          applicant_id: string
          assessment_score: number | null
          attendance_marked_at: string | null
          attendance_percentage: number | null
          certificate_issued_at: string | null
          certificate_url: string | null
          completion_notes: string | null
          completion_status:
            | Database["public"]["Enums"]["completion_status"]
            | null
          created_at: string
          denial_reason: string | null
          email: string
          enrollment_confirmed_at: string | null
          full_name: string
          highest_education: string
          id: string
          id_image_name: string
          id_image_url: string
          next_steps: string | null
          notification_sent: boolean | null
          peso_notes: string | null
          phone: string
          program_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
          status_history: Json | null
          submitted_at: string
          training_completed_at: string | null
          training_hours_awarded: number | null
          training_started_at: string | null
          updated_at: string
        }
        Insert: {
          address: string
          applicant_id: string
          assessment_score?: number | null
          attendance_marked_at?: string | null
          attendance_percentage?: number | null
          certificate_issued_at?: string | null
          certificate_url?: string | null
          completion_notes?: string | null
          completion_status?:
            | Database["public"]["Enums"]["completion_status"]
            | null
          created_at?: string
          denial_reason?: string | null
          email: string
          enrollment_confirmed_at?: string | null
          full_name: string
          highest_education: string
          id?: string
          id_image_name: string
          id_image_url: string
          next_steps?: string | null
          notification_sent?: boolean | null
          peso_notes?: string | null
          phone: string
          program_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          status_history?: Json | null
          submitted_at?: string
          training_completed_at?: string | null
          training_hours_awarded?: number | null
          training_started_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          applicant_id?: string
          assessment_score?: number | null
          attendance_marked_at?: string | null
          attendance_percentage?: number | null
          certificate_issued_at?: string | null
          certificate_url?: string | null
          completion_notes?: string | null
          completion_status?:
            | Database["public"]["Enums"]["completion_status"]
            | null
          created_at?: string
          denial_reason?: string | null
          email?: string
          enrollment_confirmed_at?: string | null
          full_name?: string
          highest_education?: string
          id?: string
          id_image_name?: string
          id_image_url?: string
          next_steps?: string | null
          notification_sent?: boolean | null
          peso_notes?: string | null
          phone?: string
          program_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          status_history?: Json | null
          submitted_at?: string
          training_completed_at?: string | null
          training_hours_awarded?: number | null
          training_started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "v_training_enrollment_check"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          capacity: number
          created_at: string
          created_by: string
          description: string
          duration: string
          end_date: string | null
          enrolled_count: number
          icon: string | null
          id: string
          location: string | null
          schedule: string | null
          skills_covered: string[] | null
          start_date: string
          status: Database["public"]["Enums"]["training_program_status"]
          title: string
          updated_at: string
        }
        Insert: {
          capacity: number
          created_at?: string
          created_by: string
          description: string
          duration: string
          end_date?: string | null
          enrolled_count?: number
          icon?: string | null
          id?: string
          location?: string | null
          schedule?: string | null
          skills_covered?: string[] | null
          start_date: string
          status?: Database["public"]["Enums"]["training_program_status"]
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          created_by?: string
          description?: string
          duration?: string
          end_date?: string | null
          enrolled_count?: number
          icon?: string | null
          id?: string
          location?: string | null
          schedule?: string | null
          skills_covered?: string[] | null
          start_date?: string
          status?: Database["public"]["Enums"]["training_program_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs_backup: {
        Row: {
          capacity: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration: string | null
          end_date: string | null
          enrolled_count: number | null
          icon: string | null
          id: string | null
          location: string | null
          schedule: string | null
          skills_covered: string[] | null
          start_date: string | null
          status: Database["public"]["Enums"]["training_program_status"] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: string | null
          end_date?: string | null
          enrolled_count?: number | null
          icon?: string | null
          id?: string | null
          location?: string | null
          schedule?: string | null
          skills_covered?: string[] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["training_program_status"] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: string | null
          end_date?: string | null
          enrolled_count?: number | null
          icon?: string | null
          id?: string | null
          location?: string | null
          schedule?: string | null
          skills_covered?: string[] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["training_program_status"] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      mv_audit_summary_by_table: {
        Row: {
          audit_date: string | null
          operation: Database["public"]["Enums"]["audit_operation"] | null
          operation_count: number | null
          table_name: string | null
          unique_records: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      mv_daily_activity_summary: {
        Row: {
          activity_count: number | null
          activity_date: string | null
          event_category: Database["public"]["Enums"]["event_category"] | null
          status: Database["public"]["Enums"]["event_status"] | null
          unique_users: number | null
          user_role: string | null
        }
        Relationships: []
      }
      mv_recent_activities: {
        Row: {
          details: string | null
          event_category: Database["public"]["Enums"]["event_category"] | null
          event_type: string | null
          id: string | null
          minutes_ago: number | null
          status: Database["public"]["Enums"]["event_status"] | null
          timestamp: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_top_active_users: {
        Row: {
          action_count: number | null
          application_actions: number | null
          distinct_event_types: number | null
          last_seen_at: string | null
          training_actions: number | null
          user_email: string | null
          user_id: string | null
          user_mgmt_actions: number | null
          user_role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_user_activity_counts: {
        Row: {
          activities_24h: number | null
          activities_30d: number | null
          activities_7d: number | null
          failed_activities: number | null
          last_activity_at: string | null
          successful_activities: number | null
          total_activities: number | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_admin_actions: {
        Row: {
          details: string | null
          event_category: Database["public"]["Enums"]["event_category"] | null
          event_type: string | null
          id: string | null
          metadata: Json | null
          status: Database["public"]["Enums"]["event_status"] | null
          timestamp: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          details?: string | null
          event_category?: Database["public"]["Enums"]["event_category"] | null
          event_type?: string | null
          id?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["event_status"] | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          details?: string | null
          event_category?: Database["public"]["Enums"]["event_category"] | null
          event_type?: string | null
          id?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["event_status"] | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_application_decisions: {
        Row: {
          details: string | null
          event_type: string | null
          id: string | null
          metadata: Json | null
          timestamp: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          details?: string | null
          event_type?: string | null
          id?: string | null
          metadata?: Json | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          details?: string | null
          event_type?: string | null
          id?: string | null
          metadata?: Json | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_critical_changes: {
        Row: {
          changed_fields: string[] | null
          id: string | null
          new_values: Json | null
          old_values: Json | null
          operation: Database["public"]["Enums"]["audit_operation"] | null
          record_id: string | null
          table_name: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          changed_fields?: string[] | null
          id?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: Database["public"]["Enums"]["audit_operation"] | null
          record_id?: string | null
          table_name?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          changed_fields?: string[] | null
          id?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: Database["public"]["Enums"]["audit_operation"] | null
          record_id?: string | null
          table_name?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_failed_operations: {
        Row: {
          details: string | null
          event_category: Database["public"]["Enums"]["event_category"] | null
          event_type: string | null
          id: string | null
          metadata: Json | null
          timestamp: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          details?: string | null
          event_category?: Database["public"]["Enums"]["event_category"] | null
          event_type?: string | null
          id?: string | null
          metadata?: Json | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          details?: string | null
          event_category?: Database["public"]["Enums"]["event_category"] | null
          event_type?: string | null
          id?: string | null
          metadata?: Json | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_mv_audit_summary_by_table: {
        Row: {
          audit_date: string | null
          operation: Database["public"]["Enums"]["audit_operation"] | null
          operation_count: number | null
          table_name: string | null
          unique_records: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      v_mv_daily_activity_summary: {
        Row: {
          activity_count: number | null
          activity_date: string | null
          event_category: Database["public"]["Enums"]["event_category"] | null
          status: Database["public"]["Enums"]["event_status"] | null
          unique_users: number | null
          user_role: string | null
        }
        Relationships: []
      }
      v_mv_recent_activities: {
        Row: {
          details: string | null
          event_category: Database["public"]["Enums"]["event_category"] | null
          event_type: string | null
          id: string | null
          minutes_ago: number | null
          status: Database["public"]["Enums"]["event_status"] | null
          timestamp: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_mv_top_active_users: {
        Row: {
          action_count: number | null
          application_actions: number | null
          distinct_event_types: number | null
          last_seen_at: string | null
          training_actions: number | null
          user_email: string | null
          user_id: string | null
          user_mgmt_actions: number | null
          user_role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_mv_user_activity_counts: {
        Row: {
          activities_24h: number | null
          activities_30d: number | null
          activities_7d: number | null
          failed_activities: number | null
          last_activity_at: string | null
          successful_activities: number | null
          total_activities: number | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_recent_activities: {
        Row: {
          details: string | null
          event_category: Database["public"]["Enums"]["event_category"] | null
          event_type: string | null
          id: string | null
          metadata: Json | null
          status: Database["public"]["Enums"]["event_status"] | null
          timestamp: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          details?: string | null
          event_category?: Database["public"]["Enums"]["event_category"] | null
          event_type?: string | null
          id?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["event_status"] | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          details?: string | null
          event_category?: Database["public"]["Enums"]["event_category"] | null
          event_type?: string | null
          id?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["event_status"] | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_training_enrollment_check: {
        Row: {
          actual_count: number | null
          discrepancy: number | null
          id: string | null
          recorded_count: number | null
          title: string | null
        }
        Relationships: []
      }
      v_user_management_history: {
        Row: {
          details: string | null
          event_type: string | null
          id: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          timestamp: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          details?: string | null
          event_type?: string | null
          id?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          details?: string | null
          event_type?: string | null
          id?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_application: {
        Args: { p_application_id: string; p_reviewer_id: string }
        Returns: boolean
      }
      archive_old_logs: {
        Args: {
          p_activity_logs_days?: number
          p_audit_trail_days?: number
          p_dry_run?: boolean
        }
        Returns: {
          action_taken: string
          log_type: string
          oldest_kept: string
          records_affected: number
        }[]
      }
      bulk_update_user_status: {
        Args: {
          p_admin_id: string
          p_new_status: Database["public"]["Enums"]["user_status"]
          p_reason?: string
          p_user_ids: string[]
        }
        Returns: number
      }
      can_apply_to_job: {
        Args: { p_job_id: string; p_user_id: string }
        Returns: boolean
      }
      can_delete_profile: {
        Args: { p_deleter_id: string; p_target_user_id: string }
        Returns: boolean
      }
      can_modify_profile_role: {
        Args: {
          p_modifier_id: string
          p_new_role: Database["public"]["Enums"]["user_role"]
          p_target_user_id: string
        }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_link_url?: string
          p_message: string
          p_related_entity_id?: string
          p_related_entity_type?: Database["public"]["Enums"]["related_entity_type"]
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      deny_application: {
        Args: {
          p_application_id: string
          p_reason?: string
          p_reviewer_id: string
        }
        Returns: boolean
      }
      export_audit_logs_json: {
        Args: {
          p_date_from: string
          p_date_to: string
          p_table_names?: string[]
        }
        Returns: Json
      }
      get_active_enrollment_count: {
        Args: { p_program_id: string }
        Returns: number
      }
      get_activity_heatmap: {
        Args: { p_days?: number; p_user_id?: string }
        Returns: {
          activity_count: number
          day_of_week: string
          hour_of_day: number
        }[]
      }
      get_activity_logs_filtered: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_event_category?: Database["public"]["Enums"]["event_category"]
          p_event_type?: string
          p_limit?: number
          p_offset?: number
          p_order_by?: string
          p_search_term?: string
          p_status?: Database["public"]["Enums"]["event_status"]
          p_user_id?: string
        }
        Returns: {
          activity_timestamp: string
          details: string
          event_category: string
          event_type: string
          id: string
          ip_address: string
          metadata: Json
          status: string
          total_count: number
          user_agent: string
          user_email: string
          user_id: string
          user_role: string
        }[]
      }
      get_activity_summary: {
        Args: { p_days?: number; p_user_id?: string }
        Returns: {
          activities_by_category: Json
          activities_by_role: Json
          activities_by_type: Json
          failed_count: number
          hourly_pattern: Json
          recent_failures: Json
          success_count: number
          success_rate: number
          total_activities: number
        }[]
      }
      get_admin_dashboard_stats: { Args: { p_days?: number }; Returns: Json }
      get_applicant_dashboard_stats: {
        Args: { p_user_id: string }
        Returns: {
          approved_applications: number
          approved_training: number
          denied_applications: number
          has_profile: boolean
          pending_applications: number
          pending_training: number
          profile_completeness: number
          total_applications: number
          training_applications: number
        }[]
      }
      get_application_statistics: {
        Args: never
        Returns: {
          active_jobs: number
          approved_applications: number
          denied_applications: number
          pending_applications: number
          total_applicants: number
          total_applications: number
        }[]
      }
      get_audit_dashboard_stats: {
        Args: { p_days?: number }
        Returns: {
          application_table_changes: number
          changes_30d: number
          changes_7d: number
          changes_today: number
          delete_operations: number
          insert_operations: number
          most_modified_tables: Json
          system_table_changes: number
          top_active_users: Json
          total_operations: number
          training_table_changes: number
          update_operations: number
          user_table_changes: number
        }[]
      }
      get_audit_trail_filtered: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_limit?: number
          p_offset?: number
          p_operation?: Database["public"]["Enums"]["audit_operation"]
          p_order_by?: string
          p_record_id?: string
          p_search_term?: string
          p_table_name?: string
          p_user_id?: string
        }
        Returns: {
          audit_timestamp: string
          changed_fields: string[]
          id: string
          ip_address: string
          new_values: Json
          old_values: Json
          operation: string
          record_id: string
          table_name: string
          total_count: number
          user_agent: string
          user_email: string
          user_id: string
          user_role: string
        }[]
      }
      get_available_training_slots: {
        Args: { p_program_id: string }
        Returns: number
      }
      get_completion_summary: {
        Args: { p_program_id: string }
        Returns: {
          avg_hours: number
          completion_percentage: number
          failed: number
          passed: number
          pending: number
          total_completed: number
          total_enrolled: number
        }[]
      }
      get_hr_dashboard_stats: {
        Args: { p_user_id?: string }
        Returns: {
          active_jobs: number
          approved_applications: number
          avg_match_score: number
          denied_applications: number
          hidden_jobs: number
          pending_applications: number
          total_applicants: number
          total_applications: number
          total_jobs: number
        }[]
      }
      get_index_usage_stats: {
        Args: { p_schema_name?: string }
        Returns: {
          index_name: string
          index_scans: number
          rows_fetched: number
          rows_read: number
          table_name: string
        }[]
      }
      get_live_activity_feed: {
        Args: { p_event_categories?: string[]; p_limit?: number }
        Returns: {
          activity_timestamp: string
          details: string
          event_category: string
          event_type: string
          id: string
          status: string
          time_ago_text: string
          user_email: string
          user_role: string
        }[]
      }
      get_materialized_view_stats: {
        Args: never
        Returns: {
          row_count: number
          size_bytes: number
          view_name: string
        }[]
      }
      get_peso_dashboard_stats: {
        Args: { p_user_id?: string }
        Returns: {
          active_programs: number
          approved_applications: number
          completed_programs: number
          denied_applications: number
          pending_applications: number
          total_applications: number
          total_capacity: number
          total_enrolled: number
          total_programs: number
          upcoming_programs: number
        }[]
      }
      get_program_stats: {
        Args: { p_program_id: string }
        Returns: {
          attendance_rate: number
          avg_assessment_score: number
          avg_hours_awarded: number
          completed_count: number
          completion_rate: number
          enrolled_count: number
          failed_count: number
          in_progress_count: number
          passed_count: number
          total_applications: number
        }[]
      }
      get_storage_statistics: {
        Args: never
        Returns: {
          bucket_name: string
          total_files: number
          total_size_bytes: number
          total_size_readable: string
        }[]
      }
      get_suspicious_activities: {
        Args: { p_days?: number; p_limit?: number }
        Returns: {
          details: string
          event_type: string
          failure_count: number
          id: string
          log_timestamp: string
          metadata: Json
          user_email: string
          user_role: string
        }[]
      }
      get_training_statistics: {
        Args: never
        Returns: {
          active_programs: number
          approved_applications: number
          filled_slots: number
          pending_applications: number
          total_applications: number
          total_programs: number
          total_slots: number
        }[]
      }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_unread_notification_summary: {
        Args: { p_user_id: string }
        Returns: {
          by_type: Json
          most_recent: Json
          total_unread: number
        }[]
      }
      get_user_activity_timeline: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          activity_status: string
          activity_timestamp: string
          details: string
          event_category: string
          event_type: string
          metadata: Json
        }[]
      }
      get_user_full_history: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          details: string
          event_type: string
          log_timestamp: string
          metadata: Json
          source: string
        }[]
      }
      get_user_impact_analysis: {
        Args: { p_user_id: string }
        Returns: {
          description: string
          metric_name: string
          metric_value: number
        }[]
      }
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          can_approve_applications: boolean
          can_approve_training_applications: boolean
          can_manage_jobs: boolean
          can_manage_training: boolean
          can_manage_users: boolean
          can_view_activity_logs: boolean
          can_view_audit_logs: boolean
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role:
        | { Args: { required_role: string; user_id: string }; Returns: boolean }
        | {
            Args: {
              check_role: Database["public"]["Enums"]["user_role"]
              user_id: string
            }
            Returns: boolean
          }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_content_creator: {
        Args: { p_content_id: string; p_table_name: string; p_user_id: string }
        Returns: boolean
      }
      log_activity:
        | {
            Args: {
              p_details: string
              p_event_category: string
              p_event_type: string
              p_metadata?: Json
              p_status?: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_details: string
              p_event_category: Database["public"]["Enums"]["event_category"]
              p_event_type: string
              p_metadata?: Json
              p_status?: Database["public"]["Enums"]["event_status"]
              p_user_id: string
            }
            Returns: string
          }
      log_admin_activate_user: {
        Args: {
          p_admin_id: string
          p_metadata?: Json
          p_reason?: string
          p_target_user_id: string
        }
        Returns: string
      }
      log_admin_change_role: {
        Args: {
          p_admin_id: string
          p_metadata?: Json
          p_new_role: Database["public"]["Enums"]["user_role"]
          p_old_role: Database["public"]["Enums"]["user_role"]
          p_reason?: string
          p_target_user_id: string
        }
        Returns: string
      }
      log_admin_create_user: {
        Args: {
          p_admin_id: string
          p_created_user_email: string
          p_created_user_id: string
          p_created_user_role: Database["public"]["Enums"]["user_role"]
          p_metadata?: Json
        }
        Returns: string
      }
      log_admin_deactivate_user: {
        Args: {
          p_admin_id: string
          p_metadata?: Json
          p_reason?: string
          p_target_user_id: string
        }
        Returns: string
      }
      log_admin_delete_user: {
        Args: {
          p_admin_id: string
          p_deletion_type: string
          p_metadata?: Json
          p_reason?: string
          p_target_user_id: string
        }
        Returns: string
      }
      log_ai_ranking: {
        Args: {
          p_algorithm_used: string
          p_application_id: string
          p_match_score: number
          p_metadata?: Json
          p_rank: number
        }
        Returns: string
      }
      log_announcement_created: {
        Args: {
          p_announcement_id: string
          p_announcement_title: string
          p_category: string
          p_hr_id: string
          p_metadata?: Json
        }
        Returns: string
      }
      log_announcement_status_changed: {
        Args: {
          p_announcement_id: string
          p_metadata?: Json
          p_new_status: string
          p_old_status: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_announcement_updated: {
        Args: {
          p_announcement_id: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: undefined
      }
      log_application_approved: {
        Args: {
          p_application_id: string
          p_hr_id: string
          p_metadata?: Json
          p_rank: number
          p_score: number
        }
        Returns: string
      }
      log_application_denied: {
        Args: {
          p_application_id: string
          p_hr_id: string
          p_metadata?: Json
          p_reason?: string
        }
        Returns: string
      }
      log_application_submitted: {
        Args: {
          p_applicant_id: string
          p_application_id: string
          p_job_id: string
          p_metadata?: Json
          p_pds_file_name: string
        }
        Returns: string
      }
      log_bulk_operation: {
        Args: {
          p_admin_id: string
          p_affected_count: number
          p_metadata?: Json
          p_operation_details: Json
          p_operation_type: string
        }
        Returns: string
      }
      log_email_notification_sent: {
        Args: {
          p_metadata?: Json
          p_notification_title: string
          p_notification_type: string
          p_success: boolean
          p_user_id: string
        }
        Returns: string
      }
      log_file_deletion: {
        Args: {
          p_bucket_name: string
          p_file_path: string
          p_metadata?: Json
          p_reason?: string
          p_user_id: string
        }
        Returns: string
      }
      log_file_upload: {
        Args: {
          p_bucket_name: string
          p_file_path: string
          p_file_size: number
          p_file_type: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: string
      }
      log_job_created: {
        Args: {
          p_hr_id: string
          p_job_id: string
          p_job_title: string
          p_metadata?: Json
        }
        Returns: string
      }
      log_job_deleted: {
        Args: {
          p_hr_id: string
          p_job_id: string
          p_metadata?: Json
          p_reason?: string
        }
        Returns: string
      }
      log_job_status_changed: {
        Args: {
          p_hr_id: string
          p_job_id: string
          p_metadata?: Json
          p_new_status: string
          p_old_status: string
        }
        Returns: string
      }
      log_job_updated: {
        Args: {
          p_changes_made: string
          p_hr_id: string
          p_job_id: string
          p_metadata?: Json
        }
        Returns: string
      }
      log_ocr_processing: {
        Args: {
          p_applicant_id: string
          p_confidence_score?: number
          p_metadata?: Json
          p_pds_file_name: string
          p_success: boolean
        }
        Returns: string
      }
      log_training_application_approved: {
        Args: {
          p_metadata?: Json
          p_peso_id: string
          p_training_application_id: string
        }
        Returns: string
      }
      log_training_application_denied: {
        Args: {
          p_metadata?: Json
          p_peso_id: string
          p_reason?: string
          p_training_application_id: string
        }
        Returns: string
      }
      log_training_application_status_changed: {
        Args: {
          p_application_id: string
          p_metadata?: Json
          p_new_status: string
          p_old_status: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_training_application_submitted: {
        Args: {
          p_applicant_id: string
          p_application_id: string
          p_metadata?: Json
          p_program_id: string
        }
        Returns: undefined
      }
      log_training_created: {
        Args: {
          p_metadata?: Json
          p_peso_id: string
          p_program_id: string
          p_program_title: string
        }
        Returns: string
      }
      log_training_deleted: {
        Args: {
          p_metadata?: Json
          p_peso_id: string
          p_program_id: string
          p_reason?: string
        }
        Returns: string
      }
      log_training_program_created: {
        Args: {
          p_metadata?: Json
          p_peso_id: string
          p_program_id: string
          p_program_title: string
        }
        Returns: undefined
      }
      log_training_program_deleted: {
        Args: { p_metadata?: Json; p_program_id: string; p_user_id: string }
        Returns: undefined
      }
      log_training_program_updated: {
        Args: { p_metadata?: Json; p_program_id: string; p_user_id: string }
        Returns: undefined
      }
      log_training_updated: {
        Args: {
          p_changes_made: string
          p_metadata?: Json
          p_peso_id: string
          p_program_id: string
        }
        Returns: string
      }
      mark_all_notifications_read: {
        Args: { p_user_id: string }
        Returns: number
      }
      refresh_all_materialized_views: { Args: never; Returns: undefined }
      refresh_materialized_view: {
        Args: { p_view_name: string }
        Returns: boolean
      }
      search_audit_logs: {
        Args: { p_limit?: number; p_search_term: string }
        Returns: {
          audit_timestamp: string
          id: string
          match_context: string
          operation: string
          record_id: string
          relevance_score: number
          table_name: string
          user_email: string
          user_role: string
        }[]
      }
      soft_delete_profile: { Args: { p_user_id: string }; Returns: boolean }
      update_user_last_login: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      validate_job_application: {
        Args: { p_applicant_id: string; p_job_id: string }
        Returns: {
          can_apply: boolean
          reason: string
        }[]
      }
      validate_training_application: {
        Args: { p_applicant_id: string; p_program_id: string }
        Returns: {
          can_apply: boolean
          reason: string
        }[]
      }
    }
    Enums: {
      announcement_category: "job_opening" | "training" | "notice" | "general"
      announcement_status: "active" | "archived"
      application_status:
        | "pending"
        | "approved"
        | "denied"
        | "under_review"
        | "shortlisted"
        | "interviewed"
        | "hired"
        | "archived"
        | "withdrawn"
        | "enrolled"
        | "in_progress"
        | "completed"
        | "certified"
        | "failed"
      audit_operation: "INSERT" | "UPDATE" | "DELETE"
      completion_status: "passed" | "failed" | "pending"
      event_category:
        | "auth"
        | "user_management"
        | "application"
        | "job"
        | "training"
        | "system"
      event_status: "success" | "failed"
      job_status: "active" | "hidden" | "archived"
      notification_type:
        | "application_status"
        | "training_status"
        | "announcement"
        | "system"
      related_entity_type:
        | "application"
        | "training_application"
        | "announcement"
        | "job"
      training_program_status:
        | "active"
        | "upcoming"
        | "completed"
        | "cancelled"
        | "archived"
        | "scheduled"
        | "ongoing"
      user_role: "ADMIN" | "HR" | "PESO" | "APPLICANT"
      user_status: "active" | "inactive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      announcement_category: ["job_opening", "training", "notice", "general"],
      announcement_status: ["active", "archived"],
      application_status: [
        "pending",
        "approved",
        "denied",
        "under_review",
        "shortlisted",
        "interviewed",
        "hired",
        "archived",
        "withdrawn",
        "enrolled",
        "in_progress",
        "completed",
        "certified",
        "failed",
      ],
      audit_operation: ["INSERT", "UPDATE", "DELETE"],
      completion_status: ["passed", "failed", "pending"],
      event_category: [
        "auth",
        "user_management",
        "application",
        "job",
        "training",
        "system",
      ],
      event_status: ["success", "failed"],
      job_status: ["active", "hidden", "archived"],
      notification_type: [
        "application_status",
        "training_status",
        "announcement",
        "system",
      ],
      related_entity_type: [
        "application",
        "training_application",
        "announcement",
        "job",
      ],
      training_program_status: [
        "active",
        "upcoming",
        "completed",
        "cancelled",
        "archived",
        "scheduled",
        "ongoing",
      ],
      user_role: ["ADMIN", "HR", "PESO", "APPLICANT"],
      user_status: ["active", "inactive"],
    },
  },
} as const
