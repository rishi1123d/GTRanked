/**
 * Types for Aviato API responses
 */

export interface AvitoPersonProfile {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePictureUrl?: string;
  title?: string;
  company?: string;
  location?: string;
  education?: EducationItem[];
  experience?: ExperienceItem[];
  skills?: string[];
  bio?: string;
  socialProfiles?: SocialProfile[];
  graduationYear?: number;
  major?: string;
  isStudent?: boolean;
  elo?: number; // Custom field for our application
}

export interface EducationItem {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  isCurrent?: boolean;
}

export interface SocialProfile {
  platform: string;
  url: string;
  username?: string;
}

export interface AvitoSearchParams {
  query?: string;
  filters?: {
    company?: string;
    title?: string;
    location?: string;
    school?: string;
    graduationYear?: number | [number, number]; // Single year or range
    major?: string;
    isStudent?: boolean;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

export interface AvitoSearchResponse {
  results: AvitoPersonProfile[];
  total: number;
  offset: number;
  limit: number;
}
