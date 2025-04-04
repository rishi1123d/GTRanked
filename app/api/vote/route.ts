import { NextResponse } from "next/server"
import { calculateElo } from "@/lib/elo"
import { mockProfiles } from "@/lib/mock-data"

export async function POST(request: Request) {
  try {
    const { winnerId, loserId } = await request.json()

    // Find profiles
    const winnerProfile = mockProfiles.find((p) => p.id === winnerId)
    const loserProfile = mockProfiles.find((p) => p.id === loserId)

    if (!winnerProfile || !loserProfile) {
      return NextResponse.json({ error: "One or both profiles not found" }, { status: 404 })
    }

    // Calculate new ELO ratings
    const newRatings = calculateElo(winnerProfile.elo, loserProfile.elo)

    // Update mock profiles (in a real app, this would update a database)
    winnerProfile.elo = newRatings.winner
    loserProfile.elo = newRatings.loser

    // In a real implementation, you would save these changes to a database

    return NextResponse.json({
      success: true,
      winner: {
        id: winnerProfile.id,
        name: winnerProfile.name,
        newElo: newRatings.winner,
        eloDiff: newRatings.winner - winnerProfile.elo,
      },
      loser: {
        id: loserProfile.id,
        name: loserProfile.name,
        newElo: newRatings.loser,
        eloDiff: newRatings.loser - loserProfile.elo,
      },
    })
  } catch (error) {
    console.error("Error processing vote:", error)
    return NextResponse.json({ error: "Failed to process vote" }, { status: 500 })
  }
}

