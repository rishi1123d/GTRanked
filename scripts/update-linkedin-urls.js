const { fetchAndStoreGTProfiles } = require('../lib/aviato-fetcher');
const { supabase } = require('../lib/supabase');

/**
 * Updates LinkedIn URLs for existing profiles in the database
 * This script will:
 * 1. Check for profiles missing LinkedIn URLs
 * 2. Fetch more profiles from Aviato to get their LinkedIn URLs
 * 3. Update the database with the new LinkedIn URLs
 */
async function updateLinkedInUrls() {
  try {
    console.log('Starting LinkedIn URL update process...');
    
    // Step 1: Count profiles without LinkedIn URLs
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('linkedin_url', null);
      
    if (countError) {
      console.error('Error counting profiles without LinkedIn URLs:', countError);
      return;
    }
    
    console.log(`Found ${count} profiles without LinkedIn URLs`);
    
    // Step 2: Fetch profiles with LinkedIn URLs from Aviato
    console.log('Fetching profiles from Aviato with LinkedIn URLs...');
    
    // Fetch a larger batch of profiles (adjust the limit as needed)
    const fetchedCount = await fetchAndStoreGTProfiles(50);
    
    console.log(`Successfully fetched and stored ${fetchedCount} profiles from Aviato`);
    
    // Step 3: Count updated profiles
    const { count: newCount, error: newCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('linkedin_url', null);
      
    if (newCountError) {
      console.error('Error counting profiles without LinkedIn URLs after update:', newCountError);
      return;
    }
    
    console.log(`Process complete. Profiles without LinkedIn URLs: ${newCount} (down from ${count})`);
    console.log(`Added LinkedIn URLs to ${count - newCount} profiles`);
    
  } catch (error) {
    console.error('Error updating LinkedIn URLs:', error);
  }
}

// Run the function
updateLinkedInUrls()
  .then(() => {
    console.log('LinkedIn URL update script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running LinkedIn URL update script:', error);
    process.exit(1);
  }); 