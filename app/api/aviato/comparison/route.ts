import { NextRequest, NextResponse } from 'next/server';
import { AviatoService } from '@/lib/services/aviato';

// Initialize Aviato service with server-side API key
const aviatoService = new AviatoService(process.env.AVIATO_API_KEY);

export async function GET(request: NextRequest) {
  try {
    // Get excluded profile IDs from query params
    const url = new URL(request.url);
    const excludeIds = url.searchParams.get('exclude')?.split(',') || [];
    
    // Get two random profiles for comparison
    const [leftProfile, rightProfile] = await aviatoService.getProfilesForComparison(excludeIds);
    
    return NextResponse.json({
      leftProfile,
      rightProfile
    });
  } catch (error: any) {
    console.error('Error getting profiles for comparison:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get profiles for comparison' },
      { status: 500 }
    );
  }
}
