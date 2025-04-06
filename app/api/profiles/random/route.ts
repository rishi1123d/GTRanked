import { NextResponse } from "next/server";
// Import the JavaScript version of the profiles module
const { getRandomProfiles, getProfileById } = require("@/lib/profiles-js");

// Define a type for the profile returned from Supabase
interface SupabaseProfile {
  id: number;
  full_name?: string;
  title?: string;
  company?: string;
  major?: string;
  graduation_year?: number;
  is_student: boolean;
  elo_rating: number;
  location?: string;
  [key: string]: any; // Allow for other fields
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

    // Fetch detailed profiles with experience and education data
    const detailedProfiles = await Promise.all(
      basicProfiles.map((profile) => getProfileById(profile.id))
    );

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

      return {
        id: profile.id.toString(),
        name: profile.full_name || "Unknown",
        title: profile.title || "",
        company: profile.company || "",
        major: profile.major || "Unknown",
        graduationYear: profile.graduation_year || 0,
        isStudent: profile.is_student,
        elo: profile.elo_rating,
        location: profile.location || "",
        avatar: `/avatars/${Math.floor(Math.random() * 10) + 1}.png`,
        degree,
        skills, // Now using skills from the database
        experiences, // Using the formatted experiences from both sources
        linkedinUrl: profile.linkedin_url || null, // Include LinkedIn URL if available
      };
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
