const { supabase } = require('./supabase');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config();

// Aviato API configuration
const AVIATO_API_KEY = process.env.AVIATO_API_KEY;
const AVIATO_API_BASE_URL = 'https://api.data.aviato.co/v1';

// Aviato API client
const aviato = {
  async search(body) {
    if (!AVIATO_API_KEY) {
      throw new Error('AVIATO_API_KEY not found in environment variables');
    }
    
    console.log('Making API request to Aviato...');
    console.log(JSON.stringify(body, null, 2));
    
    const response = await fetch(`${AVIATO_API_BASE_URL}/person/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AVIATO_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Aviato API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  },
  async getProfileByUrl(url) {
    // Implementation of getProfileByUrl method
  }
};

// Extract URLs from social links
function extractUrls(urls) {
  if (!urls) return { linkedinUrl: null, twitterUrl: null, githubUrl: null };
  
  const linkedinUrl = urls.linkedin?.[0] || null;
  const twitterUrl = urls.twitter?.[0] || null;
  const githubUrl = urls.github?.[0] || null;
  
  return { linkedinUrl, twitterUrl, githubUrl };
}

// Main function to fetch GT profiles and populate Supabase
async function fetchAndStoreGTProfiles(limit = 5) {
  console.log(`Starting to fetch up to ${limit} Georgia Tech profiles...`);

  // DSL query to find GT students and alumni
  const query = {
    offset: 0,
    limit: limit,
    filters: [
      {
        "OR": [
          {
            "educationList.school.fullName": {
              "operation": "textcontains",
              "value": "Georgia Institute of Technology"
            }
          },
          {
            "educationList.school.fullName": {
              "operation": "textcontains",
              "value": "Georgia Tech"
            }
          }
        ]
      }
    ],
    sort: [
      { "computed_recentlyLeftCompany": { "order": "desc" } }
    ]
  };

  try {
    // Fetch profiles from Aviato
    const result = await aviato.search(query);
    const profiles = result.data || [];
    
    console.log(`Found ${profiles.length} profiles. Processing...`);

    for (const profile of profiles) {
      // Process basic profile data
      const { linkedinUrl, twitterUrl, githubUrl } = extractUrls(profile.URLs);

      // Find education at Georgia Tech
      const gtEducation = profile.educationList?.find((edu) => 
        edu.school?.fullName?.includes('Georgia Tech') || 
        edu.school?.fullName?.includes('Georgia Institute of Technology')
      );

      // Extract major and graduation year from GT education
      const major = gtEducation?.subject || gtEducation?.degree?.fieldOfStudy || 'Unknown';
      const graduationYear = gtEducation?.endDate ? new Date(gtEducation.endDate).getFullYear() : null;
      
      // Check if they're currently a student
      const isStudent = gtEducation && (!gtEducation.endDate || new Date(gtEducation.endDate) > new Date());
      
      // Get current work experience if any
      const currentExperience = profile.experienceList?.find((exp) => exp.endDate === null);
      const title = currentExperience?.positionList?.[0]?.title || '';
      const company = currentExperience?.company?.name || '';

      console.log(`Processing profile: ${profile.fullName}`);
      
      // Insert profile into Supabase
      const { data: insertedProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          aviato_id: profile.id,
          full_name: profile.fullName,
          headline: profile.headline || '',
          title: title,
          company: company,
          major: major,
          graduation_year: graduationYear,
          is_student: isStudent,
          location: profile.location || '',
          country: profile.country || '',
          region: profile.region || '',
          locality: profile.locality || '',
          elo_rating: 1500, // Default ELO rating
          linkedin_url: linkedinUrl,
          twitter_url: twitterUrl,
          github_url: githubUrl,
          profile_image_url: profile.profilePicture || profile.pictureUrl || null
        }, { onConflict: 'aviato_id' })
        .select('id');

      if (profileError) {
        console.error(`Error inserting profile ${profile.fullName}:`, profileError);
        continue;
      }

      const profileId = insertedProfile?.[0]?.id;
      if (!profileId) {
        console.error(`Could not get ID for inserted profile ${profile.fullName}`);
        continue;
      }

      console.log(`Inserted profile ${profile.fullName} with ID ${profileId}`);

      // Insert education data
      if (profile.educationList && profile.educationList.length > 0) {
        console.log(`Processing ${profile.educationList.length} education entries`);
        for (const edu of profile.educationList) {
          const { error: eduError } = await supabase
            .from('education')
            .upsert({
              profile_id: profileId,
              school_id: edu.school?.id || null,
              school_name: edu.school?.fullName || 'Unknown School',
              degree: edu.degree?.name || '',
              field_of_study: edu.degree?.fieldOfStudy || edu.subject || '',
              start_date: edu.startDate || null,
              end_date: edu.endDate || null
            });

          if (eduError) {
            console.error(`Error inserting education for ${profile.fullName}:`, eduError);
          }
        }
      }

      // Insert work experience data
      if (profile.experienceList && profile.experienceList.length > 0) {
        console.log(`Processing ${profile.experienceList.length} work experience entries`);
        for (const exp of profile.experienceList) {
          const position = exp.positionList?.[0]?.title || '';
          const { error: expError } = await supabase
            .from('work_experience')
            .upsert({
              profile_id: profileId,
              company_id: exp.company?.id || null,
              company_name: exp.company?.name || exp.companyName || 'Unknown Company',
              title: position,
              start_date: exp.startDate || null,
              end_date: exp.endDate || null,
              is_current: exp.endDate === null,
              company_logo_url: exp.companyLogo || exp.logoUrl || null
            });

          if (expError) {
            console.error(`Error inserting work experience for ${profile.fullName}:`, expError);
          }
        }
      }
    }

    console.log(`Successfully processed ${profiles.length} profiles!`);
    return profiles.length;
  } catch (error) {
    console.error('Error fetching and storing profiles:', error);
    throw error;
  }
}

export async function updateProfileImages() {
  // Get profiles without images
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, linkedin_url')
    .is('profile_image_url', null);
    
  for (const profile of profiles) {
    if (profile.linkedin_url) {
      try {
        // Fetch fresh data from Aviato
        const linkedinData = await aviato.getProfileByUrl(profile.linkedin_url);
        
        // Update just the image URL
        await supabase
          .from('profiles')
          .update({ 
            profile_image_url: linkedinData.profilePicture || null,
            // Add more fields you want to update here
          })
          .eq('id', profile.id);
          
        console.log(`Updated profile image for ID ${profile.id}`);
      } catch (error) {
        console.error(`Failed to update profile ${profile.id}:`, error);
      }
      
      // Avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

module.exports = { fetchAndStoreGTProfiles };
