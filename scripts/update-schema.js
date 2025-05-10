const { supabase } = require("../lib/supabase.js");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

/**
 * Update the database schema to add is_enriched field for on-demand enrichment
 */
async function updateSchema() {
  console.log("Starting schema update for on-demand enrichment...");
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
    // First check if any profile has the is_enriched field
    const { data: sampleProfile, error: sampleError } = await supabase
      .from('profiles')
      .select('is_enriched')
      .limit(1)
      .single();
    
    // If the field doesn't exist yet in the profiles table, we need to add it
    if (sampleError && sampleError.message.includes('column "is_enriched" does not exist')) {
      console.log("The is_enriched column doesn't exist in the profiles table. Adding it via SQL...");
      
      // Execute SQL to add the column
      const { error: alterError } = await supabase.rpc('execute_sql', {
        sql_query: 'ALTER TABLE profiles ADD COLUMN is_enriched BOOLEAN DEFAULT FALSE'
      });
      
      if (alterError) {
        console.error("Error adding is_enriched column:", alterError);
        
        console.log("Alternative approach: Trying to execute statement directly via REST API...");
        // Try an alternative approach if the RPC method doesn't work
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              query: 'ALTER TABLE profiles ADD COLUMN is_enriched BOOLEAN DEFAULT FALSE'
            })
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("REST API error:", errorText);
          console.log("Schema update failed. You may need to add the is_enriched column manually.");
          
          console.log("\nManual steps to update schema:");
          console.log("1. Go to the Supabase dashboard");
          console.log("2. Open the SQL Editor");
          console.log("3. Run the following SQL:");
          console.log("   ALTER TABLE profiles ADD COLUMN is_enriched BOOLEAN DEFAULT FALSE;");
          console.log("4. Run another query to set existing enriched profiles:");
          console.log("   UPDATE profiles SET is_enriched = TRUE WHERE exp1_title IS NOT NULL;");
          
          process.exit(1);
        }
      }
      
      console.log("Successfully added is_enriched column to profiles table");
    } else {
      console.log("The is_enriched column already exists in the profiles table");
    }
    
    // Update existing profiles with enrichment status
    // We'll assume a profile is enriched if it has exp1_title filled in
    console.log("Updating enrichment status for existing profiles...");
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, exp1_title, is_enriched');
    
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      process.exit(1);
    }
    
    let updatedCount = 0;
    
    for (const profile of profiles) {
      // If the profile has exp1_title, mark it as enriched
      if (profile.exp1_title && profile.is_enriched !== true) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_enriched: true })
          .eq('id', profile.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`Marked profile ${profile.id} (${profile.full_name}) as enriched`);
        }
      }
      // If the profile doesn't have exp1_title, make sure it's marked as not enriched
      else if (!profile.exp1_title && profile.is_enriched === true) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_enriched: false })
          .eq('id', profile.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`Marked profile ${profile.id} (${profile.full_name}) as not enriched`);
        }
      }
    }
    
    console.log(`Updated enrichment status for ${updatedCount} profiles`);
    console.log("Schema update completed successfully");
    
  } catch (error) {
    console.error("Error updating schema:", error);
    process.exit(1);
  }
}

// Run the script
updateSchema().catch(err => {
  console.error("Unhandled error in schema update process:", err);
  process.exit(1);
});
