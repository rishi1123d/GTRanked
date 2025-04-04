import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
}

// Create a single supabase client for the browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database schema
export type Profile = {
  id: string;
  email?: string;
  name: string;
  title: string;
  company: string;
  major: string;
  graduationYear: number;
  isStudent: boolean;
  elo: number;
  aviato_id?: string;
  linkedin_url?: string;
  created_at: string;
  updated_at: string;
};

export type Vote = {
  id: string;
  winner_id: string | null; // null means tie
  loser_id: string | null;
  created_at: string;
  user_id?: string; // Optional, only if the user is signed in
};
