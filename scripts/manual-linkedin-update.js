const { supabase } = require('../lib/supabase');

// Sample profile data with LinkedIn URLs
const profilesWithLinkedIn = [
  {
    name: "Ashley Suk",
    linkedin_url: "https://www.linkedin.com/in/ashleysuk/"
  },
  {
    name: "Zachary Bloomberg",
    linkedin_url: "https://www.linkedin.com/in/zacharybloomberg/"
  },
  {
    name: "Sahaj Purohit",
    linkedin_url: "https://www.linkedin.com/in/sahajpurohit/"
  },
  {
    name: "Mary Kate Gale",
    linkedin_url: "https://www.linkedin.com/in/marykategal/"
  },
  {
    name: "Nguyet Dinh",
    linkedin_url: "https://www.linkedin.com/in/nguyetdinh/"
  }
];

async function updateProfileLinkedInUrls() {
  console.log('Starting manual LinkedIn URL update process...');
  
  let updatedCount = 0;
  
  for (const profile of profilesWithLinkedIn) {
    try {
      // Find the profile by name
      const { data: foundProfiles, error: findError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', `%${profile.name}%`)
        .limit(1);
        
      if (findError) {
        console.error(`Error finding profile ${profile.name}:`, findError);
        continue;
      }
      
      if (!foundProfiles || foundProfiles.length === 0) {
        console.log(`No profile found with name similar to ${profile.name}`);
        continue;
      }
      
      const foundProfile = foundProfiles[0];
      console.log(`Found profile: ${foundProfile.full_name} (ID: ${foundProfile.id})`);
      
      // Update the LinkedIn URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          linkedin_url: profile.linkedin_url
        })
        .eq('id', foundProfile.id);
        
      if (updateError) {
        console.error(`Error updating LinkedIn URL for ${foundProfile.full_name}:`, updateError);
        continue;
      }
      
      console.log(`Successfully updated LinkedIn URL for ${foundProfile.full_name}: ${profile.linkedin_url}`);
      updatedCount++;
      
    } catch (error) {
      console.error(`Error processing profile ${profile.name}:`, error);
    }
  }
  
  console.log(`Manual update completed. Updated ${updatedCount} profiles with LinkedIn URLs.`);
  return updatedCount;
}

// Run the function
updateProfileLinkedInUrls()
  .then(count => {
    console.log(`Manual LinkedIn URL update script completed. Updated ${count} profiles.`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running manual LinkedIn URL update script:', error);
    process.exit(1);
  }); 