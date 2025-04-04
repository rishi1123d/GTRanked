/**
 * Calculate new ELO ratings for two players after a match
 * @param winnerRating Current ELO rating of the winner
 * @param loserRating Current ELO rating of the loser
 * @param kFactor K-factor determines how much ratings change (default: 32)
 * @returns Object with new ratings for both players
 */
export function calculateElo(winnerRating: number, loserRating: number, kFactor = 32) {
  // Calculate expected scores (probability of winning)
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400))
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400))

  // Calculate new ratings
  const newWinnerRating = Math.round(winnerRating + kFactor * (1 - expectedWinner))
  const newLoserRating = Math.round(loserRating + kFactor * (0 - expectedLoser))

  return {
    winner: newWinnerRating,
    loser: newLoserRating,
  }
}

/**
 * Initialize a new ELO rating for a player
 * @returns Default starting ELO rating
 */
export function getInitialElo() {
  return 1500 // Standard starting ELO
}

