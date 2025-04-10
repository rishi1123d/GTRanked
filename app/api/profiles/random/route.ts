import { NextResponse } from "next/server";
import type { ProfileType } from "@/lib/types";
import { getProfileById } from "@/lib/profiles-js";
const { supabase } = require("@/lib/supabase.js");

// Define a type for the profile returned from Supabase
interface SupabaseProfile {
  id: number;
  aviato_id: string;
  full_name: string;
  headline?: string;
  title?: string;
  company?: string;
  major?: string;
  graduation_year?: number;
  is_student: boolean;
  elo_rating: number;
  location?: string;
  is_enriched?: boolean;
  education?: any[];
  skills?: any[];
  [key: string]: any; // Allow for other fields
}

/**
 * Get random profiles from the database, excluding specific IDs
 * This now implements a smart ranking system to ensure users see a mix of high and average ELO profiles
 */
async function getRandomProfiles(excludeIds: number[] = []): Promise<SupabaseProfile[]> {
  console.log("DIAGNOSTICS - getRandomProfiles called with excludeIds:", excludeIds);

  try {
    // First, check how many profiles we have in total
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("Error getting profile count:", countError);
      return [];
    }
    
    console.log("DIAGNOSTICS - Total profile count:", count);
    
    // We'll use a weighted approach:
    // - 30% chance of selecting a high-ELO profile (top 15%)
    // - 70% chance of selecting a random profile from the rest
    
    // Get potential high-ELO profiles (top 15%)
    const topProfileCount = Math.ceil((count || 0) * 0.15);
    const { data: topProfiles, error: topError } = await supabase
      .from('profiles')
      .select('*')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('elo_rating', { ascending: false })
      .limit(topProfileCount);
    
    if (topError) {
      console.error("Error getting top profiles:", topError);
      return [];
    }
    
    // Now get a larger pool of regular profiles
    const { data: regularProfiles, error: regularError } = await supabase
      .from('profiles')
      .select('*')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('id', { ascending: false }) // Just use ID for random-ish selection from newer profiles
      .limit(50);
    
    if (regularError) {
      console.error("Error getting regular profiles:", regularError);
      return [];
    }
    
    console.log(`DIAGNOSTICS - Fetched ${topProfiles.length} top profiles and ${regularProfiles.length} regular profiles`);
    
    // Function to select two distinct profiles with our weighted approach
    const selectTwoProfiles = () => {
      const selectedProfiles: SupabaseProfile[] = [];
      
      // For first profile: 30% chance of high-ELO, 70% chance of regular
      const useHighEloFirst = Math.random() < 0.3 && topProfiles.length > 0;
      
      if (useHighEloFirst && topProfiles.length > 0) {
        // Select random high-ELO profile
        const randomIndex = Math.floor(Math.random() * topProfiles.length);
        selectedProfiles.push(topProfiles[randomIndex]);
        
        // Remove from pool to avoid duplicates
        topProfiles.splice(randomIndex, 1);
      } else if (regularProfiles.length > 0) {
        // Select random regular profile
        const randomIndex = Math.floor(Math.random() * regularProfiles.length);
        selectedProfiles.push(regularProfiles[randomIndex]);
        
        // Remove from pool to avoid duplicates
        regularProfiles.splice(randomIndex, 1);
      }
      
      // For second profile: If we used high-ELO first, use regular now
      // If we used regular first, 30% chance of high-ELO, 70% chance of regular
      const useHighEloSecond = !useHighEloFirst && Math.random() < 0.3 && topProfiles.length > 0;
      
      if (useHighEloSecond && topProfiles.length > 0) {
        const randomIndex = Math.floor(Math.random() * topProfiles.length);
        selectedProfiles.push(topProfiles[randomIndex]);
      } else if (regularProfiles.length > 0) {
        const randomIndex = Math.floor(Math.random() * regularProfiles.length);
        selectedProfiles.push(regularProfiles[randomIndex]);
      }
      
      return selectedProfiles;
    };
    
    // Select two profiles with our algorithm
    const selectedProfiles = selectTwoProfiles();
    
    // If we couldn't get two profiles, fall back to simple random selection
    if (selectedProfiles.length < 2) {
      const { data: fallbackProfiles, error: fallbackError } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .order('RANDOM()')
        .limit(2);
      
      if (fallbackError) {
        console.error("Error getting fallback profiles:", fallbackError);
        return [];
      }
      
      console.log(`DIAGNOSTICS - Fell back to random selection, got ${fallbackProfiles.length} profiles`);
      return fallbackProfiles;
    }
    
    // Perform a join with education to get those records too
    const selectedProfileIds = selectedProfiles.map(profile => profile.id);
    const { data: profilesWithRelations, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        *,
        education:education(*),
        skills:skills(*)
      `)
      .in('id', selectedProfileIds)
      .order('elo_rating', { ascending: false });
    
    if (profilesError) {
      console.error("Error getting profiles with relations:", profilesError);
      return [];
    }
    
    console.log(`DIAGNOSTICS - First profile selected: ${selectedProfiles[0].id}`);
    console.log(`DIAGNOSTICS - Second profile selected: ${selectedProfiles[1].id}`);
    
    return profilesWithRelations;
  } catch (error) {
    console.error("Error in getRandomProfiles:", error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeParam = searchParams.get("exclude") || "";

    // Convert exclude list to array of numbers
    const excludeIds = excludeParam
      ? excludeParam
          .split(",")
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id))
      : [];

    console.log(
      `Fetching random profiles with excludeIds: ${JSON.stringify(excludeIds)}`
    );

    // Get random profiles from Supabase
    const basicProfiles = (await getRandomProfiles(
      excludeIds
    )) as SupabaseProfile[];

    // Check if profiles need enrichment and enrich them
    const detailedProfiles = [];
    
    for (const profile of basicProfiles) {
      try {
        let enrichedProfile;
        
        // Check if profile needs enrichment
        if (profile.is_enriched !== true) {
          console.log(`Profile ${profile.id} (${profile.full_name}) needs enrichment`);
          
          // Call the enrichment endpoint
          const enrichResponse = await fetch(
            `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/profiles/enrich?aviato_id=${profile.aviato_id}`,
            { method: 'GET' }
          );
          
          if (!enrichResponse.ok) {
            console.error(`Error enriching profile ${profile.id}: ${enrichResponse.statusText}`);
            continue;
          }
          
          const enrichResult = await enrichResponse.json();
          enrichedProfile = enrichResult.profile;
          
          console.log(`Successfully enriched profile ${profile.id} ${enrichResult.enriched ? '(newly enriched)' : '(already enriched)'}`);
        } else {
          // Profile is already enriched, just get the details
          enrichedProfile = await getProfileById(profile.id);
          console.log(`Using already enriched profile ${profile.id}`);
        }
        
        if (enrichedProfile) {
          detailedProfiles.push(enrichedProfile);
        }
      } catch (error) {
        console.error(`Error processing profile ${profile.id}:`, error);
      }
    }

    // Transform profiles to match frontend format
    const transformedProfiles = detailedProfiles.map((profile: any) => {
      // Get experiences from both direct profile fields and experience table
      const experiences = [];
      
      // Add top experiences from direct profile fields if available
      if (profile.exp1_title && profile.exp1_company) {
        const startYear = profile.exp1_start_date
          ? new Date(profile.exp1_start_date).getFullYear()
          : "";
        const endYear = profile.exp1_is_current
          ? "Present"
          : profile.exp1_end_date
          ? new Date(profile.exp1_end_date).getFullYear()
          : "";
        const duration =
          startYear && endYear ? `${startYear} - ${endYear}` : "";
          
        experiences.push({
          title: profile.exp1_title,
          company: profile.exp1_company,
          duration,
          companyLogoUrl: profile.exp1_company_logo_url || null,
        });
      }
      
      if (profile.exp2_title && profile.exp2_company) {
        const startYear = profile.exp2_start_date
          ? new Date(profile.exp2_start_date).getFullYear()
          : "";
        const endYear = profile.exp2_is_current
          ? "Present"
          : profile.exp2_end_date
          ? new Date(profile.exp2_end_date).getFullYear()
          : "";
        const duration =
          startYear && endYear ? `${startYear} - ${endYear}` : "";
          
        experiences.push({
          title: profile.exp2_title,
          company: profile.exp2_company,
          duration,
          companyLogoUrl: profile.exp2_company_logo_url || null,
        });
      }
      
      if (profile.exp3_title && profile.exp3_company) {
        const startYear = profile.exp3_start_date
          ? new Date(profile.exp3_start_date).getFullYear()
          : "";
        const endYear = profile.exp3_is_current
          ? "Present"
          : profile.exp3_end_date
          ? new Date(profile.exp3_end_date).getFullYear()
          : "";
        const duration =
          startYear && endYear ? `${startYear} - ${endYear}` : "";
          
        experiences.push({
          title: profile.exp3_title,
          company: profile.exp3_company,
          duration,
          companyLogoUrl: profile.exp3_company_logo_url || null,
        });
      }

      // Format additional experiences from experience table
      if (profile.experience && profile.experience.length > 0) {
        // Start at index 0 if we don't have any direct experiences, otherwise add to the existing ones
        const additionalExperiences = profile.experience
          .map((exp: any) => {
            const startYear = exp.start_date
              ? new Date(exp.start_date).getFullYear()
              : "";
            const endYear = exp.is_current
              ? "Present"
              : exp.end_date
              ? new Date(exp.end_date).getFullYear()
              : "";
            const duration =
              startYear && endYear ? `${startYear} - ${endYear}` : "";

            return {
              title: exp.title || "",
              company: exp.company_name || "",
              duration,
              companyLogoUrl: exp.company_logo_url || null, // Include company logo URL if available
            };
          });
          
        // Add any experiences that aren't already included (avoid duplicates)
        for (const exp of additionalExperiences) {
          const isDuplicate = experiences.some(
            e => e.title === exp.title && e.company === exp.company
          );
          if (!isDuplicate) {
            experiences.push(exp);
          }
        }
      }

      // Get skills from skills table
      const skills = profile.skills 
        ? profile.skills.map((skill: any) => skill.name || "")
        : [];

      // Get degree from education if available
      const degree =
        profile.education && profile.education.length > 0
          ? profile.education[0].degree || "BS"
          : "BS";
          
      // Extract major from headline if it's not available in the profile
      let major = profile.major || "";
      
      // If major is empty, try to extract it from the headline
      if (!major && profile.headline) {
        // Look for common patterns like "CS @ Georgia Tech" or "studying Computer Science at GT"
        const headline = profile.headline.toLowerCase();
        if (headline.includes("cs @") || headline.includes("cs at")) {
          major = "Computer Science";
        } else if (headline.includes("computer science")) {
          major = "Computer Science";
        } else if (headline.includes("electrical engineering")) {
          major = "Electrical Engineering";
        } else if (headline.includes("mechanical engineering")) {
          major = "Mechanical Engineering";
        } else if (headline.includes("business")) {
          major = "Business Administration";
        } else if (headline.includes("data science")) {
          major = "Data Science";
        }
      }
      
      // If still no major found, use part of the degree if it contains "in"
      if (!major && degree && degree.includes(" in ")) {
        const parts = degree.split(" in ");
        if (parts.length > 1) {
          major = parts[1];
        }
      }

      const transformedProfile = {
        id: profile.id.toString(),
        name: profile.full_name || "Unknown",
        title: profile.title || "",
        company: profile.company || "",
        major: major || "Unknown Major",
        graduationYear: profile.graduation_year || 0,
        isStudent: profile.is_student,
        elo: profile.elo_rating,
        location: profile.location || "",
        avatar: `/avatars/${Math.floor(Math.random() * 10) + 1}.png`,
        profileImageUrl: profile.profile_image_url || null,
        degree,
        skills, // Now using skills from the database
        experiences, // Using the formatted experiences from both sources
        linkedinUrl: profile.linkedin_url || null, // Include LinkedIn URL if available
        education: profile.education || [], // Include the full education array
      };
      
      // Log LinkedIn URL for debugging
      console.log(`Profile ${profile.id} (${profile.full_name}) LinkedIn URL: ${profile.linkedin_url || 'None'}`);
      
      return transformedProfile;
    });

    return NextResponse.json({ profiles: transformedProfiles });
  } catch (error) {
    console.error("Error fetching random profiles:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch random profiles",
        message: error instanceof Error ? error.message : "Unknown error",
        profiles: [],
      },
      { status: 500 }
    );
  }
}
