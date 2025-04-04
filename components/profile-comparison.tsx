"use client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { ProfileType } from "@/lib/types"
import { ChevronRight } from "lucide-react"

interface ProfileComparisonProps {
  leftProfile: ProfileType
  rightProfile: ProfileType
  onVote: (winnerId: string | null) => void
}

export function ProfileComparison({ leftProfile, rightProfile, onVote }: ProfileComparisonProps) {
  return (
    <div className="w-full flex flex-col md:flex-row gap-8 relative">
      {/* Left Profile */}
      <div
        className="flex-1 bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
        onClick={() => onVote(leftProfile.id)}
      >
        <ProfileDisplay profile={leftProfile} />
        <div className="mt-6 pt-6 border-t border-gray-100">
          <Button
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl h-12"
            onClick={(e) => {
              e.stopPropagation()
              onVote(leftProfile.id)
            }}
          >
            Vote for this profile
          </Button>
        </div>
      </div>

      {/* Center Voting Controls */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex flex-col items-center gap-4">
        <div className="bg-white rounded-full shadow-lg p-1">
          <Button
            onClick={() => onVote(null)}
            variant="ghost"
            className="rounded-full h-16 w-16 font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            Equal
          </Button>
        </div>

        <div className="bg-white rounded-full p-1 shadow-md">
          <div className="text-xs text-gray-500 text-center mb-1">or choose one</div>
          <div className="flex gap-1">
            <Button
              onClick={() => onVote(leftProfile.id)}
              variant="ghost"
              size="sm"
              className="rounded-full h-8 w-8 p-0 hover:bg-yellow-50"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>
            <Button
              onClick={() => onVote(rightProfile.id)}
              variant="ghost"
              size="sm"
              className="rounded-full h-8 w-8 p-0 hover:bg-yellow-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Voting Controls */}
      <div className="flex md:hidden justify-center my-2">
        <div className="bg-white rounded-full shadow-lg p-4 flex gap-4 items-center">
          <Button
            onClick={() => onVote(leftProfile.id)}
            variant="ghost"
            size="sm"
            className="rounded-full h-10 w-10 p-0 hover:bg-yellow-50"
          >
            <ChevronRight className="h-5 w-5 rotate-180" />
          </Button>

          <Button
            onClick={() => onVote(null)}
            variant="outline"
            className="rounded-full px-4 font-medium text-gray-600"
          >
            Equal
          </Button>

          <Button
            onClick={() => onVote(rightProfile.id)}
            variant="ghost"
            size="sm"
            className="rounded-full h-10 w-10 p-0 hover:bg-yellow-50"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Right Profile */}
      <div
        className="flex-1 bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
        onClick={() => onVote(rightProfile.id)}
      >
        <ProfileDisplay profile={rightProfile} />
        <div className="mt-6 pt-6 border-t border-gray-100">
          <Button
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl h-12"
            onClick={(e) => {
              e.stopPropagation()
              onVote(rightProfile.id)
            }}
          >
            Vote for this profile
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProfileDisplay({ profile }: { profile: ProfileType }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center">
        <Avatar className="h-24 w-24 bg-gradient-to-br from-indigo-400 to-purple-500 shadow-md">
          <AvatarFallback className="text-2xl text-white font-light">{profile.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="mt-4 text-center">
          <h3 className="text-xl font-semibold">{profile.name}</h3>
          <p className="text-gray-500">{profile.title}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <span className="bg-yellow-100 w-6 h-6 inline-flex items-center justify-center rounded-full mr-2 text-yellow-700 text-sm">
            E
          </span>
          Experience
        </h3>
        <div className="space-y-4">
          {profile.experiences.map((exp, index) => (
            <div key={index} className="flex items-start gap-3">
              <CompanyLogo company={exp.company} />
              <div>
                <p className="font-medium">{exp.title}</p>
                <p className="text-gray-500">{exp.company}</p>
                <p className="text-xs text-gray-400">{exp.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <span className="bg-blue-100 w-6 h-6 inline-flex items-center justify-center rounded-full mr-2 text-blue-700 text-sm">
            E
          </span>
          Education
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-600 flex items-center justify-center text-white font-bold text-xs">
              GT
            </div>
            <div>
              <p className="font-medium">Georgia Tech</p>
              <p className="text-gray-500">
                {profile.degree} in {profile.major}
              </p>
              <p className="text-xs text-gray-400">Class of {profile.graduationYear}</p>
            </div>
          </div>

          {profile.previousEducation && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                {profile.previousEducation.school.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{profile.previousEducation.school}</p>
                <p className="text-gray-500">
                  {profile.previousEducation.degree} in {profile.previousEducation.major}
                </p>
                <p className="text-xs text-gray-400">Class of {profile.previousEducation.year}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {profile.achievements && profile.achievements.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <span className="bg-purple-100 w-6 h-6 inline-flex items-center justify-center rounded-full mr-2 text-purple-700 text-sm">
              H
            </span>
            Honors
          </h3>
          <div className="space-y-3">
            {profile.achievements.map((achievement, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-3">
                <p className="font-medium">{achievement.title}</p>
                {achievement.description && <p className="text-sm text-gray-500">{achievement.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <span className="bg-green-100 w-6 h-6 inline-flex items-center justify-center rounded-full mr-2 text-green-700 text-sm">
            S
          </span>
          Skills
        </h3>
        <div className="flex flex-wrap gap-2">
          {profile.skills.slice(0, 5).map((skill, index) => (
            <span key={index} className="px-3 py-1 bg-gray-50 text-gray-700 text-sm rounded-full">
              {skill}
            </span>
          ))}
          {profile.skills.length > 5 && (
            <span className="px-3 py-1 bg-gray-50 text-gray-500 text-sm rounded-full">
              +{profile.skills.length - 5} more
            </span>
          )}
        </div>
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
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm ${bgColor}`}
    >
      {company.charAt(0)}
      {company.split(" ")[1]?.[0] || ""}
    </div>
  )
}

