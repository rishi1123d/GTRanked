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
    
    // The query passed to this function should already be a properly formatted DSL object
    const requestBody = { dsl: query };
    
    console.log('Making API request to Aviato search...');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Use AbortController for request timeout management
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 60000); // Increased to 60 second timeout (from 30)
    
    try {
      console.log(`API Endpoint: ${AVIATO_API_BASE_URL}/person/search`);
      console.log('API Key available:', !!AVIATO_API_KEY);
      
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
        console.error('API Response Status:', response.status);
        console.error('API Response Text:', errorText);
        throw new Error(`Aviato API error: ${response.status} ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('Aviato API request timed out after 60 seconds');
      }
      throw error;
    }
  },
  
  async enrichProfile(id) {
    if (!AVIATO_API_KEY) {
      throw new Error('AVIATO_API_KEY not found in environment variables');
    }
    
    // Parameters for the enrich endpoint - include needs to be a comma-separated string, not an array
    const includeValue = "EDUCATION,EXPERIENCE,DEGREES,SKILLS";
    const url = `${AVIATO_API_BASE_URL}/person/enrich?id=${id}&include=${includeValue}`;
    
    console.log(`Making API request to Aviato enrich for profile ID: ${id}`);
    console.log(`API Endpoint: ${url}`);
    console.log('API Key available:', !!AVIATO_API_KEY);
    
    // Use AbortController for request timeout management
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 60000); // 60 second timeout
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AVIATO_API_KEY}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Status:', response.status);
        console.error('API Response Text:', errorText);
        throw new Error(`Aviato API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Successfully enriched profile');
      return data;
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('Aviato API request timed out after 60 seconds');
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
      console.error('Error checking for existing profile:', checkError);
      return { success: false, error: checkError };
    }
    
    let profileId;
    
    if (existingProfiles && existingProfiles.length > 0) {
      profileId = existingProfiles[0].id;
      console.log(`Profile with aviato_id ${profileData.aviato_id} already exists with ID ${profileId}, updating...`);
      
      // Update existing profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', profileId);
      
      if (updateError) {
        console.error('Error updating profile:', updateError);
        return { success: false, error: updateError };
      }
    } else {
      console.log(`Profile with aviato_id ${profileData.aviato_id} is new, inserting...`);
      
      // Insert new profile
      const { data: insertedProfiles, error: insertError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select();
      
      if (insertError) {
        console.error('Error inserting profile:', insertError);
        return { success: false, error: insertError };
      }
      
      profileId = insertedProfiles[0].id;
    }
    
    return { success: true, profileId };
  } catch (error) {
    console.error('Unexpected error in insertProfile:', error);
    return { success: false, error };
  }
};

