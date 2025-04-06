"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Rocket, Trophy, Vote } from "lucide-react";
import { ProfileComparison } from "@/components/profile-comparison";
import { v4 as uuidv4 } from "uuid";

// Add a declaration for uuid
declare module 'uuid';

// Define types
interface ProfileType {
  id: string;
  name: string;
  title: string;
  company: string;
  degree: string;
  major: string;
  graduationYear: number;
  isStudent: boolean;
  elo: number;
  skills: string[];
  experiences: {
    title: string;
    company: string;
    duration: string;
  }[];
  education?: {
    profile_id: string;
    school_id: string;
    school_name: string;
    degree: string;
    field_of_study: string;
    start_date: string | null;
    end_date: string | null;
  }[];
  achievements?: {
    title: string;
    description?: string;
  }[];
  linkedinUrl?: string;
}

interface VoteHistoryItem {
  winner_id: string | null;
  left_profile_id: string;
  right_profile_id: string;
  created_at: string;
  left_profile_name: string;
  right_profile_name: string;
  winner_name: string | null;
}

// Generate a session ID for the user if they don't have one
const getOrCreateSessionId = (): string => {
  if (typeof window !== "undefined") {
    let sessionId = localStorage.getItem("voter_session_id");
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem("voter_session_id", sessionId);
    }
    return sessionId;
  }
  return ""; // Return empty string for SSR
};

export default function VotePage() {
  const [leftProfile, setLeftProfile] = useState<ProfileType | null>(null);
  const [rightProfile, setRightProfile] = useState<ProfileType | null>(null);
  const [votingHistory, setVotingHistory] = useState<VoteHistoryItem[]>([]);
  const [votesCount, setVotesCount] = useState(0);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState("");

  // Get recent votes from the API
  const fetchRecentVotes = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/votes?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setVotingHistory(data.votes || []);
        setVotesCount(data.votes?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching votes:", error);
    }
  };

  // Get new random profiles from the API
  const getNewProfiles = async () => {
    try {
      setIsLoading(true);

      // Get excluded IDs from recent votes
      const recentProfileIds = votingHistory
        .slice(0, 3)
        .flatMap((vote) => [vote.left_profile_id, vote.right_profile_id]);

      // Get new profiles from API
      const response = await fetch(
        `/api/profiles/random?exclude=${recentProfileIds.join(",")}`
      );
      if (response.ok) {
        const { profiles } = await response.json();
        if (profiles && profiles.length >= 2) {
          setLeftProfile(profiles[0]);
          setRightProfile(profiles[1]);
        }
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setIsLoading(false);
      setIsPredicting(false);
    }
  };

  const handleVote = async (winnerId: string | null) => {
    if (!leftProfile || !rightProfile || !sessionId) return;

    setIsPredicting(true);

    try {
      // Send vote to the API
      const loserId =
        winnerId === leftProfile.id ? rightProfile.id : leftProfile.id;

      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerId: winnerId, // Can be null for a tie
          loserId: loserId,
          sessionId: sessionId,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Update voting history with the new vote
        setVotingHistory((prev) => [
          {
            winner_id: winnerId,
            left_profile_id: leftProfile.id,
            right_profile_id: rightProfile.id,
            created_at: new Date().toISOString(),
            // Add names for display purposes
            left_profile_name: leftProfile.name,
            right_profile_name: rightProfile.name,
            winner_name: winnerId
              ? winnerId === leftProfile.id
                ? leftProfile.name
                : rightProfile.name
              : null,
          },
          ...prev,
        ]);

        setVotesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  const handleNextComparison = async (
    leftProfilePrefetch?: ProfileType,
    rightProfilePrefetch?: ProfileType
  ) => {
    // If prefetched profiles are provided, use them directly
    if (leftProfilePrefetch && rightProfilePrefetch) {
      console.log("Using prefetched profiles for next comparison");
      setLeftProfile(leftProfilePrefetch);
      setRightProfile(rightProfilePrefetch);
      setIsPredicting(false);
      setIsLoading(false);
    } else {
      // Otherwise fetch new profiles
      console.log("No prefetched profiles available, fetching new profiles");
      await getNewProfiles();
    }
  };

  // Initialize on first render
  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);

    if (sid) {
      fetchRecentVotes(sid);
      getNewProfiles();
    }
  }, []);

  // If we're still loading, show a loading state
  if (isLoading || !leftProfile || !rightProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-yellow-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b">
        <div className="container flex items-center justify-between h-16 px-4 md:px-6 max-w-full">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-800">
              GT Ranked
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6">
              <Link
                href="/vote"
                className="text-sm font-medium text-yellow-700 underline decoration-2 underline-offset-4 decoration-yellow-500"
              >
                Vote
              </Link>
              <Link
                href="/leaderboard"
                className="text-sm font-medium text-gray-600 hover:text-yellow-700 hover:underline decoration-2 underline-offset-4 decoration-yellow-500 transition-colors"
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

      <div className="container py-8 px-4 md:px-6 max-w-full w-full">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 max-w-[1920px] mx-auto">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-800 mb-2">
              Who has the stronger profile?
            </h1>
            <p className="text-gray-600 max-w-xl">
              Vote for the profile you think is stronger. Your votes help
              determine the ELO rankings of GT students and alumni.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm">
            <Vote className="h-5 w-5 text-yellow-600" />
            <span className="font-medium">{votesCount}</span>
            <span className="text-gray-500">votes cast</span>
          </div>
        </div>

        <div className="flex justify-center mb-8 max-w-[1920px] mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-full py-2 px-4 text-sm text-gray-600 flex items-center gap-2 shadow-sm">
            <Rocket className="h-4 w-4 text-yellow-600" />
            <span>Data powered by Aviato</span>
            <Link
              href="#"
              className="text-yellow-600 ml-1 flex items-center hover:underline"
            >
              Learn more here →
            </Link>
          </div>
        </div>

        <div className="mb-12 max-w-[1920px] mx-auto">
          <ProfileComparison
            leftProfile={leftProfile}
            rightProfile={rightProfile}
            onVote={handleVote}
            showResults={isPredicting}
            onNextComparison={handleNextComparison}
          />
        </div>

        {votingHistory.length > 0 && (
          <div className="max-w-[1920px] mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <h2 className="text-xl font-bold">Your Recent Votes</h2>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {votingHistory.slice(0, 5).map((vote, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {vote.left_profile_name}
                          </span>
                          <span className="text-gray-400">vs</span>
                          <span className="font-medium">
                            {vote.right_profile_name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {vote.winner_id
                            ? `You voted for ${vote.winner_name}`
                            : "You voted Equal"}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Intl.DateTimeFormat("en-US", {
                          hour: "numeric",
                          minute: "numeric",
                          hour12: true,
                        }).format(new Date(vote.created_at))}
                      </div>
                    </div>
                  </div>
                ))}
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
        <div className="container px-4 md:px-6 max-w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1920px] mx-auto">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-800 mb-1">
                GT Ranked
              </span>
              <p className="text-sm text-gray-500">
                Ranking Georgia Tech's network using the ELO system
              </p>
            </div>

            <div className="flex gap-6">
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-yellow-600"
              >
                Home
              </Link>
              <Link
                href="/vote"
                className="text-sm text-gray-500 hover:text-yellow-600"
              >
                Vote
              </Link>
              <Link
                href="/leaderboard"
                className="text-sm text-gray-500 hover:text-yellow-600"
              >
                Leaderboard
              </Link>
            </div>

            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} GT Ranked. Data powered by
              Aviato API
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
