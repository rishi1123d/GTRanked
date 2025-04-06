const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Get environment variables with fallbacks for development
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://your-supabase-url.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

// Log initialization for debugging
console.log(
  `Supabase JS client initialized with URL: ${supabaseUrl.substring(0, 20)}...`
);

// Export the client
module.exports = { supabase };
