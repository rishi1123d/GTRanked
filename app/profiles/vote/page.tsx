"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Rocket, Trophy, Vote } from "lucide-react"
import { ProfileComparison } from "@/components/profile-comparison"
import { useAviato } from "@/hooks/useAviato"
import { AvitoPersonProfile } from "@/lib/types/aviato"
import { toast } from "sonner"

export default function ProfileVotePage() {
  const {
    getProfilesForComparison,
    submitVote,
    loading,
    error
  } = useAviato({ initialLoading: true })

  const [leftProfile, setLeftProfile] = useState<AvitoPersonProfile | null>(null)
  const [rightProfile, setRightProfile] = useState<AvitoPersonProfile | null>(null)
  const [votingHistory, setVotingHistory] = useState<
    Array<{
      winner: string | null
      profiles: [string, string]
      timestamp: Date
    }>
  >([])
  const [votesCount, setVotesCount] = useState(0)
  const [compareLoading, setCompareLoading] = useState(true)

  // Get new random profiles that haven't been compared recently
  const getNewProfiles = async () => {
    try {
      setCompareLoading(true)
      
      // Get recent profile IDs to exclude from the comparison
      const recentProfileIds = votingHistory.slice(0, 3).flatMap((vote) => vote.profiles)
      
      // Get new profiles for comparison
      const [newLeftProfile, newRightProfile] = await getProfilesForComparison(recentProfileIds)
      
      setLeftProfile(newLeftProfile)
      setRightProfile(newRightProfile)
    } catch (err) {
      console.error("Error getting profiles for comparison:", err)
      toast.error("Failed to load profiles for comparison. Please try again.")
    } finally {
      setCompareLoading(false)
    }
  }

  const handleVote = async (winnerId: string | null) => {
    if (!leftProfile || !rightProfile) return
    
    try {
      // Record the vote in history
      setVotingHistory((prev) => [
        {
          winner: winnerId,
          profiles: [leftProfile.id, rightProfile.id],
          timestamp: new Date(),
        },
        ...prev,
      ])

      setVotesCount((prev) => prev + 1)

      // Submit vote to API
      if (winnerId !== null) {
        const loserId = winnerId === leftProfile.id ? rightProfile.id : leftProfile.id
        await submitVote(winnerId, loserId)
      } else {
        // Handle draw (equal vote)
        await submitVote(null, leftProfile.id === rightProfile.id ? leftProfile.id : rightProfile.id)
      }

      // Get new profiles for comparison
      getNewProfiles()
    } catch (err) {
      console.error("Error submitting vote:", err)
      toast.error("Failed to submit your vote. Please try again.")
    }
  }

  // Get initial profiles on first render
  useEffect(() => {
    getNewProfiles()
  }, [])

  // Show error if API request fails
  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error.message}`)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b">
        <div className="container flex items-center justify-between h-16 px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-800">
              GT Ranked
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6">
              <Link
                href="/profiles/vote"
                className="text-sm font-medium text-yellow-700 underline decoration-2 underline-offset-4 decoration-yellow-500"
              >
                Vote
              </Link>
              <Link
                href="/profiles/leaderboard"
                className="text-sm font-medium text-gray-600 hover:text-yellow-700 hover:underline decoration-2 underline-offset-4 decoration-yellow-500 transition-colors"
              >
                Leaderboard
              </Link>
            </div>
            <Link href="/auth/sign-in">
              <Button variant="outline" className="rounded-full">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-800 mb-2">
              Who has the stronger profile?
            </h1>
            <p className="text-gray-600 max-w-xl">
              Vote for the profile you think is stronger. Your votes help determine the ELO rankings of GT students and
              alumni.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm">
            <Vote className="h-5 w-5 text-yellow-600" />
            <span className="font-medium">{votesCount}</span>
            <span className="text-gray-500">votes cast</span>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-full py-2 px-4 text-sm text-gray-600 flex items-center gap-2 shadow-sm">
            <Rocket className="h-4 w-4 text-yellow-600" />
            <span>Data powered by Aviato</span>
            <Link href="#" className="text-yellow-600 ml-1 flex items-center hover:underline">
              Learn more here →
            </Link>
          </div>
        </div>

        <div className="mb-12">
          {compareLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            </div>
          ) : (
            leftProfile && rightProfile && (
              <ProfileComparison leftProfile={leftProfile} rightProfile={rightProfile} onVote={handleVote} />
            )
          )}
        </div>

        {votingHistory.length > 0 && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <h2 className="text-xl font-bold">Your Recent Votes</h2>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {votingHistory.slice(0, 5).map((vote, index) => {
                  const [leftId, rightId] = vote.profiles
                  
                  // Find profiles that match the IDs in the voting history
                  const leftProfileData = leftId === leftProfile?.id ? leftProfile : 
                                           leftId === rightProfile?.id ? rightProfile : null
                  const rightProfileData = rightId === leftProfile?.id ? leftProfile : 
                                           rightId === rightProfile?.id ? rightProfile : null
                  
                  // Determine the winner profile
                  const winnerProfile = vote.winner ? 
                    (vote.winner === leftId ? leftProfileData : rightProfileData) : null

                  return (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{leftProfileData?.name || "Unknown Profile"}</span>
                            <span className="text-gray-400">vs</span>
                            <span className="font-medium">{rightProfileData?.name || "Unknown Profile"}</span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {winnerProfile ? `You voted for ${winnerProfile.name}` : "You voted Equal"}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Intl.DateTimeFormat("en-US", {
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          }).format(vote.timestamp)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {votingHistory.length > 5 && (
                <div className="p-3 bg-gray-50 text-center">
                  <Button variant="link" className="text-yellow-600">
                    View all {votingHistory.length} votes
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-auto border-t py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-800 mb-1">
                GT Ranked
              </span>
              <p className="text-sm text-gray-500">Ranking Georgia Tech's network using the ELO system</p>
            </div>

            <div className="flex gap-6">
              <Link href="/" className="text-sm text-gray-500 hover:text-yellow-600">
                Home
              </Link>
              <Link href="/profiles/vote" className="text-sm text-gray-500 hover:text-yellow-600">
                Vote
              </Link>
              <Link href="/profiles/leaderboard" className="text-sm text-gray-500 hover:text-yellow-600">
                Leaderboard
              </Link>
            </div>

            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} GT Ranked. Data powered by Aviato API
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
