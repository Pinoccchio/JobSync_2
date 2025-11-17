/**
 * Type Definitions Index
 *
 * Central export for all type definitions
 * Import types like: import { User, Job, Application } from '@/types';
 */

export * from './database.types';
export * from './supabase';

// Re-export Supabase types that might be needed
export type { Session, User as SupabaseUser } from '@supabase/supabase-js';
