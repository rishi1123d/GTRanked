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
  // Winner gets 1 for winning, loser gets 0 - standard ELO formula
  const newWinnerRating = Math.round(winnerRating + kFactor * (1 - expectedWinner))
  const newLoserRating = Math.round(loserRating + kFactor * (0 - expectedLoser))

  return {
    winner: newWinnerRating,
    loser: newLoserRating,
  }
}

/**
 * Calculate ELO rating updates for two players based on actual outcome
 * @param playerARating Rating of first player
 * @param playerBRating Rating of second player
 * @param outcome 1 if A wins, 0 if B wins, 0.5 for draw
 * @param kFactor K-factor determines how much ratings change (default: 32)
 * @returns Object with new ratings for both players
 */
export function calculateEloWithOutcome(playerARating: number, playerBRating: number, outcome: number, kFactor = 32) {
  // Calculate expected scores (probability of winning)
  const expectedA = 1 / (1 + Math.pow(10, (playerBRating - playerARating) / 400))
  const expectedB = 1 / (1 + Math.pow(10, (playerARating - playerBRating) / 400))
  
  // Calculate new ratings
  const newPlayerARating = Math.round(playerARating + kFactor * (outcome - expectedA))
  const newPlayerBRating = Math.round(playerBRating + kFactor * ((1 - outcome) - expectedB))
  
  return {
    playerA: newPlayerARating,
    playerB: newPlayerBRating,
  }
}

/**
 * Initialize a new ELO rating for a player
 * @returns Default starting ELO rating
 */
export function getInitialElo() {
  return 1500 // Standard starting ELO
}

