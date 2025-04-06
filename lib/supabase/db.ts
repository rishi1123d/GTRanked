import { supabase, Profile, Vote } from './client';
import { getInitialElo } from '../elo';
import { extractGTProfileData, enrichProfile } from '../aviato';

/**
 * Database utilities for profiles
 */
export const profilesDb = {
  /**
   * Get all profiles, sorted by ELO rating
   */
  async getAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('elo', { ascending: false });
    
    if (error) throw error;
    return data as Profile[];
  },

  /**
   * Get a specific profile by ID
   */
  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Record not found
      throw error;
    }
    return data as Profile;
  },

  /**
   * Get multiple profiles by their IDs
   */
  async getByIds(ids: string[]): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', ids);
    
    if (error) throw error;
    return data as Profile[];
  },

  /**
   * Create a new profile
   */
  async create(profileData: Partial<Profile>): Promise<Profile> {
    // Set default ELO rating if not provided
    if (!profileData.elo) {
      profileData.elo = getInitialElo();
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Profile;
  },

  /**
   * Update a profile's ELO rating
   */
  async updateElo(id: string, newElo: number): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        elo: newElo,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  /**
   * Enrich a profile with Aviato data and update in database
   */
  async enrichAndUpdate(id: string, email: string, linkedinUrl?: string): Promise<Profile> {
    // Get Aviato data
    const aviatoData = await enrichProfile(email, linkedinUrl);
    
    // Extract relevant GT profile data
    const gtProfileData = extractGTProfileData(aviatoData);
    
    // Update profile in database
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...gtProfileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Profile;
  },

  /**
   * Search profiles by name, company, or title
   */
  async search(query: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`name.ilike.%${query}%,company.ilike.%${query}%,title.ilike.%${query}%`)
      .order('elo', { ascending: false });
    
    if (error) throw error;
    return data as Profile[];
  },

  /**
   * Get random profiles for comparison that haven't been compared recently
   * @param excludeIds IDs to exclude from the random selection
   * @param limit Number of random profiles to return
   */
  async getRandom(excludeIds: string[] = [], limit: number = 2): Promise<Profile[]> {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('random()');
    
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }
    
    const { data, error } = await query.limit(limit);
    
    if (error) throw error;
    return data as Profile[];
  }
};

/**
 * Database utilities for votes
 */
export const votesDb = {
  /**
   * Record a new vote
   */
  async create(winnerId: string | null, loserId: string | null, userId?: string): Promise<Vote> {
    const { data, error } = await supabase
      .from('votes')
      .insert([{
        winner_id: winnerId,
        loser_id: loserId,
        user_id: userId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Vote;
  },

  /**
   * Get recent votes by a user
   * @param userId ID of the user
   * @param limit Number of recent votes to return
   */
  async getRecentByUser(userId: string, limit: number = 10): Promise<Vote[]> {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as Vote[];
  },

  /**
   * Get recent votes (anonymous or by any user)
   * @param limit Number of recent votes to return
   */
  async getRecent(limit: number = 10): Promise<Vote[]> {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as Vote[];
  }
};
