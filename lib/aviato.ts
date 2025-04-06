import axios from 'axios';

const AVIATO_API_KEY = process.env.AVIATO_API_KEY;
const AVIATO_BASE_URL = 'https://api.data.aviato.co/v1';

/**
 * Enrich a profile with data from Aviato API
 * @param email Email of the person to enrich
 * @param linkedinUrl LinkedIn URL of the person to enrich (optional)
 */
export async function enrichProfile(email: string, linkedinUrl?: string) {
  if (!AVIATO_API_KEY) {
    throw new Error('Missing Aviato API key. Please check your environment variables.');
  }

  try {
    const response = await axios.post(
      `${AVIATO_BASE_URL}/person/enrich`,
      {
        email,
        linkedin_url: linkedinUrl,
      },
      {
        headers: {
          'Authorization': `Bearer ${AVIATO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error enriching profile with Aviato:', error);
    throw error;
  }
}

/**
 * Extract GT-specific information from Aviato profile data
 * @param aviatoData Raw data from Aviato API
 */
export function extractGTProfileData(aviatoData: any) {
  // Initialize with default values
  const profileData = {
    name: aviatoData.name?.full_name || '',
    title: '',
    company: '',
    major: '',
    graduationYear: 0,
    isStudent: false,
    aviato_id: aviatoData.id || '',
    linkedin_url: aviatoData.linkedin?.url || '',
  };

  // Extract current position
  if (aviatoData.employment?.experiences?.[0]) {
    const currentPosition = aviatoData.employment.experiences[0];
    profileData.title = currentPosition.title || '';
    profileData.company = currentPosition.company?.name || '';
  }

  // Find Georgia Tech education
  if (aviatoData.education?.schools) {
    const gtEducation = aviatoData.education.schools.find((school: any) => 
      school.name && school.name.toLowerCase().includes('georgia tech'));
    
    if (gtEducation) {
      profileData.major = gtEducation.degrees?.[0]?.field_of_study || '';
      profileData.graduationYear = gtEducation.end_date?.year || 0;
      
      // Determine if they're a student (still studying or graduated within last 2 years)
      const currentYear = new Date().getFullYear();
      profileData.isStudent = !gtEducation.end_date || 
        (gtEducation.end_date.year && gtEducation.end_date.year >= currentYear - 2);
    }
  }

  return profileData;
}
