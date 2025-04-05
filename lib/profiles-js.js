// Import supabase client
const { supabase } = require("./supabase.js");

/**
 * Get profiles with pagination, filtering and sorting
 */
async function getProfiles({
  page = 1,
  limit = 10,
  query = "",
  filter = "all",
  sort = "elo",
}) {
  try {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Start building query
    let profileQuery = supabase
      .from("profiles")
      .select("*", { count: "exact" });

    // Add search filter if query is provided
    if (query) {
      profileQuery = profileQuery.or(
        `full_name.ilike.%${query}%,title.ilike.%${query}%,company.ilike.%${query}%,major.ilike.%${query}%`
      );
    }

    // Add category filter
    if (filter !== "all") {
      if (filter === "students") {
        profileQuery = profileQuery.eq("is_student", true);
      } else if (filter === "alumni") {
        profileQuery = profileQuery.eq("is_student", false);
      } else {
        // Assume filter is a major
        profileQuery = profileQuery.ilike("major", `%${filter}%`);
      }
    }

    // Add sorting
    if (sort === "elo") {
      profileQuery = profileQuery.order("elo_rating", { ascending: false });
    } else if (sort === "name") {
      profileQuery = profileQuery.order("full_name");
    } else if (sort === "graduation") {
      profileQuery = profileQuery.order("graduation_year");
    }

    // Add pagination
    profileQuery = profileQuery.range(offset, offset + limit - 1);

    // Execute query
    const { data: profiles, error, count } = await profileQuery;

    if (error) throw error;

    // Get education and work experience for each profile
    const profilesWithDetails = [];

    for (const profile of profiles || []) {
      const { data: education } = await supabase
        .from("education")
        .select("*")
        .eq("profile_id", profile.id);

      const { data: experience } = await supabase
        .from("work_experience")
        .select("*")
        .eq("profile_id", profile.id)
        .order("is_current", { ascending: false })
        .order("end_date", { ascending: false });

      profilesWithDetails.push({
        ...profile,
        education: education || [],
        experience: experience || [],
      });
    }

    return {
      profiles: profilesWithDetails,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    };
  } catch (error) {
    console.error("Error fetching profiles:", error);
    throw error;
  }
}

/**
 * Get a single profile by ID with education and work experience
 */
async function getProfileById(id) {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!profile) return null;

    const { data: education } = await supabase
      .from("education")
      .select("*")
      .eq("profile_id", id);

    const { data: experience } = await supabase
      .from("work_experience")
      .select("*")
      .eq("profile_id", id)
      .order("is_current", { ascending: false })
      .order("end_date", { ascending: false });

    return {
      ...profile,
      education: education || [],
      experience: experience || [],
    };
  } catch (error) {
    console.error(`Error fetching profile with ID ${id}:`, error);
    return null;
  }
}

/**
 * Get two random profiles, excluding specified IDs
 */
async function getRandomProfiles(excludeIds = []) {
  // Ensure excludeIds is an array of numbers
  const safeExcludeIds = Array.isArray(excludeIds)
    ? excludeIds.filter((id) => typeof id === "number" && !isNaN(id))
    : [];

  console.log(
    `DIAGNOSTICS - getRandomProfiles called with excludeIds:`,
    safeExcludeIds
  );

  try {
    // Check if we have any profiles at all first
    const { count: profileCount, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting profiles:", countError);
      throw new Error(`Could not count profiles: ${countError.message}`);
    }

    console.log(`DIAGNOSTICS - Total profile count: ${profileCount}`);

    if (profileCount === 0) {
      console.error("No profiles found in database");
      throw new Error("No profiles found in database");
    }

    // Get all profiles (limit to a reasonable number)
    const { data: allProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .limit(100); // Limit to 100 profiles max for performance

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw new Error(`Could not fetch profiles: ${profilesError.message}`);
    }

    if (!allProfiles || allProfiles.length === 0) {
      throw new Error("No profiles returned from database");
    }

    console.log(
      `DIAGNOSTICS - Fetched ${allProfiles.length} profiles successfully`
    );

    // Filter out excluded profiles for the first selection
    let availableForFirst = allProfiles;
    if (safeExcludeIds.length > 0) {
      availableForFirst = allProfiles.filter(
        (profile) => !safeExcludeIds.includes(profile.id)
      );

      // If no profiles left after exclusion, use all profiles
      if (availableForFirst.length === 0) {
        console.warn(
          "No profiles left after exclusion, using all profiles for first selection"
        );
        availableForFirst = allProfiles;
      }
    }

    // Select a random first profile
    const randomFirstIndex = Math.floor(
      Math.random() * availableForFirst.length
    );
    const firstProfile = availableForFirst[randomFirstIndex];

    console.log(`DIAGNOSTICS - First profile selected: ${firstProfile.id}`);

    // Filter profiles for second selection (exclude the first profile and others)
    const combinedExcludeIds = [...safeExcludeIds, firstProfile.id];
    let availableForSecond = allProfiles.filter(
      (profile) => !combinedExcludeIds.includes(profile.id)
    );

    // If no profiles available for second selection, just exclude the first profile
    if (availableForSecond.length === 0) {
      console.warn(
        "No profiles available for second selection after exclusions"
      );
      availableForSecond = allProfiles.filter(
        (profile) => profile.id !== firstProfile.id
      );

      // If still no profiles available, return just the first profile
      if (availableForSecond.length === 0) {
        console.warn("Could not find any profile different from the first one");
        return [firstProfile];
      }
    }

    // Select a random second profile
    const randomSecondIndex = Math.floor(
      Math.random() * availableForSecond.length
    );
    const secondProfile = availableForSecond[randomSecondIndex];

    console.log(`DIAGNOSTICS - Second profile selected: ${secondProfile.id}`);

    // Return both profiles
    return [firstProfile, secondProfile];
  } catch (err) {
    console.error("Exception in getRandomProfiles:", err);
    throw new Error(`Failed to get random profiles: ${err.message}`);
  }
}

/**
 * Record a vote in the database
 */
async function recordVote(leftProfileId, rightProfileId, winnerId, sessionId) {
  try {
    const voteData = {
      winner_id: winnerId,
      left_profile_id: leftProfileId,
      right_profile_id: rightProfileId,
      voter_session_id: sessionId,
    };

    const { error } = await supabase.from("votes").insert([voteData]);

    if (error) throw error;
  } catch (error) {
    console.error("Error recording vote:", error);
    throw error;
  }
}

/**
 * Get recent votes for a user session
 */
async function getRecentVotes(sessionId, limit = 5) {
  try {
    const { data, error } = await supabase
      .from("votes")
      .select("*")
      .eq("voter_session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching recent votes:", error);
    return [];
  }
}

/**
 * Get top profiles by ELO rating
 */
async function getTopProfiles(limit = 10) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("elo_rating", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching top profiles:", error);
    return [];
  }
}

/**
 * Count profiles in the database
 */
async function countProfiles() {
  try {
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error counting profiles:", error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error("Error in countProfiles:", error);
    return 0;
  }
}

module.exports = {
  getProfiles,
  getProfileById,
  getRandomProfiles,
  recordVote,
  getRecentVotes,
  getTopProfiles,
  countProfiles,
};
