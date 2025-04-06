const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Environment variables loaded:');
console.log('- Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Found' : '✗ Missing');
console.log('- Aviato API Key:', process.env.AVIATO_API_KEY ? '✓ Found' : '✗ Missing');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Supabase URL or anon key not found in environment variables.');
  console.error('Make sure you have a .env.local file with these variables set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Aviato API configuration
const AVIATO_API_KEY = process.env.AVIATO_API_KEY;
const AVIATO_API_BASE_URL = 'https://data.api.aviato.co';

// Aviato API client
const aviato = {
  async search(query) {
    if (!AVIATO_API_KEY) {
      throw new Error('AVIATO_API_KEY not found in environment variables');
    }
    
    // Make sure we're passing the query object directly, not as a nested string
    const requestBody = { dsl: query };
    
    console.log('Making API request to Aviato...');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Use AbortController for request timeout management
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000); // 30 second timeout
    
    try {
      const response = await fetch(`${AVIATO_API_BASE_URL}/person/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AVIATO_API_KEY}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Aviato API error: ${response.status} ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('Aviato API request timed out after 30 seconds');
      }
      throw error;
    }
  }
};

// Extract URLs from social links
function extractUrls(urls) {
  if (!urls) return { linkedinUrl: null, twitterUrl: null, githubUrl: null };
  
  let linkedinUrl = null;
  let twitterUrl = null;
  let githubUrl = null;
  
  if (urls.linkedin && typeof urls.linkedin === 'string') {
    // Handle case where LinkedIn URL is directly a string
    linkedinUrl = urls.linkedin.startsWith('http') ? urls.linkedin : `https://${urls.linkedin}`;
  } else if (urls.linkedin && Array.isArray(urls.linkedin) && urls.linkedin.length > 0) {
    // Handle case where LinkedIn URL is in an array
    linkedinUrl = urls.linkedin[0].startsWith('http') ? urls.linkedin[0] : `https://${urls.linkedin[0]}`;
  }
  
  if (urls.twitter && typeof urls.twitter === 'string') {
    twitterUrl = urls.twitter.startsWith('http') ? urls.twitter : `https://${urls.twitter}`;
  } else if (urls.twitter && Array.isArray(urls.twitter) && urls.twitter.length > 0) {
    twitterUrl = urls.twitter[0].startsWith('http') ? urls.twitter[0] : `https://${urls.twitter[0]}`;
  }
  
  if (urls.github && typeof urls.github === 'string') {
    githubUrl = urls.github.startsWith('http') ? urls.github : `https://${urls.github}`;
  } else if (urls.github && Array.isArray(urls.github) && urls.github.length > 0) {
    githubUrl = urls.github[0].startsWith('http') ? urls.github[0] : `https://${urls.github[0]}`;
  }
  
  console.log('Extracted URLs:', { linkedinUrl, twitterUrl, githubUrl });
  
  return { linkedinUrl, twitterUrl, githubUrl };
}

// Insert profile into Supabase with available data
const insertProfile = async (profileData) => {
  try {
    console.log('Attempting to insert profile into Supabase...');
    
    // First check if profile already exists to avoid duplicate errors
    const { data: existingProfiles, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('aviato_id', profileData.aviato_id);
    
    if (checkError) {
      console.error('Error checking for existing profile:', JSON.stringify(checkError, null, 2));
      return { success: false, error: checkError };
    }
    
    if (existingProfiles && existingProfiles.length > 0) {
      console.log(`Profile with aviato_id ${profileData.aviato_id} already exists, updating...`);
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('aviato_id', profileData.aviato_id)
        .select('id');
      
      if (updateError) {
        console.error('Error updating profile:', JSON.stringify(updateError, null, 2));
        return { success: false, error: updateError };
      }
      
      return { success: true, profileId: updatedProfile[0].id };
    } else {
      console.log(`Profile with aviato_id ${profileData.aviato_id} is new, inserting...`);
      const { data: insertedProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select('id');
      
      if (insertError) {
        console.error('Error inserting profile:', JSON.stringify(insertError, null, 2));
        
        // Try logging the raw error object
        console.error('Raw error object:', insertError);
        
        // If the error has a message property, log it
        if (insertError.message) {
          console.error('Error message:', insertError.message);
        }
        
        // If the error has details, log them
        if (insertError.details) {
          console.error('Error details:', insertError.details);
        }
        
        return { success: false, error: insertError };
      }
      
      return { success: true, profileId: insertedProfile[0].id };
    }
  } catch (error) {
    console.error('Unexpected error during profile insertion:', error);
    return { success: false, error };
  }
};

// Main function to fetch profiles and populate Supabase
async function fetchAndStoreGTProfiles(limit = 5) {
  console.log(`Starting to fetch up to ${limit} profiles...`);

  // Try different search terms to find GT profiles
  const searchTerms = ["Georgia Tech", "Georgia Institute of Technology"];
  let allProfiles = [];
  
  for (const term of searchTerms) {
    if (allProfiles.length >= limit) break;
    
    console.log(`Searching for "${term}"...`);
    const query = {
      keywords: term,
      offset: 0,
      limit: limit - allProfiles.length
    };

    try {
      // Fetch profiles from Aviato
      const result = await aviato.search(query);
      
      // Log just the count information to avoid cluttering the logs
      console.log(`API Response count:`, JSON.stringify(result.count, null, 2));
      
      const profiles = result.items || [];
      console.log(`Found ${profiles.length} profiles for term "${term}"`);
      
      allProfiles = [...allProfiles, ...profiles];
    } catch (error) {
      console.error(`Error searching for "${term}":`, error);
    }
  }
  
  console.log(`Total profiles found: ${allProfiles.length}. Processing...`);

  for (const profile of allProfiles) {
    try {
      // Process basic profile data
      const { linkedinUrl, twitterUrl, githubUrl } = extractUrls(profile.URLs);
      
      console.log(`Processing profile: ${profile.fullName}`);
      
      // Parse location data if available
      let country = '';
      let region = '';
      let locality = '';
      
      if (profile.location) {
        const locationParts = profile.location.split(', ');
        if (locationParts.length >= 3) {
          [locality, region, country] = locationParts;
        } else if (locationParts.length === 2) {
          [locality, country] = locationParts;
        } else if (locationParts.length === 1) {
          country = locationParts[0];
        }
      }
      
      // Prepare profile data to insert
      const profileData = {
        aviato_id: profile.id,
        full_name: profile.fullName,
        headline: profile.headline || '',
        location: profile.location || '',
        country: country,
        region: region, 
        locality: locality,
        elo_rating: 1500, // Default ELO rating
        linkedin_url: linkedinUrl,
        twitter_url: twitterUrl,
        github_url: githubUrl,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
      
      console.log('Inserting profile data:', JSON.stringify(profileData, null, 2));
      
      // Insert profile into Supabase with available data
      const result = await insertProfile(profileData);
      
      if (!result.success) {
        console.error(`Error inserting profile ${profile.fullName}:`, result.error);
        continue;
      }

      const profileId = result.profileId;
      if (!profileId) {
        console.error(`Could not get ID for inserted profile ${profile.fullName}`);
        continue;
      }

      console.log(`Inserted profile ${profile.fullName} with ID ${profileId}`);
    } catch (error) {
      console.error(`Error processing profile ${profile.fullName}:`, error);
    }
  }

  console.log(`Successfully processed ${allProfiles.length} profiles!`);
  return allProfiles.length;
}

async function main() {
  console.log('Starting GTRanked data import process...');
  
  // Import profiles from Aviato - using only 5 profiles to save API credits
  try {
    console.log('Importing profiles from Aviato API (limited to 5 profiles)...');
    const count = await fetchAndStoreGTProfiles(5); // Explicitly fetch only 5 profiles
    console.log(`Successfully imported ${count} profiles from Aviato API.`);
  } catch (error) {
    console.error('Error importing profiles from Aviato API:', error);
    process.exit(1);
  }
  
  console.log('Data import process completed successfully!');
  process.exit(0);
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error in import process:', err);
  process.exit(1);
});
