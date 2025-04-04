import { NextRequest, NextResponse } from 'next/server';
import { AviatoService } from '@/lib/services/aviato';
import { AvitoSearchParams } from '@/lib/types/aviato';

// Initialize the Aviato service with server-side API key
const aviatoService = new AviatoService(process.env.AVIATO_API_KEY);

// Simple in-memory cache (would use a more robust solution in production)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const searchParams: AvitoSearchParams = await request.json();
    
    // Create a cache key based on the search parameters
    const cacheKey = JSON.stringify(searchParams);
    
    // Check if we have a cached response
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedResponse.data);
    }
    
    // Perform the search
    const searchResults = await aviatoService.searchProfiles(searchParams);
    
    // Cache the response
    cache.set(cacheKey, {
      data: searchResults,
      timestamp: Date.now()
    });
    
    return NextResponse.json(searchResults);
  } catch (error: any) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search profiles' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || undefined;
    const school = url.searchParams.get('school') || 'Georgia Institute of Technology';
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const isStudent = url.searchParams.get('isStudent');
    const major = url.searchParams.get('major');
    
    // Convert to search params
    const searchParams: AvitoSearchParams = {
      query,
      filters: {
        school,
        ...(isStudent !== null && { isStudent: isStudent === 'true' }),
        ...(major && { major })
      },
      limit,
      offset,
      sort: { field: 'graduationYear', direction: 'desc' }
    };
    
    // Create a cache key
    const cacheKey = JSON.stringify(searchParams);
    
    // Check cache
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedResponse.data);
    }
    
    // Perform search
    const searchResults = await aviatoService.searchProfiles(searchParams);
    
    // Cache results
    cache.set(cacheKey, {
      data: searchResults,
      timestamp: Date.now()
    });
    
    return NextResponse.json(searchResults);
  } catch (error: any) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search profiles' },
      { status: 500 }
    );
  }
}
