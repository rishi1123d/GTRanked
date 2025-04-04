import { AvitoPersonProfile, AvitoSearchParams, AvitoSearchResponse } from '../types/aviato';
import { mockProfiles } from '../mock-data';

/**
 * Service class for interacting with the Aviato API
 */
export class AviatoService {
  private apiKey: string;
  private baseUrl: string;
  private useMockData: boolean = false; // Only use mock if API fails

  constructor(apiKey: string = process.env.NEXT_PUBLIC_AVIATO_API_KEY || '', baseUrl: string = 'https://data.api.aviato.co') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    
    // Log API configuration - helpful for debugging
    console.log("Aviato API Configuration:");
    console.log("- API Base URL:", this.baseUrl);
    console.log("- API Key Present:", !!this.apiKey);
    console.log("- API Key First 4 chars:", this.apiKey.substring(0, 4) + "...");
  }

  /**
   * Helper method to make API requests
   */
  private async fetchFromApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // If using mock data, skip the API call
    if (this.useMockData) {
      console.log(`Using mock data for endpoint: ${endpoint}`);
      return this.getMockResponse<T>(endpoint, options);
    }
    
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`Attempting API call to: ${url}`);
    
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    console.log(`Request Headers (sanitized):`, {
      ...headers,
      'Authorization': 'Bearer [REDACTED]'
    });
    
    console.log(`Request Body:`, options.body);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      console.log(`Response Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json() as T;
        console.log('API Response Success:', JSON.stringify(data).substring(0, 100) + '...');
        return data;
      } else {
        let errorData;
        try {
          errorData = await response.json();
          console.error(`API Error:`, errorData);
        } catch (e) {
          console.error(`Failed to parse error response: ${e}`);
          errorData = { message: response.statusText };
        }
        
        // Fall back to mock data on API error
        console.log('API request failed. Falling back to mock data.');
        this.useMockData = true;
        return this.getMockResponse<T>(endpoint, options);
      }
    } catch (error) {
      console.error(`API Request Error:`, error);
      
      // Fall back to mock data on exception
      console.log('API request exception. Falling back to mock data.');
      this.useMockData = true;
      return this.getMockResponse<T>(endpoint, options);
    }
  }

  /**
   * Generate mock responses for development or fallback
   */
  private getMockResponse<T>(endpoint: string, options: RequestInit): T {
    console.log(`Generating mock response for: ${endpoint}`);
    
    // Convert mock profiles to AvitoPersonProfile format
    const avitoMockProfiles = mockProfiles.map(profile => ({
      id: profile.id,
      name: profile.name,
      title: profile.title,
      company: profile.company,
      graduationYear: profile.graduationYear,
      major: profile.major,
      isStudent: profile.isStudent,
      elo: profile.elo,
      skills: profile.skills,
      education: [
        {
          institution: "Georgia Institute of Technology",
          degree: profile.degree,
          fieldOfStudy: profile.major
        }
      ],
      experience: profile.experiences?.map(exp => ({
        title: exp.title,
        company: exp.company
      }))
    })) as AvitoPersonProfile[];

    // Handle different endpoints
    if (endpoint.includes('/person/search')) {
      return {
        results: avitoMockProfiles,
        total: avitoMockProfiles.length,
        offset: 0,
        limit: 30
      } as unknown as T;
    } 
    
    if (endpoint.includes('/person/') && !endpoint.includes('/search')) {
      // Extract ID from endpoint for single profile request
      const idMatch = endpoint.match(/\/person\/([^\/]+)/);
      const id = idMatch ? idMatch[1] : null;
      
      if (id) {
        const profile = avitoMockProfiles.find(p => p.id === id);
        if (profile) {
          return profile as unknown as T;
        }
      }
      
      // Return first profile as fallback
      return avitoMockProfiles[0] as unknown as T;
    }
    
    // Default fallback
    return { 
      message: "Mock data response" 
    } as unknown as T;
  }

  /**
   * Format the search parameters according to the Aviato DSL documentation
   */
  private formatSearchRequest(params: AvitoSearchParams): any {
    // Create the DSL object based on the detailed schema docs
    const dslRequest: any = {
      // Required pagination parameters
      offset: params.offset !== undefined ? params.offset : 0,
      limit: params.limit !== undefined ? params.limit : 30,
    };
    
    // Add nameQuery if there's a text search
    if (params.query && params.query !== '*') {
      dslRequest.nameQuery = params.query;
    }
    
    // Add sort array if provided
    if (params.sort) {
      dslRequest.sort = [
        { 
          [params.sort.field]: { 
            order: params.sort.direction 
          } 
        }
      ]; 
    }
    
    // Add filters based on provided params
    dslRequest.filters = [];
    
    if (params.filters) {
      // Create filter conditions
      const filterConditions = [];
      
      // Add Georgia Tech school filter
      if (params.filters.school) {
        filterConditions.push({
          "education.institution": {
            operation: "eq",
            value: params.filters.school
          }
        });
      }
      
      // Add company filter
      if (params.filters.company) {
        filterConditions.push({
          "experienceList.company.name": {
            operation: "eq",
            value: params.filters.company
          }
        });
      }
      
      // Add graduation year filter
      if (params.filters.graduationYear) {
        if (typeof params.filters.graduationYear === 'number') {
          filterConditions.push({
            "educationList.endDate": {
              operation: "eq", 
              value: params.filters.graduationYear.toString()
            }
          });
        } else {
          // Range filter
          filterConditions.push({
            "AND": [
              {
                "educationList.endDate": {
                  operation: "gte",
                  value: params.filters.graduationYear[0].toString()
                }
              },
              {
                "educationList.endDate": {
                  operation: "lte",
                  value: params.filters.graduationYear[1].toString()
                }
              }
            ]
          });
        }
      }
      
      // Add title filter
      if (params.filters.title) {
        filterConditions.push({
          "experienceList.positionList": {
            operation: "textcontains",
            value: params.filters.title
          }
        });
      }
      
      // Add location filter
      if (params.filters.location) {
        filterConditions.push({
          "location": {
            operation: "eq",
            value: params.filters.location
          }
        });
      }
      
      // Add major filter
      if (params.filters.major) {
        filterConditions.push({
          "educationList.degree.fieldOfStudy": {
            operation: "eq",
            value: params.filters.major
          }
        });
      }
      
      // If we have multiple conditions, wrap them in an AND
      if (filterConditions.length > 1) {
        dslRequest.filters.push({
          "AND": filterConditions
        });
      } else if (filterConditions.length === 1) {
        // Just add the single condition directly
        dslRequest.filters.push(filterConditions[0]);
      }
    }
    
    // Wrap the entire request in a "dsl" property, as required by the API
    return { dsl: dslRequest };
  }

  /**
   * Search for person profiles using Aviato API
   */
  async searchProfiles(params: AvitoSearchParams): Promise<AvitoSearchResponse> {
    const requestBody = this.formatSearchRequest(params);
    console.log('Search Request Body:', JSON.stringify(requestBody));
    
    try {
      return await this.fetchFromApi<AvitoSearchResponse>('/person/search', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
    } catch (error) {
      console.error('Error searching profiles:', error);
      
      // Always return mock data if we got here
      this.useMockData = true;
      return this.getMockResponse<AvitoSearchResponse>('/person/search', {
        method: 'POST'
      });
    }
  }

  /**
   * Get a person profile by ID
   */
  async getProfile(id: string): Promise<AvitoPersonProfile> {
    try {
      return await this.fetchFromApi<AvitoPersonProfile>(`/person/${id}`);
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // Always return mock data if we got here
      this.useMockData = true;
      return this.getMockResponse<AvitoPersonProfile>(`/person/${id}`, {});
    }
  }

  /**
   * Enrich a person profile with additional data
   */
  async enrichProfile(email: string): Promise<AvitoPersonProfile> {
    try {
      return await this.fetchFromApi<AvitoPersonProfile>('/person/enrich', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    } catch (error) {
      console.error('Error enriching profile:', error);
      
      // Always return mock data if we got here
      this.useMockData = true;
      return this.getMockResponse<AvitoPersonProfile>('/person/enrich', {
        method: 'POST'
      });
    }
  }

  /**
   * Search for Georgia Tech profiles
   */
  async searchGTProfiles(params: Partial<AvitoSearchParams> = {}): Promise<AvitoSearchResponse> {
    // Default params to search for Georgia Tech profiles
    const gtParams: AvitoSearchParams = {
      filters: {
        school: 'Georgia Institute of Technology',
        ...params.filters
      },
      sort: params.sort || { field: 'graduationYear', direction: 'desc' },
      limit: params.limit || 20,
      offset: params.offset || 0,
      query: params.query || "*"
    };

    return this.searchProfiles(gtParams);
  }

  /**
   * Get GT profiles for comparison (random selection)
   */
  async getProfilesForComparison(excludeIds: string[] = []): Promise<[AvitoPersonProfile, AvitoPersonProfile]> {
    try {
      // Get a larger batch of profiles to select from
      const response = await this.searchGTProfiles({ limit: 30 });
      
      // Filter out excluded profiles
      const availableProfiles = response.results.filter(profile => !excludeIds.includes(profile.id));
      
      if (availableProfiles.length < 2) {
        throw new Error('Not enough profiles available for comparison');
      }
      
      // Randomly select two profiles
      const shuffled = [...availableProfiles].sort(() => 0.5 - Math.random());
      return [shuffled[0], shuffled[1]];
    } catch (error) {
      console.error('Error getting profiles for comparison:', error);
      
      // Always return mock data if we got here
      this.useMockData = true;
      const mockResponse = this.getMockResponse<AvitoSearchResponse>('/person/search', {
        method: 'POST'
      });
      return [mockResponse.results[0], mockResponse.results[1]];
    }
  }
}
