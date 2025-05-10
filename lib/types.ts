export interface ProfileType {
  id: string
  name: string
  title: string
  company: string
  degree: string
  major: string
  graduationYear: number
  isStudent: boolean
  elo: number
  linkedinUrl?: string  // Optional LinkedIn profile URL
  profileImageUrl?: string  // Optional profile image URL from LinkedIn
  skills: string[]
  experiences: {
    title: string
    company: string
    duration: string
    companyLogoUrl?: string  // Optional company logo URL from LinkedIn
  }[]
  // Add education field
  education?: {
    profile_id: string
    school_id: string
    school_name: string
    degree: string
    field_of_study: string
    start_date: string | null
    end_date: string | null
  }[]
  achievements?: {
    title: string
    description?: string
  }[]
  previousEducation?: {
    school: string
    degree: string
    major: string
    year: number
  }
}
