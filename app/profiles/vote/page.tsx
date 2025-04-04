"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Rocket, Trophy, Vote } from "lucide-react"
import { ProfileComparison } from "@/components/profile-comparison"
import { mockProfiles } from "@/lib/mock-data"

export default function ProfileVotePage() {
  const [leftProfile, setLeftProfile] = useState(mockProfiles[0])
  const [rightProfile, setRightProfile] = useState(mockProfiles[1])
  const [votingHistory, setVotingHistory] = useState<
    Array<{
      winner: string | null
      profiles: [string, string]
      timestamp: Date
    }>
  >([])
  const [votesCount, setVotesCount] = useState(0)

  // Get new random profiles that haven't been compared recently
  const getNewProfiles = () => {
    // Filter out profiles that were in the last 3 comparisons
    const recentProfileIds = votingHistory.slice(0, 3).flatMap((vote) => vote.profiles)

    const availableProfiles = mockProfiles.filter((p) => !recentProfileIds.includes(p.id))

    // If we have less than 2 available profiles, just use all profiles
    const profilePool = availableProfiles.length >= 2 ? availableProfiles : mockProfiles

    // Get two random profiles
    const shuffled = [...profilePool].sort(() => 0.5 - Math.random())
    setLeftProfile(shuffled[0])
    setRightProfile(shuffled[1])
  }

  const handleVote = async (winnerId: string | null) => {
    // Record the vote
    setVotingHistory((prev) => [
      {
        winner: winnerId,
        profiles: [leftProfile.id, rightProfile.id],
        timestamp: new Date(),
      },
      ...prev,
    ])

    setVotesCount((prev) => prev + 1)

    // In a real app, we would call the API to update ELO ratings
    // if (winnerId !== null) {
    //   const loserId = winnerId === leftProfile.id ? rightProfile.id : leftProfile.id;
    //   await fetch('/api/vote', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ winnerId, loserId })
    //   });
    // }

    // Get new profiles for comparison
    getNewProfiles()
  }

  // Get initial profiles on first render
  useEffect(() => {
    getNewProfiles()
  }, [])

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
          <ProfileComparison leftProfile={leftProfile} rightProfile={rightProfile} onVote={handleVote} />
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
                  const leftProfileData = mockProfiles.find((p) => p.id === leftId)
                  const rightProfileData = mockProfiles.find((p) => p.id === rightId)
                  const winnerProfile = vote.winner ? mockProfiles.find((p) => p.id === vote.winner) : null

                  return (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{leftProfileData?.name}</span>
                            <span className="text-gray-400">vs</span>
                            <span className="font-medium">{rightProfileData?.name}</span>
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
