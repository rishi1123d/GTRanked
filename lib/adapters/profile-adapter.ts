import { AvitoPersonProfile, EducationItem } from "@/lib/types/aviato";
import { ProfileType } from "@/lib/types";

/**
 * Adapts an AvitoPersonProfile to the ProfileType format expected by our UI components
 */
export function adaptAvitoProfile(avitoProfile: AvitoPersonProfile): ProfileType {
  // Extract the GT education item (primary) and non-GT education (previous)
  const gtEducation = avitoProfile.education?.find(
    (edu) => edu.institution.toLowerCase().includes("georgia tech") || 
              edu.institution.toLowerCase().includes("georgia institute of technology")
  );
  
  const previousEducation = avitoProfile.education?.find(
    (edu) => !edu.institution.toLowerCase().includes("georgia tech") && 
              !edu.institution.toLowerCase().includes("georgia institute of technology")
  );

  // Extract experiences from Aviato profile
  const experiences = (avitoProfile.experience || []).map(exp => ({
    title: exp.title || "Role",
    company: exp.company || "Company",
    duration: getExperienceDuration(exp.startDate, exp.endDate, exp.isCurrent)
  }));

  // Get most recent workplace for title/company if not provided
  const currentExperience = avitoProfile.experience?.find(exp => exp.isCurrent) || 
                            avitoProfile.experience?.[0];

  return {
    id: avitoProfile.id,
    name: avitoProfile.name,
    title: avitoProfile.title || currentExperience?.title || "Student",
    company: avitoProfile.company || currentExperience?.company || "Georgia Tech",
    degree: gtEducation?.degree || "Bachelor's",
    major: avitoProfile.major || gtEducation?.fieldOfStudy || "Computer Science",
    graduationYear: avitoProfile.graduationYear || extractYearFromDate(gtEducation?.endDate) || new Date().getFullYear() + 1,
    isStudent: avitoProfile.isStudent ?? true,
    elo: avitoProfile.elo || 1200,
    skills: avitoProfile.skills || ["Leadership", "Problem Solving", "Communication"],
    experiences,
    achievements: avitoProfile.bio ? 
      [{ title: "Bio", description: avitoProfile.bio }] : 
      [{ title: "Georgia Tech Student", description: "Studying at one of the top technical institutions" }],
    previousEducation: previousEducation ? {
      school: previousEducation.institution,
      degree: previousEducation.degree || "Degree",
      major: previousEducation.fieldOfStudy || "Major",
      year: extractYearFromDate(previousEducation.endDate) || new Date().getFullYear() - 4
    } : undefined
  };
}

/**
 * Creates a formatted duration string from start and end dates
 */
function getExperienceDuration(startDate?: string, endDate?: string, isCurrent?: boolean): string {
  if (!startDate) return "Present";
  
  const start = new Date(startDate);
  const startYear = start.getFullYear();
  const startMonth = start.toLocaleString('default', { month: 'short' });
  
  if (isCurrent || !endDate) {
    return `${startMonth} ${startYear} - Present`;
  }
  
  const end = new Date(endDate);
  const endYear = end.getFullYear();
  const endMonth = end.toLocaleString('default', { month: 'short' });
  
  return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
}

/**
 * Extracts a year from a date string, or returns null if invalid
 */
function extractYearFromDate(dateString?: string): number | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return date.getFullYear();
  } catch {
    return null;
  }
}
