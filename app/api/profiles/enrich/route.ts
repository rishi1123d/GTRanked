import { NextResponse } from "next/server";
import dotenv from "dotenv";

// Import the JavaScript version of the profiles module using CommonJS require
const { supabase } = require("@/lib/supabase.js");

// Aviato API configuration
const AVIATO_API_KEY = process.env.AVIATO_API_KEY;
const AVIATO_API_BASE_URL = 'https://data.api.aviato.co';

// Helper function to extract URLs from social links
function extractUrls(urls: any) {
  if (!urls) return { linkedinUrl: null, twitterUrl: null, githubUrl: null };
  
  let linkedinUrl = null;
  let twitterUrl = null;
  let githubUrl = null;
  
  if (urls.linkedin && typeof urls.linkedin === 'string') {
    linkedinUrl = urls.linkedin.startsWith('http') ? urls.linkedin : `https://${urls.linkedin}`;
  } else if (urls.linkedin && Array.isArray(urls.linkedin) && urls.linkedin.length > 0) {
    linkedinUrl = urls.linkedin[0].startsWith('http') ? urls.linkedin[0] : `https://${urls.linkedin[0]}`;
  }
  
  if (urls.twitter && typeof urls.twitter === 'string') {
    twitterUrl = urls.twitter.startsWith('http') ? urls.twitter : `https://${urls.twitter}`;
  } else if (urls.twitter && Array.isArray(urls.twitter) && urls.twitter.length > 0) {
    twitterUrl = urls.twitter[0].startsWith('http') ? urls.twitter[0] : `https://${urls.twitter[0]}`;
  }
  
  if (urls.github && typeof urls.github === 'string') {
    githubUrl = urls.github.startsWith('http') ? urls.github : `https://${urls.github}`;
  } else if (urls.github && Array.isArray(urls.github) && urls.github.length > 0) {
    githubUrl = urls.github[0].startsWith('http') ? urls.github[0] : `https://${urls.github[0]}`;
  }
  
  return { linkedinUrl, twitterUrl, githubUrl };
}

