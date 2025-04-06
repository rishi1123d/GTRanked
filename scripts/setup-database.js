const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Environment variables loaded. Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Supabase URL or anon key not found in environment variables.');
  console.error('Make sure you have a .env.local file with these variables set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * This script sets up the database tables required for GTRanked application.
 * It's designed to be idempotent - you can run it multiple times without error.
 */
async function setupDatabase() {
  console.log('Setting up database schema...');

  try {
    // Create profiles table
    await supabase.rpc('exec_sql', { 
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id SERIAL PRIMARY KEY,
          aviato_id TEXT UNIQUE,
          full_name TEXT NOT NULL,
          headline TEXT,
          title TEXT,
          company TEXT,
          major TEXT,
          graduation_year INTEGER,
          is_student BOOLEAN DEFAULT FALSE,
          location TEXT,
          country TEXT,
          region TEXT,
          locality TEXT,
          elo_rating INTEGER DEFAULT 1500,
          avatar_url TEXT,
          linkedin_url TEXT,
          twitter_url TEXT,
          github_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    console.log('Profiles table created.');

    // Create education table
    await supabase.rpc('exec_sql', { 
      sql: `
        CREATE TABLE IF NOT EXISTS education (
          id SERIAL PRIMARY KEY,
          profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
          school_id TEXT,
          school_name TEXT NOT NULL,
          degree TEXT,
          field_of_study TEXT,
          start_date DATE,
          end_date DATE
        );
      `
    });
    console.log('Education table created.');

    // Create work experience table
    await supabase.rpc('exec_sql', { 
      sql: `
        CREATE TABLE IF NOT EXISTS work_experience (
          id SERIAL PRIMARY KEY,
          profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
          company_id TEXT,
          company_name TEXT NOT NULL,
          title TEXT,
          start_date DATE,
          end_date DATE,
          is_current BOOLEAN DEFAULT FALSE
        );
      `
    });
    console.log('Work experience table created.');

    // Create votes table
    await supabase.rpc('exec_sql', { 
      sql: `
        CREATE TABLE IF NOT EXISTS votes (
          id SERIAL PRIMARY KEY,
          winner_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
          left_profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
          right_profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          voter_ip TEXT,
          voter_session_id TEXT
        );
      `
    });
    console.log('Votes table created.');

    // Create function for updating ELO ratings
    // Note: This might fail in the RPC call but can be manually set up in the Supabase dashboard
    try {
      await supabase.rpc('exec_sql', { 
        sql: `
          CREATE OR REPLACE FUNCTION update_elo_ratings() RETURNS TRIGGER AS $$
          DECLARE
            k_factor INTEGER := 32; -- The K-factor determines how much ratings change
            expected_winner FLOAT;
            expected_loser FLOAT;
            winner_rating INTEGER;
            loser_rating INTEGER;
            winner_new_rating INTEGER;
            loser_new_rating INTEGER;
            loser_id INTEGER;
          BEGIN
            -- Only update ratings if there's a winner (not a tie)
            IF NEW.winner_id IS NOT NULL THEN
              -- Determine loser_id
              IF NEW.winner_id = NEW.left_profile_id THEN
                loser_id := NEW.right_profile_id;
              ELSE
                loser_id := NEW.left_profile_id;
              END IF;
              
              -- Get current ratings
              SELECT elo_rating INTO winner_rating FROM profiles WHERE id = NEW.winner_id;
              SELECT elo_rating INTO loser_rating FROM profiles WHERE id = loser_id;
              
              -- Calculate expected scores
              expected_winner := 1.0 / (1.0 + POWER(10.0, (loser_rating - winner_rating) / 400.0));
              expected_loser := 1.0 / (1.0 + POWER(10.0, (winner_rating - loser_rating) / 400.0));
              
              -- Calculate new ratings
              winner_new_rating := winner_rating + k_factor * (1 - expected_winner);
              loser_new_rating := loser_rating + k_factor * (0 - expected_loser);
              
              -- Update ratings
              UPDATE profiles SET elo_rating = winner_new_rating WHERE id = NEW.winner_id;
              UPDATE profiles SET elo_rating = loser_new_rating WHERE id = loser_id;
            END IF;
            
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `
      });
      console.log('ELO update function created.');
    } catch (error) {
      console.warn('Warning: Could not create the ELO update function. This can be set up manually in the Supabase dashboard.');
    }

    // Create trigger for ELO updates
    try {
      await supabase.rpc('exec_sql', { 
        sql: `
          DROP TRIGGER IF EXISTS update_elo_after_vote ON votes;
          CREATE TRIGGER update_elo_after_vote
          AFTER INSERT ON votes
          FOR EACH ROW
          EXECUTE FUNCTION update_elo_ratings();
        `
      });
      console.log('ELO update trigger created.');
    } catch (error) {
      console.warn('Warning: Could not create the ELO update trigger. This can be set up manually in the Supabase dashboard.');
    }

    console.log('Database setup completed successfully!');
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
}

// Run the function if this file is executed directly
setupDatabase().then(success => {
  if (success) {
    console.log('Database setup process completed successfully!');
  } else {
    console.error('Database setup process failed.');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unexpected error during database setup:', error);
  process.exit(1);
});
