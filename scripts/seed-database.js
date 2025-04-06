const { supabase } = require("../lib/supabase.js");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

// Aviato API configuration
const AVIATO_API_KEY = process.env.AVIATO_API_KEY;
const AVIATO_API_BASE_URL = 'https://data.api.aviato.co';

/**
 * Lightweight seed database script for the new on-demand enrichment strategy
 * This script only imports basic profile information (IDs, names) without full enrichment
 */
async function seedDatabase() {
  console.log("Starting lightweight database seeding with the new on-demand enrichment strategy...");
  console.log(
    `Supabase URL: ${
      process.env.NEXT_PUBLIC_SUPABASE_URL ? "Found" : "Not found"
    }`
  );
  console.log(
    `Supabase Anon Key: ${
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Found" : "Not found"
    }`
  );
  console.log(
    `Aviato API Key: ${
      process.env.AVIATO_API_KEY ? "Found" : "Not found"
    }`
  );

  try {
    // Fetch basic profile data from Aviato API (just IDs and minimal info)
    const profiles = await fetchBasicGTProfiles(100); // Fetch up to 100 profiles
    console.log(`Found ${profiles.length} basic profiles. Inserting into database...`);

    // Insert basic profile data with is_enriched = false
    let successCount = 0;
    for (const profile of profiles) {
      const result = await insertBasicProfile(profile);
      if (result) successCount++;
    }

    console.log(`Successfully inserted ${successCount} profiles into the database.`);
    console.log(`These profiles will be enriched on-demand when viewed by users.`);
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

/**
 * Fetch basic GT profiles from Aviato API (search only, no enrichment)
 * @param {number} limit - Maximum number of profiles to fetch
 * @returns {Array} - Array of basic profile objects
 */
async function fetchBasicGTProfiles(limit = 100) {
  try {
    console.log(`Fetching up to ${limit} Georgia Tech profiles from Aviato...`);
    
    // Complete query with school ID, education dates, and degree type filters
    const query = {
      offset: 0,
      limit: limit,
      sort: [],
      filters: [
        {
          "AND": [
            {
              "degreeList.school.id": {
                "operation": "eq",
                "value": "TSBrRHzvWH9Z" // Georgia Tech School ID
              }
            },
            {
              "educationList.startDate": {
                "operation": "gte",
                "value": "2022-07-01T00:00:00.000Z"
              }
            },
            {
              "educationList.endDate": {
                "operation": "lte",
                "value": "2027-05-01T00:00:00.000Z"
              }
            },
            {
              "degreeList.name": {
                "operation": "eq",
                "value": "Bachelor of Science - BS"
              }
            }
          ]
        }
      ]
    };
    
    // Make API request to search endpoint
    const response = await fetch(`${AVIATO_API_BASE_URL}/person/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AVIATO_API_KEY}`
      },
      body: JSON.stringify({ dsl: query })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Aviato API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    // Debug the API response structure
    console.log("API Response structure:", JSON.stringify(data, null, 2).substring(0, 300) + "...");
    
    // Check the right property for profiles - items vs data
    const profiles = data.items || data.data || [];
    console.log(`API returned ${profiles.length} profiles`);
    
    if (data.count) {
      console.log(`Total estimated matches: ${data.count.value} (isEstimate: ${data.count.isEstimate})`);
    }
    
    return profiles.map(profile => ({
      aviato_id: profile.id,
      full_name: profile.fullName || 'Unknown',
      headline: profile.headline || '',
      location: profile.location ? [profile.location.country, profile.location.region, profile.location.locality].filter(Boolean).join(', ') : '',
      country: profile.location?.country || '',
      region: profile.location?.region || '',
      locality: profile.location?.locality || '',
      is_enriched: false, // Mark as not enriched initially
      elo_rating: 1500, // Default ELO rating
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    }));
  } catch (error) {
    console.error("Error fetching GT profiles:", error);
    return [];
  }
}

/**
 * Insert a basic profile into the database
 * @param {Object} profile - Basic profile object with minimal data
 * @returns {boolean} - Success status
 */
async function insertBasicProfile(profile) {
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, aviato_id, is_enriched')
      .eq('aviato_id', profile.aviato_id)
      .single();
    
    if (existingProfile) {
      console.log(`Profile ${profile.full_name} (${profile.aviato_id}) already exists with ID ${existingProfile.id}`);
      
      // If needed, update the existing profile with is_enriched status
      if (existingProfile.is_enriched === null) {
        await supabase
          .from('profiles')
          .update({ is_enriched: false })
          .eq('id', existingProfile.id);
        console.log(`Updated profile ${existingProfile.id} with is_enriched status`);
      }
      
      return true;
    }
    
    // Insert new profile with is_enriched = false
    const { data, error } = await supabase
      .from('profiles')
      .insert([profile])
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log(`Inserted basic profile for ${profile.full_name} with ID ${data[0].id}`);
    return true;
  } catch (error) {
    console.error(`Error inserting profile ${profile.full_name}:`, error);
    return false;
  }
}

// Run the script
seedDatabase().catch(err => {
  console.error("Unhandled error in seed process:", err);
  process.exit(1);
});
