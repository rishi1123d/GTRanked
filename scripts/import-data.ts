import { supabase } from '../lib/supabase';
import { fetchAndStoreGTProfiles } from '../lib/aviato-fetcher';
import * as fs from 'fs';
import * as path from 'path';

async function setupDatabase() {
  try {
    // Read the schema SQL file
    const schemaPath = path.join(__dirname, '../lib/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Setting up database schema...');
    
    // Execute SQL as RPC to run the complete script
    const { error } = await supabase.rpc('exec_sql', { sql: schemaSql });
    
    if (error) {
      console.error('Error setting up database schema:', error);
      throw error;
    }
    
    console.log('Database schema setup completed successfully.');
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
    console.error('Database setup failed. Aborting import process.');
    process.exit(1);
  }
  
  // Import profiles from Aviato
  try {
    console.log('Importing profiles from Aviato API...');
    const count = await fetchAndStoreGTProfiles(500); // Import up to 500 profiles
    console.log(`Successfully imported ${count} profiles from Aviato API.`);
  } catch (error) {
    console.error('Error importing profiles from Aviato API:', error);
    process.exit(1);
  }
  
  console.log('Data import process completed successfully!');
  process.exit(0);
}

// Run the main function
if (require.main === module) {
  main().catch(err => {
    console.error('Unhandled error in import process:', err);
    process.exit(1);
  });
}
