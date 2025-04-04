import { NextResponse } from "next/server"
import { recordVote, getProfileById } from "@/lib/profiles"
import { calculateElo } from "@/lib/elo"

export async function POST(request: Request) {
  try {
    const { winnerId, loserId, sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    // Convert IDs to numbers (they come as strings from frontend)
    const winnerIdNum = winnerId ? parseInt(winnerId, 10) : null
    const loserIdNum = parseInt(loserId, 10)

    // For ties, winnerId will be null
    const leftProfileId = winnerIdNum || loserIdNum
    const rightProfileId = winnerIdNum === leftProfileId ? loserIdNum : leftProfileId
    
    // Record the vote in Supabase
    // This will trigger the ELO update function automatically
    await recordVote(leftProfileId, rightProfileId, winnerIdNum, sessionId)
    
    // Get the updated profiles to return the new ELO ratings
    const leftProfile = await getProfileById(leftProfileId)
    const rightProfile = await getProfileById(rightProfileId)
    
    if (!leftProfile || !rightProfile) {
      return NextResponse.json({ error: "One or both profiles not found" }, { status: 404 })
    }

    // In case of a tie, both are considered neither winner nor loser
    if (winnerIdNum === null) {
      return NextResponse.json({
        success: true,
        tie: true,
        profiles: [
          {
            id: leftProfile.id,
            name: leftProfile.full_name,
            elo: leftProfile.elo_rating
          },
          {
            id: rightProfile.id,
            name: rightProfile.full_name,
            elo: rightProfile.elo_rating
          }
        ]
      })
    }

    // Determine which is winner and which is loser
    const winner = winnerIdNum === leftProfile.id ? leftProfile : rightProfile
    const loser = winnerIdNum === leftProfile.id ? rightProfile : leftProfile
    
    return NextResponse.json({
      success: true,
      winner: {
        id: winner.id,
        name: winner.full_name,
        elo: winner.elo_rating
      },
      loser: {
        id: loser.id,
        name: loser.full_name,
        elo: loser.elo_rating
      }
    })
  } catch (error) {
    console.error("Error processing vote:", error)
    return NextResponse.json({ error: "Failed to process vote" }, { status: 500 })
  }
}
