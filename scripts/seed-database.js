const { supabase } = require("../lib/supabase.js");
const { mockProfiles } = require("../lib/mock-data.js");
require("dotenv").config({ path: ".env.local" });

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
    const transformedData = transformMockData(mockProfiles);
    console.log(`Transforming ${transformedData.length} profiles...`);

    // Insert profiles
    for (const profile of transformedData) {
      const { data: profileData, error: profileError } = await insertProfile(
        profile
      );

      if (profileError) {
        console.error(
          `Error inserting profile ${profile.full_name}:`,
          profileError
        );
        continue;
      }

      if (!profileData || profileData.length === 0) {
        console.error(
          `No data returned when inserting profile ${profile.full_name}`
        );
        continue;
      }

      const profileId = profileData[0].id;
      console.log(
        `Inserted profile: ${profile.full_name} with ID: ${profileId}`
      );

      // Insert education records
      if (profile.education && profile.education.length > 0) {
        for (const edu of profile.education) {
          const educationRecord = {
            ...edu,
            profile_id: profileId,
          };

          const { error: eduError } = await insertEducation(educationRecord);
          if (eduError) {
            console.error(
              `Error inserting education for ${profile.full_name}:`,
              eduError
            );
          }
        }
      }

      // Insert work experience records
      if (profile.experiences && profile.experiences.length > 0) {
        for (const exp of profile.experiences) {
          const workRecord = {
            ...exp,
            profile_id: profileId,
          };

          const { error: workError } = await insertWorkExperience(workRecord);
          if (workError) {
            console.error(
              `Error inserting work experience for ${profile.full_name}:`,
              workError
            );
          }
        }
      }
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

/**
 * Transform mock data to match Supabase schema
 */
function transformMockData(mockProfiles) {
  return mockProfiles.map((profile) => {
    // Generate a random aviato_id if not present
    const aviatoId = `aviato_${Math.random().toString(36).substring(2, 10)}`;

    // Create the main profile object
    const transformedProfile = {
      aviato_id: aviatoId,
      full_name: profile.name,
      title: profile.title,
      company: profile.company,
      major: profile.major,
      graduation_year: profile.graduationYear,
      is_student: profile.isStudent,
      elo_rating: profile.elo,
      // Set additional fields
      headline: `${profile.degree} in ${profile.major}`,
      location: "Atlanta, GA", // Default for GT
      country: "USA",
      region: "Georgia",
      locality: "Atlanta",
      // Set URLs if available
      linkedin_url: null,
      twitter_url: null,
      github_url: null,
    };

    // Transform education data
    const education = [];
    // Add the main education
    education.push({
      school_name: "Georgia Institute of Technology",
      degree: profile.degree,
      field_of_study: profile.major,
      start_date: new Date(profile.graduationYear - 4, 8, 1), // Assume 4 years earlier, September
      end_date: new Date(profile.graduationYear, 5, 1), // June of graduation year
    });

    // Add previous education if available
    if (profile.previousEducation) {
      education.push({
        school_name: profile.previousEducation.school,
        degree: profile.previousEducation.degree,
        field_of_study: profile.previousEducation.major,
        start_date: new Date(profile.previousEducation.year - 4, 8, 1),
        end_date: new Date(profile.previousEducation.year, 5, 1),
      });
    }

    // Transform work experiences
    const experiences = profile.experiences
      ? profile.experiences.map((exp) => {
          const durationParts = exp.duration.split(" - ");
          const startYear = parseInt(durationParts[0]);
          const endYear =
            durationParts[1] === "Present" ? null : parseInt(durationParts[1]);

          return {
            company_name: exp.company,
            title: exp.title,
            start_date: new Date(startYear, 0, 1), // January 1st of start year
            end_date: endYear ? new Date(endYear, 11, 31) : null, // December 31st of end year or null
            is_current: durationParts[1] === "Present",
          };
        })
      : [];

    return {
      ...transformedProfile,
      education,
      experiences,
    };
  });
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
