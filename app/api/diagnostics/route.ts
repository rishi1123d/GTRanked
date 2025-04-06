import { NextResponse } from "next/server";
import { countProfiles } from "@/lib/profiles";

export async function GET(request: Request) {
  try {
    // Count profiles in the database
    const profileCount = await countProfiles();

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "Set (length: " +
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length +
        " chars)"
      : "Not set";

    return NextResponse.json({
      status: "success",
      database: {
        connected: profileCount >= 0,
        profileCount,
      },
      environment: {
        supabaseUrl: supabaseUrl.startsWith("http")
          ? supabaseUrl.substring(0, 10) + "..."
          : supabaseUrl,
        supabaseAnonKey,
      },
      timestamp: new Date().toISOString(),
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform,
      },
    });
  } catch (error) {
    console.error("Diagnostics error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
