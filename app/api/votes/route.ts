import { NextResponse } from "next/server";
import { getRecentVotes, getProfileById } from "@/lib/profiles";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get votes from DB
    const votes = await getRecentVotes(sessionId, limit);

    // Enhance vote data with profile names
    const votesWithNames = await Promise.all(
      votes.map(async (vote) => {
        const leftProfile = await getProfileById(vote.left_profile_id);
        const rightProfile = await getProfileById(vote.right_profile_id);

        let winnerName = null;
        if (vote.winner_id) {
          if (vote.winner_id === vote.left_profile_id) {
            winnerName = leftProfile?.full_name;
          } else {
            winnerName = rightProfile?.full_name;
          }
        }

        return {
          ...vote,
          left_profile_name: leftProfile?.full_name || "Unknown",
          right_profile_name: rightProfile?.full_name || "Unknown",
          winner_name: winnerName,
        };
      })
    );

    return NextResponse.json({
      votes: votesWithNames,
      total: votesWithNames.length,
    });
  } catch (error) {
    console.error("Error fetching votes:", error);
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    );
  }
}
