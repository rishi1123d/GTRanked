const { createClient } = require("@supabase/supabase-js");

// Get environment variables for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create Supabase client
exports.supabase = createClient(supabaseUrl, supabaseAnonKey);
