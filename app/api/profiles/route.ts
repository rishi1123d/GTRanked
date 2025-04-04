import { NextResponse } from "next/server"
import { getProfiles } from "@/lib/profiles"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") || ""
  const filter = searchParams.get("filter") || "all"
  const sort = searchParams.get("sort") || "elo"
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "10")

  try {
    // Get profiles from Supabase
    const { profiles, total, totalPages } = await getProfiles({
      page,
      limit,
      query,
      filter,
      sort
    });

    // Transform the data to match the existing format that the frontend expects
    const transformedProfiles = profiles.map(profile => ({
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
      githubUrl: profile.github_url || null
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
