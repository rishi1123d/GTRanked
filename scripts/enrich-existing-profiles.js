const dotenv = require('dotenv');
const { supabase } = require('../lib/supabase');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config();

// Aviato API configuration
const AVIATO_API_KEY = process.env.AVIATO_API_KEY;
const AVIATO_API_BASE_URL = 'https://api.data.aviato.co/v1';

// Extract URLs from social links
function extractUrls(urls) {
  if (!urls) return { linkedinUrl: null, twitterUrl: null, githubUrl: null };
  
  const linkedinUrl = urls.linkedin?.[0] || null;
  const twitterUrl = urls.twitter?.[0] || null;
  const githubUrl = urls.github?.[0] || null;
  
  return { linkedinUrl, twitterUrl, githubUrl };
}

// Search Aviato for a specific profile
async function searchProfile(name, school = 'Georgia Tech') {
  if (!AVIATO_API_KEY) {
    throw new Error('AVIATO_API_KEY not found in environment variables');
  }
  
  const query = {
    offset: 0,
    limit: 5,
    filters: [
      { "fullName": { "operation": "textcontains", "value": name } },
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
    ]
  };
  
  console.log(`Searching for profile: ${name} at ${school}`);
  
  const response = await fetch(`${AVIATO_API_BASE_URL}/person/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AVIATO_API_KEY}`
    },
    body: JSON.stringify(query)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Aviato API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data || [];
}

// Main function to enrich existing profiles
async function enrichExistingProfiles(limit = 20) {
  try {
    console.log('Starting to enrich existing profiles...');
    
    // Get profiles without LinkedIn URLs
    const { data: profilesWithoutUrls, error } = await supabase
      .from('profiles')
      .select('id, full_name, aviato_id')
      .is('linkedin_url', null)
      .limit(limit);
      
    if (error) {
      console.error('Error fetching profiles without LinkedIn URLs:', error);
      return;
    }
    
    console.log(`Found ${profilesWithoutUrls.length} profiles to enrich`);
    
    let enrichedCount = 0;
    
    for (const profile of profilesWithoutUrls) {
      try {
        console.log(`Processing profile: ${profile.full_name} (ID: ${profile.id})`);
        
        // Search for the profile in Aviato
        const searchResults = await searchProfile(profile.full_name);
        
        // If no results found, skip
        if (!searchResults.length) {
          console.log(`No results found for ${profile.full_name}`);
          continue;
        }
        
        // Find the best matching profile
        let matchedProfile;
        
        // First try to match by Aviato ID if available
        if (profile.aviato_id) {
          matchedProfile = searchResults.find(p => p.id === profile.aviato_id);
        }
        
        // If no match by ID, try to match by exact name
        if (!matchedProfile) {
          matchedProfile = searchResults.find(p => 
            p.fullName.toLowerCase() === profile.full_name.toLowerCase()
          );
        }
        
        // If still no match, use the first result
        if (!matchedProfile && searchResults.length > 0) {
          matchedProfile = searchResults[0];
        }
        
        if (matchedProfile) {
          const { linkedinUrl, twitterUrl, githubUrl } = extractUrls(matchedProfile.URLs);
          
          if (linkedinUrl) {
            // Update the profile with the LinkedIn URL
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                linkedin_url: linkedinUrl,
                twitter_url: twitterUrl || null,
                github_url: githubUrl || null,
                profile_image_url: matchedProfile.profilePicture || matchedProfile.pictureUrl || null,
                aviato_id: matchedProfile.id  // Update the Aviato ID if it was missing
              })
              .eq('id', profile.id);
              
            if (updateError) {
              console.error(`Error updating profile ${profile.full_name}:`, updateError);
              continue;
            }
            
            console.log(`Enriched profile ${profile.full_name} with LinkedIn URL: ${linkedinUrl}`);
            enrichedCount++;
          } else {
            console.log(`No LinkedIn URL found for ${profile.full_name}`);
          }
        } else {
          console.log(`No matching profile found for ${profile.full_name}`);
        }
        
        // Add a delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing profile ${profile.full_name}:`, error);
      }
    }
    
    console.log(`Successfully enriched ${enrichedCount} out of ${profilesWithoutUrls.length} profiles`);
    return enrichedCount;
    
  } catch (error) {
    console.error('Error enriching profiles:', error);
    throw error;
  }
}

// Run the enrichment script
enrichExistingProfiles()
  .then(count => {
    console.log(`Enrichment script completed. Enriched ${count} profiles.`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running enrichment script:', error);
    process.exit(1);
  }); 