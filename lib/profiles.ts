import { supabase } from './supabase';

export type Profile = {
  id: number;
  aviato_id: string;
  full_name: string;
  headline?: string;
  title?: string;
  company?: string;
  major?: string;
  graduation_year?: number;
  is_student: boolean;
  location?: string;
  elo_rating: number;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
};

export type Education = {
  id: number;
  profile_id: number;
  school_name: string;
  degree?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
};

export type WorkExperience = {
  id: number;
  profile_id: number;
  company_name: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
};

export type Vote = {
  id: number;
  winner_id?: number;
  left_profile_id: number;
  right_profile_id: number;
  created_at: string;
};

interface ProfileWithDetails extends Profile {
  education?: Education[];
  experience?: WorkExperience[];
}

// Get profiles with pagination, filtering and sorting
export async function getProfiles({
  page = 1,
  limit = 10,
  query = '',
  filter = 'all',
  sort = 'elo'
}: {
  page?: number;
  limit?: number;
  query?: string;
  filter?: string;
  sort?: string;
}): Promise<{ profiles: ProfileWithDetails[]; total: number; totalPages: number }> {
  try {
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Start building query
    let profileQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact' });
    
    // Add search filter if query is provided
    if (query) {
      profileQuery = profileQuery.or(
        `full_name.ilike.%${query}%,title.ilike.%${query}%,company.ilike.%${query}%,major.ilike.%${query}%`
      );
    }
    
    // Add category filter
    if (filter !== 'all') {
      if (filter === 'students') {
        profileQuery = profileQuery.eq('is_student', true);
      } else if (filter === 'alumni') {
        profileQuery = profileQuery.eq('is_student', false);
      } else {
        // Assume filter is a major
        profileQuery = profileQuery.ilike('major', `%${filter}%`);
      }
    }
    
    // Add sorting
    if (sort === 'elo') {
      profileQuery = profileQuery.order('elo_rating', { ascending: false });
    } else if (sort === 'name') {
      profileQuery = profileQuery.order('full_name');
    } else if (sort === 'graduation') {
      profileQuery = profileQuery.order('graduation_year');
    }
    
    // Add pagination
    profileQuery = profileQuery.range(offset, offset + limit - 1);
    
    // Execute query
    const { data: profiles, error, count } = await profileQuery;
    
    if (error) throw error;
    
    // Get education and work experience for each profile
    const profilesWithDetails: ProfileWithDetails[] = [];
    
    for (const profile of profiles || []) {
      const { data: education } = await supabase
        .from('education')
        .select('*')
        .eq('profile_id', profile.id);
      
      const { data: experience } = await supabase
        .from('work_experience')
        .select('*')
        .eq('profile_id', profile.id)
        .order('is_current', { ascending: false })
        .order('end_date', { ascending: false });
      
      profilesWithDetails.push({
        ...profile,
        education: education || [],
        experience: experience || []
      });
    }
    
    return {
      profiles: profilesWithDetails,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }
}

// Get a single profile by ID with education and work experience
export async function getProfileById(id: number): Promise<ProfileWithDetails | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!profile) return null;
    
    const { data: education } = await supabase
      .from('education')
      .select('*')
      .eq('profile_id', id);
    
    const { data: experience } = await supabase
      .from('work_experience')
      .select('*')
      .eq('profile_id', id)
      .order('is_current', { ascending: false })
      .order('end_date', { ascending: false });
    
    return {
      ...profile,
      education: education || [],
      experience: experience || []
    };
  } catch (error) {
    console.error(`Error fetching profile with ID ${id}:`, error);
    return null;
  }
}

// Get two random profiles for voting
export async function getRandomProfiles(excludeIds: number[] = []): Promise<[Profile, Profile]> {
  try {
    // Get first random profile
    const { data: firstProfileArray } = await supabase
      .from('profiles')
      .select('*')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('random()')
      .limit(1);
    
    const firstProfile = firstProfileArray?.[0];
    if (!firstProfile) throw new Error('Could not get first random profile');
    
    // Get second random profile (different from first)
    const { data: secondProfileArray } = await supabase
      .from('profiles')
      .select('*')
      .not('id', 'in', `(${[...excludeIds, firstProfile.id].join(',')})`)
      .order('random()')
      .limit(1);
    
    const secondProfile = secondProfileArray?.[0];
    if (!secondProfile) throw new Error('Could not get second random profile');
    
    return [firstProfile, secondProfile];
  } catch (error) {
    console.error('Error fetching random profiles:', error);
    throw error;
  }
}

// Record a vote
export async function recordVote(
  leftProfileId: number,
  rightProfileId: number,
  winnerId: number | null,
  sessionId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('votes')
      .insert({
        left_profile_id: leftProfileId,
        right_profile_id: rightProfileId,
        winner_id: winnerId,
        voter_session_id: sessionId
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error recording vote:', error);
    throw error;
  }
}

// Get recent votes for a user session
export async function getRecentVotes(
  sessionId: string,
  limit: number = 5
): Promise<Vote[]> {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('voter_session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent votes:', error);
    return [];
  }
}

// Get top profiles by ELO rating
export async function getTopProfiles(limit: number = 10): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('elo_rating', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching top profiles:', error);
    return [];
  }
}
