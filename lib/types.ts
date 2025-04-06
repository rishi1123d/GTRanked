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
  skills: string[]
  experiences: {
    title: string
    company: string
    duration: string
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
