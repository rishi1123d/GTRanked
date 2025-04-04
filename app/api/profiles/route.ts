import { NextResponse } from "next/server"
import { mockProfiles } from "@/lib/mock-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") || ""
  const filter = searchParams.get("filter") || "all"
  const sort = searchParams.get("sort") || "elo"
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "10")

  // Filter profiles
  let filteredProfiles = [...mockProfiles]

  if (query) {
    filteredProfiles = filteredProfiles.filter(
      (profile) =>
        profile.name.toLowerCase().includes(query.toLowerCase()) ||
        profile.title.toLowerCase().includes(query.toLowerCase()) ||
        profile.company.toLowerCase().includes(query.toLowerCase()) ||
        profile.major.toLowerCase().includes(query.toLowerCase()),
    )
  }

  if (filter !== "all") {
    if (filter === "students") {
      filteredProfiles = filteredProfiles.filter((p) => p.isStudent)
    } else if (filter === "alumni") {
      filteredProfiles = filteredProfiles.filter((p) => !p.isStudent)
    } else {
      filteredProfiles = filteredProfiles.filter((p) => p.major.toLowerCase().includes(filter.toLowerCase()))
    }
  }

  // Sort profiles
  if (sort === "elo") {
    filteredProfiles.sort((a, b) => b.elo - a.elo)
  } else if (sort === "name") {
    filteredProfiles.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sort === "graduation") {
    filteredProfiles.sort((a, b) => a.graduationYear - b.graduationYear)
  }

  // Paginate
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex)

  return NextResponse.json({
    profiles: paginatedProfiles,
    total: filteredProfiles.length,
    page,
    totalPages: Math.ceil(filteredProfiles.length / limit),
  })
}

