const { supabase } = require("../lib/supabase.js");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

/**
 * Main function to seed the database with mock data
 */
async function seedDatabase() {
  console.log("Starting database seeding...");
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

  try {
    // Fetch profiles from Aviato API
    const profiles = await fetchGTProfiles(10); // Fetch 10 profiles
    console.log(`Found ${profiles.length} profiles. Processing...`);

    // Process and insert each profile
    for (const profile of profiles) {
      try {
        // Transform raw Aviato profile to match our schema
        const transformedProfile = transformAviatoProfile(profile);
        
        // Insert profile
        const { data: profileData, error: profileError } = await insertProfile(
          transformedProfile
        );

        if (profileError) {
          console.error(
            `Error inserting profile ${transformedProfile.full_name}:`,
            profileError
          );
          continue;
        }

        if (!profileData || profileData.length === 0) {
          console.error(
            `No data returned when inserting profile ${transformedProfile.full_name}`
          );
          continue;
        }

        const profileId = profileData[0].id;
        console.log(
          `Inserted profile: ${transformedProfile.full_name} with ID: ${profileId}`
        );

        // Insert education records
        if (transformedProfile.education && transformedProfile.education.length > 0) {
          for (const edu of transformedProfile.education) {
            const educationRecord = {
              ...edu,
              profile_id: profileId,
            };

            const { error: eduError } = await insertEducation(educationRecord);
            if (eduError) {
              console.error(
                `Error inserting education for ${transformedProfile.full_name}:`,
                eduError
              );
            } else {
              console.log(`Added education record: ${edu.school_name} for ${transformedProfile.full_name}`);
            }
          }
        }

        // Insert work experience records
        if (transformedProfile.experiences && transformedProfile.experiences.length > 0) {
          for (const exp of transformedProfile.experiences) {
            const workRecord = {
              ...exp,
              profile_id: profileId,
            };

            const { error: workError } = await insertWorkExperience(workRecord);
            if (workError) {
              console.error(
                `Error inserting work experience for ${transformedProfile.full_name}:`,
                workError
              );
            } else {
              console.log(`Added work experience: ${exp.title} at ${exp.company_name} for ${transformedProfile.full_name}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing profile:`, error);
      }
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

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

/**
 * Fetch profiles from Aviato API
 */
async function fetchGTProfiles(limit = 10) {
  console.log(`Starting to fetch up to ${limit} profiles...`);

  // Use the proper DSL structure for Georgia Tech profiles
  // Georgia Tech ID: TSBrRHzvWH9Z
  const query = {
    offset: 0,
    limit: limit, // Use the provided limit
    sort: [], // No specific sorting
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
              "value": "2022-07-01T00:00:00.000Z" // Recent students (after 2022)
            }
          },
          {
            "educationList.endDate": {
              "operation": "lte",
              "value": "2027-05-01T00:00:00.000Z" // Expected graduation before 2027
            }
          },
          {
            "degreeList.name": {
              "operation": "eq",
              "value": "Bachelor of Science - BS" // BS degree
            }
          }
        ]
      }
    ]
  };

  let allProfiles = [];
  try {
    console.log(`Searching for Georgia Tech profiles with structured query...`);
    const result = await aviato.search(query);
    
    // Log just the count information to avoid cluttering the logs
    console.log(`API Response count:`, JSON.stringify(result.count, null, 2));
    
    const profiles = result.items || [];
    console.log(`Found ${profiles.length} profiles`);
    
    allProfiles = profiles;
  } catch (error) {
    console.error(`Error searching with structured query:`, error);
  }
  
  console.log(`Total profiles found: ${allProfiles.length}`);
  return allProfiles;
}

/**
 * Transform Aviato profile data to match our schema
 */
function transformAviatoProfile(profile) {
  // Extract URLs from profile
  const { linkedinUrl, twitterUrl, githubUrl } = extractUrls(profile.URLs);
  
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

  // Process education information
  let education = [];
  if (profile.education && Array.isArray(profile.education)) {
    education = profile.education.map(edu => {
      // Try to parse dates - default to null if not available
      let startDate = null;
      let endDate = null;
      
      if (edu.startDate) {
        try {
          startDate = new Date(edu.startDate);
        } catch (e) {
          console.log(`Could not parse start date: ${edu.startDate}`);
        }
      }
      
      if (edu.endDate) {
        try {
          endDate = new Date(edu.endDate);
        } catch (e) {
          console.log(`Could not parse end date: ${edu.endDate}`);
        }
      }
      
      return {
        school_name: edu.schoolName || edu.school || '',
        degree: edu.degree || '',
        field_of_study: edu.fieldOfStudy || edu.major || '',
        start_date: startDate,
        end_date: endDate
      };
    });
  }

  // Process work experience
  let experiences = [];
  if (profile.positions && Array.isArray(profile.positions)) {
    experiences = profile.positions.map(pos => {
      // Try to parse dates - default to null if not available
      let startDate = null;
      let endDate = null;
      let isCurrent = false;
      
      if (pos.startDate) {
        try {
          startDate = new Date(pos.startDate);
        } catch (e) {
          console.log(`Could not parse start date: ${pos.startDate}`);
        }
      }
      
      if (pos.endDate) {
        try {
          endDate = new Date(pos.endDate);
        } catch (e) {
          console.log(`Could not parse end date: ${pos.endDate}`);
        }
      }
      
      // Determine if this is current position
      isCurrent = pos.isCurrent === true || pos.endDate === null;
      
      return {
        company_name: pos.companyName || pos.company || '',
        title: pos.title || '',
        start_date: startDate,
        end_date: endDate,
        is_current: isCurrent
      };
    });
  }

  // Create transformed profile object
  return {
    aviato_id: profile.id,
    full_name: profile.fullName || profile.name || '',
    headline: profile.headline || '',
    title: profile.title || '',
    company: profile.company || '',
    major: profile.education && profile.education[0] ? profile.education[0].fieldOfStudy : '',
    graduation_year: profile.education && profile.education[0] ? 
      (profile.education[0].endDate ? new Date(profile.education[0].endDate).getFullYear() : null) : null,
    is_student: false, // Default assumption
    location: profile.location || '',
    country: country,
    region: region,
    locality: locality,
    elo_rating: 1500, // Default ELO rating
    linkedin_url: linkedinUrl,
    twitter_url: twitterUrl,
    github_url: githubUrl,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    education: education,
    experiences: experiences
  };
}

/**
 * Insert a profile into Supabase
 */
async function insertProfile(profileData) {
  const { education, experiences, ...profile } = profileData;

  return await supabase.from("profiles").insert([profile]).select();
}

/**
 * Insert an education record into Supabase
 */
async function insertEducation(education) {
  return await supabase.from("education").insert([education]);
}

/**
 * Insert a work experience record into Supabase
 */
async function insertWorkExperience(experience) {
  return await supabase.from("work_experience").insert([
    {
      profile_id: experience.profile_id,
      company_name: experience.company_name,
      title: experience.title,
      start_date: experience.start_date,
      end_date: experience.end_date,
      is_current: experience.is_current,
    },
  ]);
}

// Execute the seeding function
seedDatabase();
