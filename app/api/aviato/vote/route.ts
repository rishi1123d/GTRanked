import { NextRequest, NextResponse } from 'next/server';

// For now, we'll store votes in memory
// Later this will be moved to Supabase
const votes: Array<{
  winnerId: string | null;
  loserId: string | null;
  timestamp: Date;
  userId?: string;
}> = [];

// Basic ELO calculation constants
const K_FACTOR = 32;
const DEFAULT_ELO = 1500;

// In-memory storage for ELO ratings
// Will be moved to Supabase later
const eloRatings = new Map<string, number>();

/**
 * Calculate new ELO ratings based on match outcome
 */
function calculateElo(winnerRating: number, loserRating: number): [number, number] {
  // Calculate expected scores
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
  
  // Calculate new ratings
  const newWinnerRating = winnerRating + K_FACTOR * (1 - expectedWinner);
  const newLoserRating = loserRating + K_FACTOR * (0 - expectedLoser);
  
  return [newWinnerRating, newLoserRating];
}

export async function POST(request: NextRequest) {
  try {
    const { winnerId, loserId, draw = false } = await request.json();
    
    if ((!winnerId && !draw) || !loserId) {
      return NextResponse.json(
        { error: 'Winner ID (or draw flag) and Loser ID are required' },
        { status: 400 }
      );
    }
    
    // Record the vote
    const vote = {
      winnerId: draw ? null : winnerId,
      loserId,
      timestamp: new Date(),
      // userId will be added when authentication is implemented
    };
    
    votes.push(vote);
    
    // If it's not a draw, update ELO ratings
    if (!draw) {
      // Get current ratings or use default
      const currentWinnerRating = eloRatings.get(winnerId) || DEFAULT_ELO;
      const currentLoserRating = eloRatings.get(loserId) || DEFAULT_ELO;
      
      // Calculate new ratings
      const [newWinnerRating, newLoserRating] = calculateElo(
        currentWinnerRating,
        currentLoserRating
      );
      
      // Update ratings
      eloRatings.set(winnerId, newWinnerRating);
      eloRatings.set(loserId, newLoserRating);
      
      // Return the updated ratings
      return NextResponse.json({
        success: true,
        vote,
        ratings: {
          [winnerId]: newWinnerRating,
          [loserId]: newLoserRating
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      vote
    });
  } catch (error: any) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record vote' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the most recent votes
    const recentVotes = votes.slice(0, 20);
    
    // Return the votes and current ELO ratings
    return NextResponse.json({
      votes: recentVotes,
      ratings: Object.fromEntries(eloRatings)
    });
  } catch (error: any) {
    console.error('Error fetching votes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch votes' },
      { status: 500 }
    );
  }
}