// Insert a skill into Supabase
const insertSkill = async (profileId, skillName) => {
  try {
    const { data, error } = await supabase
      .from('skills')
      .insert([{
        profile_id: profileId,
        skill_name: skillName
      }]);
    
    if (error) {
      console.error(`Error inserting skill ${skillName}:`, error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in insertSkill:', error);
    return { success: false, error };
  }
};

// Insert an honor into Supabase
const insertHonor = async (profileId, title, description) => {
  try {
    const { data, error } = await supabase
      .from('honors')
      .insert([{
        profile_id: profileId,
        title,
        description
      }]);
    
    if (error) {
      console.error(`Error inserting honor ${title}:`, error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in insertHonor:', error);
    return { success: false, error };
  }
};

// Main function to fetch profiles and populate Supabase
async function fetchAndStoreGTProfiles(limit = 5) {
  console.log(`Starting to fetch up to ${limit} profiles...`);

  // Try a few different query approaches in case one works better than others
  const queries = [
    // Complete query with school ID, education dates, and degree type
    {
      offset: 2, // Use offset 2 to get another different profile
      limit: 1, // Only fetch one profile for testing
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
    }
  ];

  let profileId = null;
  let enrichedProfile = null;
  
  // Try each query approach until we get results or exhaust all options
  for (let i = 0; i < queries.length; i++) {
    if (enrichedProfile) break; // Stop if we already have a profile
    
    const query = queries[i];
    console.log(`Trying query approach ${i+1}...`);
    
    try {
      // Fetch profiles from Aviato with the query
      const result = await aviato.search(query);
      
      // Log just the count information to avoid cluttering the logs
      console.log(`API Response count:`, JSON.stringify(result.count, null, 2));
      
      if (result.items && result.items.length > 0) {
        const profiles = result.items;
        console.log(`Found ${profiles.length} profiles with query approach ${i+1}`);
        
        // Take the first profile and enrich it
        const profile = profiles[0];
        console.log(`Selected profile: ${profile.fullName} (${profile.id}) for enrichment`);
        
        // Enrich the profile
        try {
          enrichedProfile = await aviato.enrichProfile(profile.id);
          console.log(`Successfully enriched profile for ${enrichedProfile.fullName}`);
        } catch (enrichError) {
          console.error(`Error enriching profile ${profile.fullName}:`, enrichError);
        }
      } else {
        console.log(`No profiles found with query approach ${i+1}`);
      }
    } catch (error) {
      console.error(`Error with query approach ${i+1}:`, error.message);
    }
  }
  
  if (!enrichedProfile) {
    console.log(`No profiles found or failed to enrich. Exiting.`);
    return 0;
  }
  
  console.log(`Processing enriched profile for ${enrichedProfile.fullName}...`);
  
  // Process and insert the enriched profile
  try {
    // Extract URLs
    const { linkedinUrl, twitterUrl, githubUrl } = extractUrls(enrichedProfile.URLs);
    
    // Parse location data
    let country = '';
    let region = '';
    let locality = '';
    
    if (enrichedProfile.location) {
      const locationParts = enrichedProfile.location.split(', ');
      if (locationParts.length >= 3) {
        [locality, region, country] = locationParts;
      } else if (locationParts.length === 2) {
        [locality, country] = locationParts;
      } else if (locationParts.length === 1) {
        country = locationParts[0];
      }
    }
    
    // Extract education and degree information
    let majorField = '';
    let graduationYear = null;
    let schoolName = '';
    let degreeName = '';
    
    if (enrichedProfile.educationList && Array.isArray(enrichedProfile.educationList)) {
      // Find Georgia Tech education
      const gtEducation = enrichedProfile.educationList.find(edu => 
        (edu.school && edu.school.id === 'TSBrRHzvWH9Z') || 
        (edu.name && edu.name.includes('Georgia'))
      );
      
      if (gtEducation) {
        schoolName = gtEducation.name || (gtEducation.school ? gtEducation.school.fullName : '');
        
        // Try to find the end date for graduation year
        if (gtEducation.endDate) {
          try {
            graduationYear = new Date(gtEducation.endDate).getFullYear();
          } catch (e) {
            console.log(`Could not parse graduation year from: ${gtEducation.endDate}`);
          }
        }
      }
    }
    
    // Find degree information
    if (enrichedProfile.degreeList && Array.isArray(enrichedProfile.degreeList)) {
      const gtDegree = enrichedProfile.degreeList.find(degree => 
        degree.school && degree.school.id === 'TSBrRHzvWH9Z'
      );
      
      if (gtDegree) {
        degreeName = gtDegree.name || '';
        // Major field might be part of the degree name or separate
        if (degreeName.includes(' in ')) {
          const parts = degreeName.split(' in ');
          if (parts.length > 1) {
            majorField = parts[1];
          }
        }
      }
    }
    
    // Extract and process experiences - sort by most recent first
    let experiences = [];
    
    if (enrichedProfile.experienceList && Array.isArray(enrichedProfile.experienceList)) {
      // Extract relevant experience info and sort by start date (descending)
      experiences = enrichedProfile.experienceList
        .filter(exp => exp.positionList && exp.positionList.length > 0)
        .map(exp => {
          const position = exp.positionList[0]; // Take the first position
          return {
            title: position.title || '',
            company: exp.companyName || (exp.company ? exp.company.name : ''),
            startDate: position.startDate ? new Date(position.startDate) : null,
            endDate: position.endDate ? new Date(position.endDate) : null,
            description: position.description || '',
            isCurrent: position.endDate ? false : true
          };
        })
        .sort((a, b) => {
          // Sort by start date (most recent first)
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return b.startDate.getTime() - a.startDate.getTime();
        });
    }
    
    // Prepare the top 3 experiences for the profile table
    const exp1 = experiences.length > 0 ? experiences[0] : null;
    const exp2 = experiences.length > 1 ? experiences[1] : null;
    const exp3 = experiences.length > 2 ? experiences[2] : null;
    
    // Prepare profile data to insert
    const profileData = {
      aviato_id: enrichedProfile.id,
      full_name: enrichedProfile.fullName,
      headline: enrichedProfile.headline || '',
      title: exp1 ? exp1.title : '',
      company: exp1 ? exp1.company : '',
      major: majorField,
      graduation_year: graduationYear,
      is_student: true, // Assuming these are current students based on the filter
      location: enrichedProfile.location || '',
      country: country,
      region: region, 
      locality: locality,
      elo_rating: 1500, // Default ELO rating
      linkedin_url: linkedinUrl,
      twitter_url: twitterUrl,
      github_url: githubUrl,
      
      // Add top experience fields
      exp1_title: exp1 ? exp1.title : null,
      exp1_company: exp1 ? exp1.company : null,
      exp1_start_date: exp1 && exp1.startDate ? exp1.startDate : null,
      exp1_end_date: exp1 && exp1.endDate ? exp1.endDate : null,
      exp1_description: exp1 ? exp1.description : null,
      exp1_is_current: exp1 ? exp1.isCurrent : null,
      
      exp2_title: exp2 ? exp2.title : null,
      exp2_company: exp2 ? exp2.company : null,
      exp2_start_date: exp2 && exp2.startDate ? exp2.startDate : null,
      exp2_end_date: exp2 && exp2.endDate ? exp2.endDate : null,
      exp2_description: exp2 ? exp2.description : null,
      exp2_is_current: exp2 ? exp2.isCurrent : null,
      
      exp3_title: exp3 ? exp3.title : null,
      exp3_company: exp3 ? exp3.company : null,
      exp3_start_date: exp3 && exp3.startDate ? exp3.startDate : null,
      exp3_end_date: exp3 && exp3.endDate ? exp3.endDate : null,
      exp3_description: exp3 ? exp3.description : null,
      exp3_is_current: exp3 ? exp3.isCurrent : null,
      
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };
    
    console.log('Inserting profile data:', JSON.stringify(profileData, null, 2));
    
    // Insert profile into Supabase
    const result = await insertProfile(profileData);
    
    if (!result.success) {
      console.error(`Error inserting profile ${enrichedProfile.fullName}:`, result.error);
      return 0;
    }

    profileId = result.profileId;
    if (!profileId) {
      console.error(`Could not get ID for inserted profile ${enrichedProfile.fullName}`);
      return 0;
    }

    console.log(`Inserted profile ${enrichedProfile.fullName} with ID ${profileId}`);
    
    // Insert skills
    if (enrichedProfile.skills && Array.isArray(enrichedProfile.skills)) {
      console.log(`Adding ${enrichedProfile.skills.length} skills for ${enrichedProfile.fullName}`);
      
      for (const skill of enrichedProfile.skills) {
        const skillResult = await insertSkill(profileId, skill);
        if (skillResult.success) {
          console.log(`Added skill: ${skill}`);
        }
      }
    }
    
    // Insert education records
    if (enrichedProfile.educationList && Array.isArray(enrichedProfile.educationList)) {
      console.log(`Adding ${enrichedProfile.educationList.length} education records for ${enrichedProfile.fullName}`);
      
      for (const edu of enrichedProfile.educationList) {
        try {
          const schoolId = edu.school ? edu.school.id : null;
          const schoolName = edu.name || (edu.school ? edu.school.fullName : '');
          
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
          
          // Find matching degree for this education
          let degree = '';
          let fieldOfStudy = '';
          
          if (enrichedProfile.degreeList) {
            const matchingDegree = enrichedProfile.degreeList.find(d => 
              d.personEducationID === edu.id
            );
            
            if (matchingDegree) {
              degree = matchingDegree.name || '';
              // Try to extract field of study from degree name
              if (degree.includes(' in ')) {
                const parts = degree.split(' in ');
                if (parts.length > 1) {
                  fieldOfStudy = parts[1];
                }
              }
            }
          }
          
          const educationData = {
            profile_id: profileId,
            school_id: schoolId,
            school_name: schoolName,
            degree: degree,
            field_of_study: fieldOfStudy,
            start_date: startDate,
            end_date: endDate
          };
          
          const { error } = await supabase.from('education').insert([educationData]);
          
          if (error) {
            console.error(`Error inserting education for ${enrichedProfile.fullName}:`, error);
          } else {
            console.log(`Added education: ${schoolName}`);
          }
        } catch (eduError) {
          console.error(`Error processing education record:`, eduError);
        }
      }
    }
    
    // Insert all work experiences
    if (experiences.length > 0) {
      console.log(`Adding ${experiences.length} work experiences for ${enrichedProfile.fullName}`);
      
      for (const exp of experiences) {
        try {
          const workData = {
            profile_id: profileId,
            company_name: exp.company,
            title: exp.title,
            start_date: exp.startDate,
            end_date: exp.endDate,
            is_current: exp.isCurrent
          };
          
          const { error } = await supabase.from('work_experience').insert([workData]);
          
          if (error) {
            console.error(`Error inserting work experience for ${enrichedProfile.fullName}:`, error);
          } else {
            console.log(`Added work experience: ${exp.title} at ${exp.company}`);
          }
        } catch (workError) {
          console.error(`Error processing work experience record:`, workError);
        }
      }
    }
    
    console.log(`Successfully processed profile for ${enrichedProfile.fullName}!`);
    return 1;
  } catch (error) {
    console.error(`Error processing profile ${enrichedProfile.fullName}:`, error);
    return 0;
  }
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
