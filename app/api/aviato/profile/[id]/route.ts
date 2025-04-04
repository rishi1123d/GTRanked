import { NextRequest, NextResponse } from 'next/server';
import { AviatoService } from '@/lib/services/aviato';

// Initialize Aviato service with server-side API key
const aviatoService = new AviatoService(process.env.AVIATO_API_KEY);

// Simple in-memory cache
const profileCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes for profile data

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }
    
    // Check if profile is in cache
    const cachedProfile = profileCache.get(id);
    if (cachedProfile && Date.now() - cachedProfile.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedProfile.data);
    }
    
    // Fetch profile from API
    const profile = await aviatoService.getProfile(id);
    
    // Cache the profile
    profileCache.set(id, {
      data: profile,
      timestamp: Date.now()
    });
    
    return NextResponse.json(profile);
  } catch (error: any) {
    console.error(`Error fetching profile ${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
