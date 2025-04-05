import { NextResponse } from "next/server";
import { getProfiles } from "@/lib/profiles";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const filter = searchParams.get("filter") || "all";
  const sort = searchParams.get("sort") || "elo";
  const page = Number.parseInt(searchParams.get("page") || "1");
  const limit = Number.parseInt(searchParams.get("limit") || "10");

  try {
    // Get profiles from Supabase
    const { profiles, total, totalPages } = await getProfiles({
      page,
      limit,
      query,
      filter,
      sort,
    });

    // Transform the data to match the existing format that the frontend expects
    const transformedProfiles = profiles.map((profile) => ({
      id: profile.id.toString(),
      name: profile.full_name,
      title: profile.title || "",
      company: profile.company || "",
      major: profile.major || "Unknown",
      graduationYear: profile.graduation_year || 0,
      isStudent: profile.is_student,
      elo: profile.elo_rating,
      location: profile.location || "",
      avatar: `/avatars/${Math.floor(Math.random() * 10) + 1}.png`, // Random avatar for now
      linkedinUrl: profile.linkedin_url || null,
      twitterUrl: profile.twitter_url || null,
      githubUrl: profile.github_url || null,
      // Add education and experience data as needed by the frontend
      degree:
        profile.education && profile.education.length > 0
          ? profile.education[0].degree || ""
          : "",
      skills: [], // We don't have skills in the database schema
      experiences: profile.experience
        ? profile.experience.map((exp) => {
            // Safely handle dates with fallbacks
            const startYear = exp.start_date
              ? new Date(exp.start_date as string).getFullYear()
              : "Unknown";

            const endYear = exp.is_current
              ? "Present"
              : exp.end_date
              ? new Date(exp.end_date as string).getFullYear()
              : "Unknown";

            return {
              title: exp.title || "",
              company: exp.company_name,
              duration: `${startYear} - ${endYear}`,
            };
          })
        : [],
      achievements: [], // We don't have achievements in the database schema
    }));

    return NextResponse.json({
      profiles: transformedProfiles,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}
