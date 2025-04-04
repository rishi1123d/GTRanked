-- Profiles table
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

-- Education table
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

-- Work experience table
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

-- Voting history table
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  winner_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  left_profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  right_profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  voter_ip TEXT,
  voter_session_id TEXT
);

-- This function updates ELO ratings after each vote
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

-- Create trigger to update ELO ratings after vote
DROP TRIGGER IF EXISTS update_elo_after_vote ON votes;
CREATE TRIGGER update_elo_after_vote
AFTER INSERT ON votes
FOR EACH ROW
EXECUTE FUNCTION update_elo_ratings();
