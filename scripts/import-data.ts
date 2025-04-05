const { supabase } = require('../lib/supabase');
const { fetchAndStoreGTProfiles } = require('../lib/aviato-fetcher');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    // Read the schema SQL file
    const schemaPath = path.join(__dirname, '../lib/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Setting up database schema...');
    
    // Execute SQL queries one by one
    const queries = schemaSql
      .split(';')
      .filter(query => query.trim() !== '')
      .map(query => query.trim() + ';');
    
    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        // Some specific SQL statements might not work via RPC
        // We'll try a different approach
        console.warn(`Warning: Could not execute query via RPC: ${error.message}`);
        // In a production environment, you might want to use Supabase migrations instead
      }
    }
    
    console.log('Database schema setup completed.');
    return true;
  } catch (error) {
    console.error('Failed to set up database schema:', error);
    return false;
  }
}

async function main() {
  console.log('Starting GTRanked data import process...');
  
  // Setup database tables
  const dbSetupSuccess = await setupDatabase();
  if (!dbSetupSuccess) {
    console.log('Database setup encountered some issues. Proceeding anyway as tables may already exist.');
  }
  
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
