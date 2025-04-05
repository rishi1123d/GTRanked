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
      // Format experiences
      const experiences = profile.experience
        ? profile.experience.map((exp: any) => {
            // Format the duration (e.g., "2022 - Present")
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
          })
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
        skills: [], // Not in database
        experiences, // Use the formatted experiences
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
