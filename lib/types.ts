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
