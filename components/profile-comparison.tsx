"use client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { ProfileType } from "@/lib/types"
import { ChevronRight, CheckCircle2, XCircle } from "lucide-react"
import { useState, useEffect, useRef } from "react"

interface ProfileComparisonProps {
  leftProfile: ProfileType
  rightProfile: ProfileType
  onVote: (winnerId: string | null) => void
  showResults?: boolean
  onNextComparison?: (leftProfile?: ProfileType, rightProfile?: ProfileType) => void
}

export function ProfileComparison({ 
  leftProfile, 
  rightProfile, 
  onVote,
  showResults: externalShowResults = false,
  onNextComparison
}: ProfileComparisonProps) {
  const [prediction, setPrediction] = useState<string | null>(null);
  const [internalShowResults, setInternalShowResults] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [nextProfiles, setNextProfiles] = useState<{ leftProfile: ProfileType, rightProfile: ProfileType } | null>(null);
  const prefetchingRef = useRef(false);
  
  // Combine external and internal show results
  const showResults = externalShowResults || internalShowResults;
  
  // Function to prefetch the next set of profiles
  const prefetchNextProfiles = async () => {
    if (prefetchingRef.current) return; // Prevent multiple prefetch requests
    
    prefetchingRef.current = true;
    console.log("Prefetching next profiles...");
    
    try {
      // Get the current profile IDs to exclude them from the next fetch
      const excludeIds = [leftProfile.id, rightProfile.id].filter(Boolean).join(',');
      const response = await fetch(`/api/profiles/random?exclude=${excludeIds}`);
      
      if (response.ok) {
        const data = await response.json();
        // Fixed: Check if data.profiles exists and has at least 2 profiles
        if (data.profiles && data.profiles.length >= 2) {
          setNextProfiles({
            leftProfile: data.profiles[0],
            rightProfile: data.profiles[1]
          });
          console.log("Successfully prefetched next profiles");
        } else {
          console.log("Not enough profiles returned for prefetching", data);
        }
      } else {
        console.error("Failed to prefetch profiles:", await response.text());
      }
    } catch (error) {
      console.error("Error prefetching profiles:", error);
    } finally {
      prefetchingRef.current = false;
    }
  };
  
  useEffect(() => {
    // Reset prediction when profiles change
    if (!externalShowResults) {
      setPrediction(null);
      setInternalShowResults(false);
      setCountdown(5);
      setNextProfiles(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [leftProfile.id, rightProfile.id, externalShowResults]);
  
  // Start countdown when results are shown and trigger prefetch
  useEffect(() => {
    // Only start countdown if the user has made a prediction (voted)
    // This ensures we don't automatically navigate without user interaction
    if (showResults && countdown > 0 && prediction !== null) {
      // Start prefetching when the countdown begins (and we don't already have prefetched profiles)
      if (!nextProfiles && !prefetchingRef.current && countdown === 5) {
        prefetchNextProfiles();
      }
      
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // When countdown reaches 0, clear interval and go to next comparison
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            handleNextClick();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [showResults, countdown, nextProfiles, prediction]);
  
  const handlePrediction = (profileId: string | null) => {
    setPrediction(profileId);
    setInternalShowResults(true);
    setCountdown(5);
    onVote(profileId);
  };
  
  const isCorrectPrediction = () => {
    if (prediction === null) return false; // Equal prediction
    
    if (leftProfile.elo === rightProfile.elo) {
      // If ELO scores are equal, the "Equal" prediction was correct
      return prediction === null;
    }
    
    const higherEloProfile = leftProfile.elo > rightProfile.elo ? leftProfile.id : rightProfile.id;
    return prediction === higherEloProfile;
  };
  
  const handleNextClick = () => {
    // If we have prefetched profiles, use them directly
    if (nextProfiles) {
      // Replace the current profiles with the prefetched ones
      if (onNextComparison) {
        // Providing the prefetched profiles to the parent component
        onNextComparison(nextProfiles.leftProfile, nextProfiles.rightProfile);
      }
      // Reset state
      setNextProfiles(null);
      setInternalShowResults(false);
      setPrediction(null);
      setCountdown(5);
    } else {
      // Fall back to regular behavior if prefetched profiles aren't available
      if (onNextComparison) {
        onNextComparison();
      } else {
        // Fallback to internal state reset
        setInternalShowResults(false);
        setPrediction(null);
        setCountdown(5);
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-4 lg:gap-6 relative py-4 min-h-[50vh] px-2">
      {/* Countdown Timer */}
      {showResults && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-white rounded-full shadow-md px-4 py-2 border border-yellow-100">
            <div className="text-sm font-medium text-gray-700 flex items-center">
              <span>Next in </span>
              <span className="inline-flex justify-center items-center bg-yellow-50 text-yellow-700 rounded-full w-7 h-7 font-bold mx-1">
                {countdown}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Left Profile */}
      <div
        className={`flex-1 bg-white rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 border cursor-pointer transform ${
          showResults && prediction === leftProfile.id 
            ? (isCorrectPrediction() 
                ? "border-green-300 shadow-lg" 
                : "border-red-300 shadow-lg")
            : "border-gray-100 hover:border-yellow-300 hover:scale-[1.02]"
        } overflow-y-auto max-h-[calc(100vh-150px)] h-full`}
        onClick={() => !showResults && handlePrediction(leftProfile.id)}
      >
        {showResults && prediction === leftProfile.id && (
          <div className="absolute top-4 right-4 z-10">
            {isCorrectPrediction() ? (
              <div className="bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-medium flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Correct!
              </div>
            ) : (
              <div className="bg-red-100 text-red-700 rounded-full px-3 py-1 text-sm font-medium flex items-center">
                <XCircle className="w-4 h-4 mr-1" />
                Wrong
              </div>
            )}
          </div>
        )}
        
        <ProfileDisplay profile={leftProfile} showElo={showResults} />
        
        {!showResults && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Button
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl h-12"
              onClick={(e) => {
                e.stopPropagation()
                handlePrediction(leftProfile.id)
              }}
            >
              Vote for this profile
            </Button>
          </div>
        )}
      </div>

      {/* Center Voting Controls */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex flex-col items-center">
        <div className="bg-white rounded-full shadow-lg p-1">
          <Button
            onClick={() => !showResults && handlePrediction(null)}
            variant="ghost"
            className="rounded-full h-12 w-12 lg:h-14 lg:w-14 font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            disabled={showResults}
          >
            Equal
          </Button>
        </div>
      </div>

      {/* Mobile Voting Controls */}
      <div className="flex md:hidden justify-center my-2">
        <div className="bg-white rounded-full shadow-lg p-3 flex gap-4 items-center">
          <Button
            onClick={() => !showResults && handlePrediction(null)}
            variant="outline"
            className="rounded-full px-3 py-1 text-sm font-medium text-gray-600"
            disabled={showResults}
          >
            Equal
          </Button>
        </div>
      </div>

      {/* Right Profile */}
      <div
        className={`flex-1 bg-white rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 border cursor-pointer transform ${
          showResults && prediction === rightProfile.id 
            ? (isCorrectPrediction() 
                ? "border-green-300 shadow-lg" 
                : "border-red-300 shadow-lg")
            : "border-gray-100 hover:border-yellow-300 hover:scale-[1.02]"
        } overflow-y-auto max-h-[calc(100vh-150px)] h-full`}
        onClick={() => !showResults && handlePrediction(rightProfile.id)}
      >
        {showResults && prediction === rightProfile.id && (
          <div className="absolute top-4 right-4 z-10">
            {isCorrectPrediction() ? (
              <div className="bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-medium flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Correct!
              </div>
            ) : (
              <div className="bg-red-100 text-red-700 rounded-full px-3 py-1 text-sm font-medium flex items-center">
                <XCircle className="w-4 h-4 mr-1" />
                Wrong
              </div>
            )}
          </div>
        )}
        
        <ProfileDisplay profile={rightProfile} showElo={showResults} />
        
        {!showResults && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Button
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl h-12"
              onClick={(e) => {
                e.stopPropagation()
                handlePrediction(rightProfile.id)
              }}
            >
              Vote for this profile
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileDisplay({ profile, showElo = false }: { profile: ProfileType, showElo?: boolean }) {
  console.log("ProfileDisplay - Education data:", { 
    profile_id: profile.id,
    education: profile.education,
    has_education: profile.education && profile.education.length > 0,
    education_count: profile.education ? profile.education.length : 0
  });
  
  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      <div className="flex flex-col items-center">
        <Avatar className="h-14 w-14 sm:h-16 sm:w-16 md:h-18 md:w-18 lg:h-20 lg:w-20 bg-gradient-to-br from-indigo-400 to-purple-500 shadow-md">
          <AvatarFallback className="text-md sm:text-lg md:text-xl text-white font-light">{profile.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="mt-2 sm:mt-3 text-center">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold">{profile.name}</h3>
          <p className="text-sm text-gray-500">{profile.title}</p>
          {showElo && (
            <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full inline-block">
              ELO: {profile.elo}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 flex items-center">
          <span className="bg-yellow-100 w-5 h-5 sm:w-6 sm:h-6 inline-flex items-center justify-center rounded-full mr-2 text-yellow-700 text-xs sm:text-sm">
            E
          </span>
          Experience
        </h3>
        <div className="space-y-3 sm:space-y-4">
          {/* Only show the top 5 experiences */}
          {profile.experiences && profile.experiences.slice(0, 5).map((experience, index) => (
            <div key={index} className="flex gap-3 items-start">
              <CompanyLogo company={typeof experience.company === 'string' ? experience.company : 
                (experience.company && typeof experience.company === 'object' && 'name' in experience.company) ? 
                experience.company.name : 'Unknown'} />
              <div>
                <div className="font-medium text-sm sm:text-base">{experience.title}</div>
                <div className="text-gray-500 text-xs sm:text-sm">{typeof experience.company === 'string' ? experience.company : 
                  (experience.company && typeof experience.company === 'object' && 'name' in experience.company) ? 
                  experience.company.name : 'Unknown'}</div>
                <div className="text-gray-400 text-xs">{experience.duration}</div>
              </div>
            </div>
          ))}
          {profile.experiences && profile.experiences.length === 0 && (
            <div className="text-gray-500 text-sm italic">No experience listed</div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 flex items-center">
          <span className="bg-blue-100 w-5 h-5 sm:w-6 sm:h-6 inline-flex items-center justify-center rounded-full mr-2 text-blue-700 text-xs sm:text-sm">
            E
          </span>
          Education
        </h3>
        <div className="space-y-3 sm:space-y-4">
          {/* Always show Georgia Tech education first if available */}
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-yellow-600 flex items-center justify-center text-white font-bold text-xs">
              GT
            </div>
            <div>
              <p className="font-medium text-sm sm:text-base">Georgia Tech</p>
              <p className="text-xs sm:text-sm text-gray-500">
                {profile.degree} in {profile.major}
              </p>
              <p className="text-xs text-gray-400">Class of {profile.graduationYear}</p>
            </div>
          </div>
          
          {/* Show previous education if available from legacy structure */}
          {profile.previousEducation && (
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                {profile.previousEducation.school.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm sm:text-base">{profile.previousEducation.school}</p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {profile.previousEducation.degree} in {profile.previousEducation.major}
                </p>
                <p className="text-xs text-gray-400">Class of {profile.previousEducation.year}</p>
              </div>
            </div>
          )}
          
          {/* Show any additional education from the education array, 
              excluding Georgia Tech which is already shown above */}
          {profile.education && profile.education.length > 0 && 
            profile.education
              .filter(edu => !edu.school_name.includes("Georgia Tech") && 
                            !edu.school_name.includes("Georgia Institute of Technology"))
              .map((edu, index) => (
                <div key={index} className="flex items-start gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                    {edu.school_name && 
                      edu.school_name.split(' ')
                        .filter(word => word.length > 0)
                        .map(word => word[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base">{edu.school_name}</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {edu.degree} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      {edu.start_date ? new Date(edu.start_date).getFullYear() : ''} - {
                        edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present'
                      }
                    </p>
                  </div>
                </div>
              ))
          }        </div>
      </div>

      {profile.achievements && profile.achievements.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 flex items-center">
            <span className="bg-purple-100 w-5 h-5 sm:w-6 sm:h-6 inline-flex items-center justify-center rounded-full mr-2 text-purple-700 text-xs sm:text-sm">
              H
            </span>
            Honors
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {profile.achievements.map((achievement, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-2 sm:p-3">
                <p className="font-medium text-sm sm:text-base">{achievement.title}</p>
                {achievement.description && <p className="text-xs sm:text-sm text-gray-500">{achievement.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 flex items-center">
          <span className="bg-green-100 w-5 h-5 sm:w-6 sm:h-6 inline-flex items-center justify-center rounded-full mr-2 text-green-700 text-xs sm:text-sm">
            S
          </span>
          Skills
        </h3>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {profile.skills.slice(0, 5).map((skill, index) => (
            <span key={index} className="px-2 sm:px-3 py-1 bg-gray-50 text-gray-700 text-xs sm:text-sm rounded-full">
              {skill}
            </span>
          ))}
          {profile.skills.length > 5 && (
            <span className="px-2 sm:px-3 py-1 bg-gray-50 text-gray-500 text-xs sm:text-sm rounded-full">
              +{profile.skills.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* LinkedIn button and Vote button */}
      <div className="mt-auto space-y-3">
        {profile.linkedinUrl && (
          <a 
            href={profile.linkedinUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 border border-blue-600 rounded-xl text-blue-600 font-medium hover:bg-blue-50 transition-colors"
          >
            {/* Simple LinkedIn icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
            </svg>
            View LinkedIn Profile
          </a>
        )}
        
      </div>
    </div>
  )
}

function CompanyLogo({ company }: { company: string }) {
  // Map company names to colors for the logo background
  const colorMap: Record<string, string> = {
    Google: "bg-gradient-to-br from-blue-400 to-blue-600",
    Microsoft: "bg-gradient-to-br from-green-400 to-green-600",
    Amazon: "bg-gradient-to-br from-yellow-400 to-yellow-600",
    Apple: "bg-gradient-to-br from-gray-400 to-gray-600",
    Meta: "bg-gradient-to-br from-blue-500 to-blue-700",
    Netflix: "bg-gradient-to-br from-red-500 to-red-700",
    Tesla: "bg-gradient-to-br from-red-400 to-red-600",
    Cisco: "bg-gradient-to-br from-blue-300 to-blue-500",
    "Boston Dynamics": "bg-gradient-to-br from-yellow-400 to-yellow-600",
    "Georgia Tech Research Institute": "bg-gradient-to-br from-yellow-500 to-yellow-700",
    "Georgia Tech": "bg-gradient-to-br from-yellow-500 to-yellow-700",
    "Georgia Tech AI Lab": "bg-gradient-to-br from-yellow-500 to-yellow-700",
    "Georgia Tech Robotics Lab": "bg-gradient-to-br from-yellow-500 to-yellow-700",
    "Startup XYZ": "bg-gradient-to-br from-purple-400 to-purple-600",
    IBM: "bg-gradient-to-br from-blue-600 to-blue-800",
    Dell: "bg-gradient-to-br from-blue-700 to-blue-900",
    Twitter: "bg-gradient-to-br from-blue-300 to-blue-500",
    Airbnb: "bg-gradient-to-br from-red-300 to-red-500",
  }

  const bgColor = colorMap[company] || "bg-gradient-to-br from-gray-300 to-gray-500"

  return (
    <div
      className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm ${bgColor}`}
    >
      {company.charAt(0)}
      {company.split(" ")[1]?.[0] || ""}
    </div>
  )
}
