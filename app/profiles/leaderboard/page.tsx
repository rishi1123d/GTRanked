"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Award, Trophy, Rocket, ArrowUp, ArrowDown } from "lucide-react"
import { useAviato } from "@/hooks/useAviato"
import { AvitoPersonProfile } from "@/lib/types/aviato"
import { toast } from "sonner"

export default function LeaderboardPage() {
  const { searchProfiles, loading, error } = useAviato()
  
  const [profiles, setProfiles] = useState<AvitoPersonProfile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<"elo" | "name">("elo")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Fetch profiles on initial load
  useEffect(() => {
    loadProfiles()
  }, [])

  // Show error toast if API request fails
  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error.message}`)
    }
  }, [error])

  // Load profiles from the API
  const loadProfiles = async () => {
    try {
      const results = await searchProfiles({
        limit: 50,
        sort: {
          field: sortField,
          direction: sortDirection,
        },
      })
      setProfiles(results.results)
    } catch (err) {
      console.error("Error fetching profiles:", err)
      toast.error("Failed to load profiles. Please try again.")
    }
  }

  // Handle search form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!searchQuery.trim()) {
        return loadProfiles()
      }
      
      const results = await searchProfiles({
        query: searchQuery,
        limit: 50,
        sort: {
          field: sortField,
          direction: sortDirection,
        },
      })
      
      setProfiles(results.results)
    } catch (err) {
      console.error("Error searching profiles:", err)
      toast.error("Search failed. Please try again.")
    }
  }

  // Handle sorting
  const handleSort = (field: "elo" | "name") => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      const newDirection = sortDirection === "desc" ? "asc" : "desc"
      setSortDirection(newDirection)
      
      // Re-sort the current profiles
      const sortedProfiles = [...profiles].sort((a, b) => {
        if (field === "elo") {
          return newDirection === "desc" 
            ? (b.elo || 1200) - (a.elo || 1200) 
            : (a.elo || 1200) - (b.elo || 1200)
        } else {
          return newDirection === "desc" 
            ? b.name.localeCompare(a.name) 
            : a.name.localeCompare(b.name)
        }
      })
      
      setProfiles(sortedProfiles)
    } else {
      // New field, set to default sort (desc for elo, asc for name)
      const newDirection = field === "elo" ? "desc" : "asc"
      setSortField(field)
      setSortDirection(newDirection)
      
      // Re-sort the current profiles
      const sortedProfiles = [...profiles].sort((a, b) => {
        if (field === "elo") {
          return newDirection === "desc" 
            ? (b.elo || 1200) - (a.elo || 1200) 
            : (a.elo || 1200) - (b.elo || 1200)
        } else {
          return newDirection === "desc" 
            ? b.name.localeCompare(a.name) 
            : a.name.localeCompare(b.name)
        }
      })
      
      setProfiles(sortedProfiles)
    }
  }

  // Get medal color for top 3 positions
  const getMedalColor = (index: number) => {
    if (index === 0) return "text-yellow-500"
    if (index === 1) return "text-gray-400"
    if (index === 2) return "text-amber-700"
    return ""
  }

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
                className="text-sm font-medium text-gray-600 hover:text-yellow-700 hover:underline decoration-2 underline-offset-4 decoration-yellow-500 transition-colors"
              >
                Vote
              </Link>
              <Link
                href="/profiles/leaderboard"
                className="text-sm font-medium text-yellow-700 underline decoration-2 underline-offset-4 decoration-yellow-500"
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
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-800 mb-2">
              Georgia Tech Top Profiles
            </h1>
            <p className="text-gray-600 max-w-2xl">
              Browse and discover top-ranked Georgia Tech students and alumni. Rankings are determined by ELO rating
              system based on votes.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm">
            <Rocket className="h-5 w-5 text-yellow-600" />
            <span className="text-gray-500">Data powered by Aviato</span>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search profiles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl bg-gray-50 border-gray-100 focus-visible:ring-yellow-500"
                />
              </div>
              <Button 
                type="submit" 
                className="rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
              >
                Search
              </Button>
            </form>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <h2 className="text-xl font-bold">Top Ranked Profiles</h2>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Sort by:</span>
                <Button
                  variant="ghost"
                  className={`rounded-full px-3 ${
                    sortField === "elo" ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" : ""
                  }`}
                  onClick={() => handleSort("elo")}
                >
                  Ranking
                  {sortField === "elo" && (
                    sortDirection === "desc" ? 
                      <ArrowDown className="ml-1 h-3 w-3" /> : 
                      <ArrowUp className="ml-1 h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className={`rounded-full px-3 ${
                    sortField === "name" ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" : ""
                  }`}
                  onClick={() => handleSort("name")}
                >
                  Name
                  {sortField === "name" && (
                    sortDirection === "desc" ? 
                      <ArrowDown className="ml-1 h-3 w-3" /> : 
                      <ArrowUp className="ml-1 h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
              </div>
            ) : profiles.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <div className="mb-4">
                  <Trophy className="h-12 w-12 mx-auto text-gray-300" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">No profiles found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? "Try a different search term" : "There are no profiles to display yet"}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setSearchQuery("")
                      loadProfiles()
                    }}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">Name</div>
                  <div className="col-span-3">Education</div>
                  <div className="col-span-3">Work</div>
                </div>

                <div className="divide-y divide-gray-100">
                  {profiles.map((profile, index) => (
                    <div
                      key={profile.id}
                      className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="col-span-1 flex items-center">
                        {index < 3 ? (
                          <div className={`flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 ${getMedalColor(index)}`}>
                            <Trophy className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-700 font-medium">
                            {index + 1}
                          </div>
                        )}
                      </div>

                      <div className="col-span-5 flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold">
                            {profile.name.charAt(0)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white flex items-center justify-center">
                            <div className={`text-xs font-medium ${index < 20 ? "text-yellow-600" : "text-gray-600"}`}>
                              {profile.elo || 1200}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{profile.name}</div>
                          <div className="text-sm text-gray-500">
                            {profile.title || (profile.education?.[0]?.fieldOfStudy ? `${profile.education[0].fieldOfStudy} Student` : "Student")}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center">
                        {profile.education?.[0] ? (
                          <div>
                            <div className="text-sm font-medium">
                              {profile.education[0].institution}
                            </div>
                            <div className="text-xs text-gray-500">
                              {profile.education[0].degree} {profile.education[0].fieldOfStudy ? `in ${profile.education[0].fieldOfStudy}` : ""}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Georgia Tech</span>
                        )}
                      </div>

                      <div className="col-span-3 flex items-center">
                        {profile.experience?.[0] ? (
                          <div>
                            <div className="text-sm font-medium">
                              {profile.experience[0].company}
                            </div>
                            <div className="text-xs text-gray-500">
                              {profile.experience[0].title}
                            </div>
                          </div>
                        ) : profile.company ? (
                          <div>
                            <div className="text-sm font-medium">
                              {profile.company}
                            </div>
                            <div className="text-xs text-gray-500">
                              {profile.title || "Professional"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Student</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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
