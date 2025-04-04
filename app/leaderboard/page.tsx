"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, ArrowUpDown, ExternalLink, Info, Trophy } from "lucide-react"
import { mockProfiles } from "@/lib/mock-data"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function LeaderboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("elo")
  const [filterBy, setFilterBy] = useState("all")

  // Sort and filter profiles
  const sortedProfiles = [...mockProfiles]
    .filter((profile) => {
      // Filter by search query
      if (searchQuery) {
        return (
          profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.company.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      // Filter by category
      if (filterBy === "all") return true
      if (filterBy === "students") return profile.isStudent
      if (filterBy === "alumni") return !profile.isStudent
      if (filterBy === "cs") return profile.major === "Computer Science"

      return true
    })
    .sort((a, b) => {
      if (sortBy === "elo") return b.elo - a.elo
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "graduation") return a.graduationYear - b.graduationYear
      return 0
    })

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
                href="/vote"
                className="text-sm font-medium text-gray-600 hover:text-yellow-700 hover:underline decoration-2 underline-offset-4 decoration-yellow-500 transition-colors"
              >
                Vote
              </Link>
              <Link
                href="/leaderboard"
                className="text-sm font-medium text-yellow-700 underline decoration-2 underline-offset-4 decoration-yellow-500"
              >
                Leaderboard
              </Link>
            </div>
            <Link href="/sign-in">
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
              GT Ranked Leaderboard
            </h1>
            <p className="text-gray-600 max-w-xl">
              Browse the top-ranked Georgia Tech students and alumni based on ELO ratings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full py-2 px-4 text-sm text-gray-600 flex items-center gap-2 shadow-sm">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <span>Top Profiles</span>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                    <Info className="h-4 w-4" />
                    <span className="sr-only">ELO Info</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-white rounded-xl p-3 shadow-lg border border-gray-100 max-w-xs">
                  <p className="text-sm text-gray-600">
                    ELO is a rating system that calculates relative skill levels. Higher ELO indicates a stronger
                    profile based on community votes.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-full py-2 px-4 text-sm text-gray-600 flex items-center gap-2 shadow-sm">
            <span className="text-xs">🚀</span>
            <span>Data powered by Aviato</span>
            <Link href="#" className="text-yellow-600 ml-1 flex items-center hover:underline">
              Learn more here →
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search by name, title, or company..."
              className="pl-10 bg-white rounded-full border-gray-200 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-full md:w-[180px] bg-white rounded-full border-gray-200 h-12">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Profiles</SelectItem>
              <SelectItem value="students">Current Students</SelectItem>
              <SelectItem value="alumni">Alumni</SelectItem>
              <SelectItem value="cs">Computer Science</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px] bg-white rounded-full border-gray-200 h-12">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="elo">Highest ELO</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="graduation">Graduation Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-gray-500 border-b">
            <div className="col-span-1 flex items-center">Rank</div>
            <div className="col-span-5 md:col-span-3 flex items-center">Name</div>
            <div className="hidden md:flex md:col-span-3 items-center">Education/Position</div>
            <div className="hidden md:flex md:col-span-3 items-center">Experience</div>
            <div className="col-span-6 md:col-span-2 flex items-center justify-end">
              <Button variant="ghost" size="sm" className="h-8 gap-1 rounded-full">
                ELO <ArrowUpDown className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {sortedProfiles.map((profile, index) => (
            <div
              key={profile.id}
              className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors border-b last:border-0"
            >
              <div className="col-span-1 font-semibold text-gray-500">{index + 1}</div>
              <div className="col-span-5 md:col-span-3 flex items-center gap-3">
                <Avatar className="bg-gradient-to-br from-indigo-400 to-purple-500">
                  <AvatarFallback className="text-white font-light">{profile.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-xs text-gray-500">{profile.graduationYear}</p>
                </div>
              </div>
              <div className="hidden md:block md:col-span-3">
                <p className="font-medium">{profile.major}</p>
                <p className="text-sm text-gray-500">{profile.isStudent ? "Student" : "Alumni"}</p>
              </div>
              <div className="hidden md:block md:col-span-3">
                <p className="font-medium">{profile.title}</p>
                <p className="text-sm text-gray-500">{profile.company}</p>
              </div>
              <div className="col-span-6 md:col-span-2 text-right">
                <p className="font-bold text-yellow-600">{profile.elo}</p>
                <Button variant="ghost" size="sm" className="h-6 text-xs rounded-full">
                  View Profile <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-auto border-t py-8 bg-white">
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
              <Link href="/vote" className="text-sm text-gray-500 hover:text-yellow-600">
                Vote
              </Link>
              <Link href="/leaderboard" className="text-sm text-gray-500 hover:text-yellow-600">
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