// On-demand profile enrichment endpoint
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Get the aviato_id from the URL
    const url = new URL(request.url);
    const aviato_id = url.searchParams.get('aviato_id');
    
    if (!aviato_id) {
      return NextResponse.json({ error: "Missing aviato_id parameter" }, { status: 400 });
    }
    
    console.log(`Processing enrichment request for aviato_id: ${aviato_id}`);
    
    // Check if profile exists in database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('aviato_id', aviato_id)
      .single();
    
    if (profileError) {
      return NextResponse.json(
        { error: "Error fetching profile", message: profileError.message },
        { status: 500 }
      );
    }
    
    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found", message: `No profile found with aviato_id: ${aviato_id}` },
        { status: 404 }
      );
    }
    
    // If profile is already enriched, return it immediately
    if (profile.is_enriched) {
      console.log(`Profile ${profile.full_name} (ID: ${profile.id}) is already enriched`);
      
      // Fetch related data (education, experience, skills)
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
      
      const { data: skills } = await supabase
        .from('skills')
        .select('*')
        .eq('profile_id', profile.id);
      
      return NextResponse.json({
        profile: {
          ...profile,
          education: education || [],
          experience: experience || [],
          skills: skills || []
        },
        enriched: false // Indicates we didn't need to perform enrichment
      });
    }
    
    // If we get here, the profile needs enrichment
    console.log(`Enriching profile ${profile.full_name} (ID: ${profile.id})`);
    
    // Make API request to Aviato enrich endpoint
    if (!AVIATO_API_KEY) {
      return NextResponse.json(
        { error: "API key missing", message: "Aviato API key not found in environment variables" },
        { status: 500 }
      );
    }
    
    try {
      // Parameters for the enrich endpoint - include needs to be a comma-separated string, not an array
      const includeValue = "EDUCATION,EXPERIENCE,DEGREES,SKILLS";
      const url = `${AVIATO_API_BASE_URL}/person/enrich?id=${aviato_id}&include=${includeValue}`;
      
      console.log(`Making API request to Aviato enrich: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AVIATO_API_KEY}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Aviato API error: ${response.status} ${errorText}`);
      }
      
      const enrichedData = await response.json();
      console.log(`Successfully enriched profile data for ${profile.full_name}`);
      
      // Extract relevant information from enriched data
      const { linkedinUrl, twitterUrl, githubUrl } = extractUrls(enrichedData.urls);
      
      // Debug the experience data structure
      console.log(`Experience data structure sample:`, 
        JSON.stringify(enrichedData.experienceList && enrichedData.experienceList.length > 0 ? 
        enrichedData.experienceList[0] : {}, null, 2).substring(0, 500));
      
      // Get top 3 experiences if available
      const experiences = enrichedData.experienceList || [];
      experiences.sort((a: any, b: any) => {
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        
        const aDate = a.endDate ? new Date(a.endDate) : new Date();
        const bDate = b.endDate ? new Date(b.endDate) : new Date();
        return bDate.getTime() - aDate.getTime();
      });
      
      // Helper function to extract company name properly
      function extractCompanyName(expItem: any): string {
        if (!expItem) return '';
        
        // Debug the company structure
        console.log(`Company structure:`, JSON.stringify(expItem, null, 2).substring(0, 200));
        
        // If company is a string, use it directly
        if (typeof expItem.company === 'string') return expItem.company;
        
        // If company is an object with a name property, use that
        if (expItem.company && typeof expItem.company === 'object' && expItem.company.name) {
          return expItem.company.name;
        }
        
        // If company is an object that IS the name property (e.g., structure seen in the UI)
        if (expItem.name && typeof expItem.name === 'string') {
          return expItem.name;
        }
        
        // If we have an industryList array with name properties
        if (expItem.industryList && Array.isArray(expItem.industryList)) {
          const names = expItem.industryList.map((item: any) => 
            typeof item === 'string' ? item : 
            (item.name ? item.name : '')
          ).filter(Boolean);
          
          if (names.length > 0) {
            return names[0];
          }
        }
        
        // Special case for malformed data showing in UI
        if (typeof expItem === 'string') {
          try {
            // Try to parse it if it's a JSON string
            const parsed = JSON.parse(expItem);
            if (parsed.name) return parsed.name;
          } catch (e) {
            // If it's not valid JSON, just return the string itself
            return expItem;
          }
        }
        
        // Fallback for debugging - return a placeholder with the structure
        console.log(`Could not extract company name from:`, typeof expItem, 
                    Object.keys(expItem).join(', '));
        
        // Fall back to empty string if we can't determine
        return 'Unknown Company';
      }
      
      // Helper function to extract title properly
      function extractTitle(expItem: any): string {
        if (!expItem) return '';
        
        // If title is a string, use it directly
        if (typeof expItem.title === 'string') return expItem.title;
        
        // Fall back to empty string if we can't determine
        return '';
      }
      
      // Extract education, degree, and major information
      const education = enrichedData.educationList || [];
      
      // Get top 3 experiences
      const exp1 = experiences[0] || null;
      const exp2 = experiences[1] || null;
      const exp3 = experiences[2] || null;
      
      // Prepare profile data update
      const profileUpdate = {
        // Basic info from the enriched data
        headline: enrichedData.headline || profile.headline,
        title: exp1 ? extractTitle(exp1) : profile.title,
        company: exp1 ? extractCompanyName(exp1) : profile.company,
        
        // Update social media links
        linkedin_url: linkedinUrl,
        twitter_url: twitterUrl,
        github_url: githubUrl,
        
        // Experience 1
        exp1_title: exp1 ? extractTitle(exp1) : null,
        exp1_company: exp1 ? extractCompanyName(exp1) : null,
        exp1_start_date: exp1 ? exp1.startDate : null,
        exp1_end_date: exp1 ? exp1.endDate : null,
        exp1_description: exp1 ? exp1.description : '',
        exp1_is_current: exp1 ? exp1.isCurrent : false,
        
        // Experience 2
        exp2_title: exp2 ? extractTitle(exp2) : null,
        exp2_company: exp2 ? extractCompanyName(exp2) : null,
        exp2_start_date: exp2 ? exp2.startDate : null,
        exp2_end_date: exp2 ? exp2.endDate : null,
        exp2_description: exp2 ? exp2.description : '',
        exp2_is_current: exp2 ? exp2.isCurrent : false,
        
        // Experience 3
        exp3_title: exp3 ? extractTitle(exp3) : null,
        exp3_company: exp3 ? extractCompanyName(exp3) : null,
        exp3_start_date: exp3 ? exp3.startDate : null,
        exp3_end_date: exp3 ? exp3.endDate : null,
        exp3_description: exp3 ? exp3.description : '',
        exp3_is_current: exp3 ? exp3.isCurrent : false,
        
        // Mark profile as enriched
        is_enriched: true,
        last_updated: new Date().toISOString()
      };
      
      // Update the profile in the database
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', profile.id)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Error updating profile: ${updateError.message}`);
      }
      
      console.log(`Updated profile ${updatedProfile.full_name} (ID: ${updatedProfile.id})`);
      
      // Insert education records
      if (education.length > 0) {
        for (const edu of education) {
          const schoolId = edu.school ? edu.school.id : null;
          const schoolName = edu.name || (edu.school ? edu.school.fullName : '');
          
          let startDate = null;
          let endDate = null;
          
          if (edu.startDate) {
            try {
              startDate = new Date(edu.startDate);
            } catch (e) {
              console.log(`Could not parse start date: ${edu.startDate}`);
            }
          }
          
          if (edu.endDate) {
            try {
              endDate = new Date(edu.endDate);
            } catch (e) {
              console.log(`Could not parse end date: ${edu.endDate}`);
            }
          }
          
          // Find matching degree for this education
          let degree = '';
          let fieldOfStudy = '';
          
          if (enrichedData.degreeList) {
            const matchingDegree = enrichedData.degreeList.find((d: any) => 
              d.personEducationID === edu.id
            );
            
            if (matchingDegree) {
              degree = matchingDegree.name || '';
              // Try to extract field of study from degree name
              if (degree.includes(' in ')) {
                const parts = degree.split(' in ');
                if (parts.length > 1) {
                  fieldOfStudy = parts[1];
                }
              }
            }
          }
          
          const educationData = {
            profile_id: profile.id,
            school_id: schoolId,
            school_name: schoolName,
            degree: degree,
            field_of_study: fieldOfStudy,
            start_date: startDate,
            end_date: endDate
          };
          
          await supabase.from('education').insert([educationData]);
        }
        
        console.log(`Added ${education.length} education records for ${updatedProfile.full_name}`);
      }
      
      // Insert work experiences
      if (experiences.length > 0) {
        for (const exp of experiences) {
          const workData = {
            profile_id: profile.id,
            company_name: extractCompanyName(exp),
            title: extractTitle(exp),
            start_date: exp.startDate,
            end_date: exp.endDate,
            is_current: exp.isCurrent
          };
          
          await supabase.from('work_experience').insert([workData]);
        }
        
        console.log(`Added ${experiences.length} work experiences for ${updatedProfile.full_name}`);
      }
      
      // Insert skills
      const skills = enrichedData.skills || [];
      if (skills.length > 0) {
        for (const skill of skills) {
          await supabase.from('skills').insert([{
            profile_id: profile.id,
            skill_name: skill.name || skill
          }]);
        }
        
        console.log(`Added ${skills.length} skills for ${updatedProfile.full_name}`);
      }
      
      // Fetch the complete updated profile data with related tables
      const { data: education_data } = await supabase
        .from('education')
        .select('*')
        .eq('profile_id', profile.id);
      
      const { data: experience_data } = await supabase
        .from('work_experience')
        .select('*')
        .eq('profile_id', profile.id)
        .order('is_current', { ascending: false })
        .order('end_date', { ascending: false });
      
      const { data: skills_data } = await supabase
        .from('skills')
        .select('*')
        .eq('profile_id', profile.id);
      
      return NextResponse.json({
        profile: {
          ...updatedProfile,
          education: education_data || [],
          experience: experience_data || [],
          skills: skills_data || []
        },
        enriched: true // Indicates we performed enrichment
      });
      
    } catch (error: any) {
      console.error(`Error enriching profile:`, error);
      return NextResponse.json(
        { error: "Enrichment failed", message: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error(`Unexpected error:`, error);
    return NextResponse.json(
      { error: "Server error", message: error.message },
      { status: 500 }
    );
  }
}
