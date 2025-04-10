"use client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { ProfileType } from "@/lib/types"
import { ChevronRight, CheckCircle2, XCircle, TrendingUp, TrendingDown, Linkedin, ChevronDown } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { calculateEloWithOutcome } from "@/lib/elo"
import { motion, AnimatePresence } from "framer-motion"
import { EmojiRain } from "./emoji-rain"

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
  const [leftProfileLocal, setLeftProfileLocal] = useState<ProfileType>(leftProfile);
  const [rightProfileLocal, setRightProfileLocal] = useState<ProfileType>(rightProfile);
  const [eloChanges, setEloChanges] = useState<{left: number, right: number}>({left: 0, right: 0});
  
  // Update to track emoji type for each profile
  const [leftEmojiType, setLeftEmojiType] = useState<'winner' | 'loser' | null>(null);
  const [rightEmojiType, setRightEmojiType] = useState<'winner' | 'loser' | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  
  const [hasVoted, setHasVoted] = useState(false);
  
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
    // Reset prediction and local profiles when profiles change
    if (!externalShowResults) {
      setPrediction(null);
      setInternalShowResults(false);
      setCountdown(5);
      setNextProfiles(null);
      setLeftProfileLocal(leftProfile);
      setRightProfileLocal(rightProfile);
      setEloChanges({left: 0, right: 0});
      setLeftEmojiType(null);
      setRightEmojiType(null);
      setShowEmojis(false);
      setHasVoted(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [leftProfile.id, rightProfile.id, externalShowResults, leftProfile, rightProfile]);
  
  // Start countdown when results are shown and trigger prefetch
  useEffect(() => {
    // Start countdown whenever results are shown (including when "Equal" is selected)
    // The internalShowResults flag ensures user interaction has happened
    if (showResults && countdown > 0) {
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
  }, [showResults, countdown, nextProfiles]);

  const updateEloRatings = (winnerId: string | null) => {
    if (winnerId === null) return; // No ELO changes for ties
    
    // Get current ratings
    const leftRating = leftProfileLocal.elo;
    const rightRating = rightProfileLocal.elo;
    
    // Determine if user voted for the higher or lower ELO profile
    const isLeftHigherElo = leftRating > rightRating;
    const isRightHigherElo = rightRating > leftRating;
    const isLeftWinner = winnerId === leftProfileLocal.id;
    
    // Calculate outcome for ELO formula
    // 1 if higher ELO was selected (expected outcome)
    // 0 if lower ELO was selected (unexpected outcome)
    // 0.5 if equal ELO (should be rare)
    let outcome = 0.5; // Default for equal ELO
    
    if (isLeftHigherElo) {
      outcome = isLeftWinner ? 1 : 0; // 1 if highest was selected, 0 if not
    } else if (isRightHigherElo) {
      outcome = !isLeftWinner ? 1 : 0; // 1 if highest was selected, 0 if not
    }
    
    // Calculate new ratings using the ELO algorithm with outcome
    const result = calculateEloWithOutcome(
      leftRating, 
      rightRating,
      isLeftWinner ? 1 : 0, // The outcome is always 1 for the selected profile, 0 for the other
      32 // Standard K-factor
    );
    
    // Update local profiles with new ratings
    setLeftProfileLocal(prev => ({...prev, elo: result.playerA}));
    setRightProfileLocal(prev => ({...prev, elo: result.playerB}));
    
    // Calculate ELO changes for display
    const leftChange = result.playerA - leftRating;
    const rightChange = result.playerB - rightRating;
    setEloChanges({left: leftChange, right: rightChange});
    
    // Determine which emoji animations to show based on final ELO scores
    const leftElo = result.playerA;
    const rightElo = result.playerB;
    
    // Show emojis after a short delay
    setTimeout(() => {
      if (leftElo > rightElo) {
        // Left profile has higher ELO - show laughing emoji
        // Right profile has lower ELO - show skull emoji
        setLeftEmojiType('winner');
        setRightEmojiType('loser');
        setShowEmojis(true);
      } else if (rightElo > leftElo) {
        // Right profile has higher ELO - show laughing emoji
        // Left profile has lower ELO - show skull emoji
        setLeftEmojiType('loser');
        setRightEmojiType('winner');
        setShowEmojis(true);
      } else {
        // Equal ELO, don't show emojis
        setLeftEmojiType(null);
        setRightEmojiType(null);
        setShowEmojis(false);
      }
    }, 500);
  };
  
  const handlePrediction = (profileId: string | null) => {
    setPrediction(profileId);
    setInternalShowResults(true);
    setCountdown(5);
    setHasVoted(true);
    
    // Update ELO ratings locally
    updateEloRatings(profileId);
    
    // Pass the vote to the parent component to handle server updates
    onVote(profileId);
  };
  
  const isCorrectPrediction = () => {
    // If user predicted Equal (null)
    if (prediction === null) {
      // If profiles actually have equal ELO, prediction was correct
      return leftProfileLocal.elo === rightProfileLocal.elo;
    }
    
    // If ELO scores are actually equal but user didn't pick Equal
    if (leftProfileLocal.elo === rightProfileLocal.elo) {
      return false;
    }
    
    // Otherwise, check if user picked the profile with higher ELO
    const higherEloProfile = leftProfileLocal.elo > rightProfileLocal.elo ? leftProfileLocal.id : rightProfileLocal.id;
    return prediction === higherEloProfile;
  };
  
  // This function determines if a specific profile is the correct one
  // when Equal button is clicked
  const isCorrectProfileForEqualPrediction = (profileId: string) => {
    // When Equal is clicked (prediction is null)
    if (prediction === null) {
      // If profiles actually have equal ELO, both are correct
      if (leftProfileLocal.elo === rightProfileLocal.elo) {
        return true;
      }
      
      // Otherwise, the profile with higher ELO is the correct one
      const higherEloProfileId = leftProfileLocal.elo > rightProfileLocal.elo 
        ? leftProfileLocal.id 
        : rightProfileLocal.id;
      
      return profileId === higherEloProfileId;
    }
    
    // For non-Equal predictions, use the regular logic
    return prediction === profileId && isCorrectPrediction();
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
      setEloChanges({left: 0, right: 0});
      setLeftEmojiType(null);
      setRightEmojiType(null);
      setShowEmojis(false);
      setHasVoted(false);
    } else {
      // Fall back to regular behavior if prefetched profiles aren't available
      if (onNextComparison) {
        onNextComparison();
      } else {
        // Fallback to internal state reset
        setInternalShowResults(false);
        setPrediction(null);
        setCountdown(5);
        setEloChanges({left: 0, right: 0});
        setLeftEmojiType(null);
        setRightEmojiType(null);
        setShowEmojis(false);
        setHasVoted(false);
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-4 lg:gap-6 relative py-4 min-h-[50vh] px-2">
      {/* Countdown Timer */}
      {showResults && (
        <motion.div 
          className="fixed top-4 left-1/2 z-50"
          initial={{ y: -20, x: "-50%", opacity: 0 }}
          animate={{ y: 0, x: "-50%", opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
        >
          <div className="bg-white rounded-full shadow-md px-4 py-2 border border-yellow-100">
            <div className="text-sm font-medium text-gray-700 flex items-center">
              <span>Next in </span>
              <motion.span 
                className="inline-flex justify-center items-center bg-yellow-50 text-yellow-700 rounded-full w-8 h-8 font-bold mx-1"
                key={countdown}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {countdown}
              </motion.span>
            </div>
          </div>
        </motion.div>
      )}

      {/* "Next Pair" button that appears after the countdown */}
      {showResults && (
        <motion.div 
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleNextClick}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-full px-6 py-6 shadow-lg flex items-center gap-2"
            size="lg"
          >
            Next Pair
            <ChevronDown className="h-5 w-5" />
          </Button>
        </motion.div>
      )}

      {/* Left Profile */}
      <div
        className={`flex-1 bg-white rounded-2xl p-5 sm:p-6 md:p-7 shadow-sm hover:shadow-lg transition-all duration-200 border relative cursor-pointer transform ${
          showResults
            ? (prediction === leftProfileLocal.id 
                ? (isCorrectPrediction() 
                    ? "border-green-300 shadow-lg" 
                    : "border-red-300 shadow-lg")
                : prediction === null 
                  ? (isCorrectProfileForEqualPrediction(leftProfileLocal.id) 
                      ? "border-green-300 shadow-lg" 
                      : "border-red-300 shadow-lg")
                  : "border-gray-100")
            : "border-gray-100 hover:border-yellow-300 hover:scale-[1.01]"
        } h-full overflow-hidden`}
        onClick={() => !showResults && !hasVoted && handlePrediction(leftProfileLocal.id)}
      >
        {/* Updated Emoji Rain for left profile - using the correct type */}
        {leftEmojiType && (
          <EmojiRain 
            isActive={showEmojis} 
            type={leftEmojiType} 
            duration={5}
          />
        )}
        
        {showResults && (prediction === leftProfileLocal.id || prediction === null) && (
          <div className="absolute top-4 right-4 z-10">
            {prediction === null 
              ? (isCorrectProfileForEqualPrediction(leftProfileLocal.id) ? (
                  <motion.div 
                    className="bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-medium flex items-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Correct!
                  </motion.div>
                ) : (
                  <motion.div 
                    className="bg-red-100 text-red-700 rounded-full px-3 py-1 text-sm font-medium flex items-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Wrong
                  </motion.div>
                ))
              : (isCorrectPrediction() ? (
                  <motion.div 
                    className="bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-medium flex items-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Correct!
                  </motion.div>
                ) : (
                  <motion.div 
                    className="bg-red-100 text-red-700 rounded-full px-3 py-1 text-sm font-medium flex items-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Wrong
                  </motion.div>
                ))
            }
          </div>
        )}

        <ProfileDisplay 
          profile={leftProfileLocal} 
          showElo={showResults} 
          eloChange={showResults ? eloChanges.left : 0}
          blurIdentity={!hasVoted && !showResults}
        />
      </div>

      {/* Center Voting Controls */}
      <motion.div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex flex-col items-center"
        initial={{ scale: 0.9, opacity: 0.5 }}
        animate={{ 
          scale: hasVoted || showResults ? 0.9 : 1, 
          opacity: hasVoted || showResults ? 0.5 : 1
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white rounded-full shadow-lg p-1">
          <Button
            onClick={() => !showResults && !hasVoted && handlePrediction(null)}
            variant="ghost"
            className="rounded-full h-14 w-14 lg:h-16 lg:w-16 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
            disabled={showResults || hasVoted}
          >
            Equal
          </Button>
        </div>
      </motion.div>

      {/* Mobile Voting Controls */}
      <motion.div 
        className="flex md:hidden justify-center my-2"
        initial={{ scale: 0.9, opacity: 0.5 }}
        animate={{ 
          scale: hasVoted || showResults ? 0.9 : 1, 
          opacity: hasVoted || showResults ? 0.5 : 1
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white rounded-full shadow-lg p-3 flex gap-4 items-center">
          <Button
            onClick={() => !showResults && !hasVoted && handlePrediction(null)}
            variant="outline"
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 disabled:opacity-50"
            disabled={showResults || hasVoted}
          >
            Equal
          </Button>
        </div>
      </motion.div>

      {/* Right Profile */}
      <div
        className={`flex-1 bg-white rounded-2xl p-5 sm:p-6 md:p-7 shadow-sm hover:shadow-lg transition-all duration-200 border relative cursor-pointer transform ${
          showResults
            ? (prediction === rightProfileLocal.id 
                ? (isCorrectPrediction() 
                    ? "border-green-300 shadow-lg" 
                    : "border-red-300 shadow-lg")
                : prediction === null 
                  ? (isCorrectProfileForEqualPrediction(rightProfileLocal.id) 
                      ? "border-green-300 shadow-lg" 
                      : "border-red-300 shadow-lg")
                  : "border-gray-100")
            : "border-gray-100 hover:border-yellow-300 hover:scale-[1.01]"
        } h-full overflow-hidden`}
        onClick={() => !showResults && !hasVoted && handlePrediction(rightProfileLocal.id)}
      >
        {/* Updated Emoji Rain for right profile - using the correct type */}
        {rightEmojiType && (
          <EmojiRain 
            isActive={showEmojis} 
            type={rightEmojiType} 
            duration={5}
          />
        )}
        
        {showResults && (prediction === rightProfileLocal.id || prediction === null) && (
          <div className="absolute top-4 right-4 z-10">
            {prediction === null 
              ? (isCorrectProfileForEqualPrediction(rightProfileLocal.id) ? (
                  <motion.div 
                    className="bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-medium flex items-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Correct!
                  </motion.div>
                ) : (
                  <motion.div 
                    className="bg-red-100 text-red-700 rounded-full px-3 py-1 text-sm font-medium flex items-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Wrong
                  </motion.div>
                ))
              : (isCorrectPrediction() ? (
                  <motion.div 
                    className="bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-medium flex items-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Correct!
                  </motion.div>
                ) : (
                  <motion.div 
                    className="bg-red-100 text-red-700 rounded-full px-3 py-1 text-sm font-medium flex items-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Wrong
                  </motion.div>
                ))
            }
          </div>
        )}

        <ProfileDisplay 
          profile={rightProfileLocal} 
          showElo={showResults} 
          eloChange={showResults ? eloChanges.right : 0}
          blurIdentity={!hasVoted && !showResults}
        />
      </div>
    </div>
  )
}

function ProfileDisplay({ 
  profile, 
  showElo = false, 
  eloChange = 0,
  blurIdentity = false
}: { 
  profile: ProfileType, 
  showElo?: boolean, 
  eloChange?: number,
  blurIdentity?: boolean
}) {  
  // Get LinkedIn URL from profile, handling various property name formats
  const linkedinUrl = profile.linkedinUrl || 
                     (profile as any).linkedin_url || 
                     (profile as any).linkedinUrl || 
                     '';
  
  // For debugging - remove in production
  // console.log(`Profile ${profile.name} has LinkedIn URL: ${linkedinUrl || 'None'}`);
  
  return (
    <div className="space-y-7">
      {/* Profile Header */}
      <div className="flex flex-col items-center">
        {/* Blurred or regular avatar */}
        <div className="relative">
          <Avatar className="h-24 w-24 sm:h-28 sm:w-28 bg-gradient-to-br from-indigo-400 to-purple-500 shadow-md mb-4 relative">
            {profile.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback className="text-xl sm:text-2xl text-white font-light">{profile.name.charAt(0)}</AvatarFallback>
            )}
            {blurIdentity && (
              <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-md rounded-full flex items-center justify-center">
                <span className="text-xl sm:text-2xl text-gray-400 font-light">?</span>
              </div>
            )}
          </Avatar>
        </div>
        
        {/* Blurred or regular name */}
        {blurIdentity ? (
          <div className="h-8 w-40 bg-gray-200 rounded-lg mb-1 backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-100/60 backdrop-blur-md"></div>
          </div>
        ) : (
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">{profile.name}</h3>
        )}
        
        {/* Always show the title, even when identity is blurred */}
        {profile.title && <p className="text-gray-500 font-medium">{profile.title}</p>}
        
        {showElo && (
          <motion.div 
            className="flex items-center justify-center mt-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-gray-50 py-1.5 px-4 rounded-full text-gray-800 text-base sm:text-lg font-medium shadow-sm">
              Elo: {profile.elo} 
              {eloChange !== 0 && (
                <span className={`ml-1 inline-flex items-center ${eloChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {eloChange > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 mr-0.5" />
                      (+{eloChange})
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 mr-0.5" />
                      ({eloChange})
                    </>
                  )}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Experience Section - Always visible */}
      <div>
        <h3 className="text-lg font-bold mb-3 text-center border-b pb-2">Experience</h3>
        <div className="space-y-4">
          {profile.experiences && profile.experiences.slice(0, 3).map((exp, index) => {
            const companyName = typeof exp.company === 'string' 
              ? exp.company 
              : (exp.company && typeof exp.company === 'object' && exp.company !== null && 'name' in (exp.company as any))
                ? (exp.company as any).name 
                : 'Unknown';
                
            return (
              <div key={index} className="flex items-start gap-3">
                <CompanyLogo company={companyName} logoUrl={exp.companyLogoUrl} />
                <div>
                  <p className="font-semibold text-base sm:text-lg">{exp.title}</p>
                  <p className="text-gray-600">{companyName}</p>
                  {exp.duration && <p className="text-sm text-gray-500">{exp.duration}</p>}
                </div>
              </div>
            );
          })}
          {profile.experiences && profile.experiences.length > 3 && (
            <p className="text-sm text-gray-500 italic text-center">+{profile.experiences.length - 3} more experiences</p>
          )}
          {(!profile.experiences || profile.experiences.length === 0) && (
            <div className="text-gray-500 text-sm italic">No experience listed</div>
          )}
        </div>
      </div>

      {/* Education Section - Always visible */}
      <div>
        <h3 className="text-lg font-bold mb-3 text-center border-b pb-2">Education</h3>
        <div className="space-y-3">
          {/* Main education */}
          <div className="text-center">
            <p className="font-semibold text-lg">{profile.previousEducation?.school || "Georgia Tech"}</p>
            <p className="text-gray-700">
              {profile.degree} in {profile.major}
            </p>
            {profile.graduationYear && (
              <p className="text-sm text-gray-500">Class of {profile.graduationYear}</p>
            )}
          </div>

          {/* Previous education if available */}
          {profile.previousEducation && (
            <div className="text-center mt-3 pt-3 border-t border-gray-100">
              <p className="font-semibold text-lg">The Winsor School</p>
              {profile.previousEducation.degree && (
                <p className="text-sm text-gray-600">
                  {profile.previousEducation.degree} in {profile.previousEducation.major}
                </p>
              )}
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
          }
        </div>
      </div>

      {/* Honors Section - Always visible if available */}
      {profile.achievements && profile.achievements.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 text-center border-b pb-2">Honors</h3>
          <div className="space-y-2">
            {profile.achievements.slice(0, 2).map((achievement, index) => (
              <div key={index} className="text-center">
                <p className="font-medium text-base">{achievement.title}</p>
                {achievement.description && <p className="text-sm text-gray-500">{achievement.description}</p>}
              </div>
            ))}
            {profile.achievements.length > 2 && (
              <p className="text-sm text-gray-500 italic text-center">+{profile.achievements.length - 2} more honors</p>
            )}
          </div>
        </div>
      )}

      {/* LinkedIn Button - Always visible but conditionally enabled */}
      <div className="pt-4">
        <a 
          href={linkedinUrl || '#'}
          target="_blank" 
          rel="noopener noreferrer"
          className={`group flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md transform ${
            linkedinUrl 
              ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 hover:translate-y-[-2px]" 
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
          onClick={(e) => {
            // Prevent navigation if no URL is available
            if (!linkedinUrl) {
              e.preventDefault();
              alert('LinkedIn profile URL not available for this user.');
            }
          }}
        >
          <Linkedin className={`h-5 w-5 ${linkedinUrl ? "text-blue-600" : "text-gray-400"}`} />
          <span>View LinkedIn Profile</span>
        </a>
      </div>
    </div>
  )
}

function CompanyLogo({ company, logoUrl }: { company: string, logoUrl?: string }) {
  // Map company names to colors for the logo background (fallback)
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
      className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm overflow-hidden ${!logoUrl ? bgColor : 'bg-white'}`}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={company} className="h-full w-full object-contain" />
      ) : (
        <>
          {company.charAt(0)}
          {company.split(" ")[1]?.[0] || ""}
        </>
      )}
    </div>
  )
}
