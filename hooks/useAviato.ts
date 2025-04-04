import { useState, useCallback, useEffect } from 'react';
import { AvitoPersonProfile, AvitoSearchParams, AvitoSearchResponse } from '@/lib/types/aviato';

interface UseAviatoOptions {
  initialLoading?: boolean;
}

interface UseAviatoReturn {
  // Search functions
  searchProfiles: (params: AvitoSearchParams) => Promise<AvitoSearchResponse>;
  searchGTProfiles: (params?: Partial<AvitoSearchParams>) => Promise<AvitoSearchResponse>;
  
  // Profile functions
  getProfile: (id: string) => Promise<AvitoPersonProfile>;
  getProfilesForComparison: (excludeIds?: string[]) => Promise<[AvitoPersonProfile, AvitoPersonProfile]>;
  
  // Vote functions
  submitVote: (winnerId: string | null, loserId: string) => Promise<any>;
  getVotes: () => Promise<any>;
  
  // State
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for interacting with Aviato API through our server endpoints
 */
export function useAviato(options: UseAviatoOptions = {}): UseAviatoReturn {
  const [loading, setLoading] = useState(options.initialLoading || false);
  const [error, setError] = useState<Error | null>(null);

  // Helper function to handle API requests
  const apiRequest = useCallback(async <T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`API Error (${response.status}): ${errorData?.error || response.statusText}`);
      }
      
      const data = await response.json();
      return data as T;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search profiles
  const searchProfiles = useCallback(async (params: AvitoSearchParams): Promise<AvitoSearchResponse> => {
    return apiRequest<AvitoSearchResponse>('/api/aviato/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
  }, [apiRequest]);

  // Search GT profiles
  const searchGTProfiles = useCallback(async (params: Partial<AvitoSearchParams> = {}): Promise<AvitoSearchResponse> => {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params.query) {
      queryParams.append('query', params.query);
    }
    
    if (params.filters?.isStudent !== undefined) {
      queryParams.append('isStudent', String(params.filters.isStudent));
    }
    
    if (params.filters?.major) {
      queryParams.append('major', params.filters.major);
    }
    
    if (params.limit) {
      queryParams.append('limit', String(params.limit));
    }
    
    if (params.offset) {
      queryParams.append('offset', String(params.offset));
    }
    
    return apiRequest<AvitoSearchResponse>(`/api/aviato/search?${queryParams.toString()}`);
  }, [apiRequest]);

  // Get profile by ID
  const getProfile = useCallback(async (id: string): Promise<AvitoPersonProfile> => {
    return apiRequest<AvitoPersonProfile>(`/api/aviato/profile/${id}`);
  }, [apiRequest]);

  // Get profiles for comparison
  const getProfilesForComparison = useCallback(async (
    excludeIds: string[] = []
  ): Promise<[AvitoPersonProfile, AvitoPersonProfile]> => {
    const queryParams = excludeIds.length > 0 
      ? `?exclude=${excludeIds.join(',')}` 
      : '';
    
    const data = await apiRequest<{
      leftProfile: AvitoPersonProfile;
      rightProfile: AvitoPersonProfile;
    }>(`/api/aviato/comparison${queryParams}`);
    
    return [data.leftProfile, data.rightProfile];
  }, [apiRequest]);

  // Submit a vote
  const submitVote = useCallback(async (winnerId: string | null, loserId: string) => {
    return apiRequest('/api/aviato/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        winnerId,
        loserId,
        draw: winnerId === null
      })
    });
  }, [apiRequest]);

  // Get votes
  const getVotes = useCallback(async () => {
    return apiRequest('/api/aviato/vote');
  }, [apiRequest]);

  // Reset error when component unmounts
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, []);

  return {
    searchProfiles,
    searchGTProfiles,
    getProfile,
    getProfilesForComparison,
    submitVote,
    getVotes,
    loading,
    error
  };
}
