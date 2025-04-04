import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronRight, Trophy, Vote, Users } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b">
        <div className="container flex items-center justify-between h-16 px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-800">
              GT Ranked
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6">
              <Link
                href="/vote"
                className="text-sm font-medium text-gray-600 hover:text-yellow-700 hover:underline decoration-2 underline-offset-4 decoration-yellow-500 transition-colors"
              >
                Vote
              </Link>
              <Link
                href="/leaderboard"
                className="text-sm font-medium text-gray-600 hover:text-yellow-700 hover:underline decoration-2 underline-offset-4 decoration-yellow-500 transition-colors"
              >
                Leaderboard
              </Link>
            </div>
            <Link href="/sign-in">
              <Button variant="outline" className="rounded-full">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-sm text-yellow-800">
                  <span className="flex h-2 w-2 rounded-full bg-yellow-600 mr-2"></span>
                  Georgia Tech Network
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-800">
                  GT Ranked
                </h1>
                <p className="text-xl text-gray-600 md:text-2xl/relaxed lg:text-xl/relaxed xl:text-2xl/relaxed">
                  Compare & rank GT profiles using the ELO rating system
                </p>
                <p className="text-gray-500 md:text-lg/relaxed">
                  Browse through GT students and alumni, compare profiles, and see who ranks highest based on community
                  votes.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/vote">
                    <Button className="h-12 px-6 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white">
                      Start Voting
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button variant="outline" className="h-12 px-6 rounded-full">
                      View Leaderboard
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-md">
                  <div className="absolute -top-4 -left-4 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
                  <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
                  <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">How it works</h3>
                        <div className="bg-yellow-50 rounded-full py-1 px-3 text-xs text-yellow-700">
                          Powered by Aviato
                        </div>
                      </div>
                      <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-medium shadow-sm">
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">Browse GT profiles</p>
                            <p className="text-sm text-gray-500">Access students and alumni data</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-medium shadow-sm">
                            <Vote className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">Vote on comparisons</p>
                            <p className="text-sm text-gray-500">Help rank profiles with your votes</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-medium shadow-sm">
                            <Trophy className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">See the leaderboard</p>
                            <p className="text-sm text-gray-500">Discover top-ranked GT profiles</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 p-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">Already a member?</div>
                        <Link href="/sign-in">
                          <Button variant="link" className="text-yellow-600 p-0 flex items-center gap-1">
                            Sign In
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-sm text-yellow-800">
                <span className="flex h-2 w-2 rounded-full bg-yellow-600 mr-2"></span>
                ELO Rating System
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-800">
                Fair & Dynamic Rankings
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl/relaxed">
                The same algorithm used in chess rankings, adapted to rank GT's network based on profile strength and
                community votes.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl items-center gap-8 py-8 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
                    <span className="font-medium">01</span>
                    <span>Fair Comparisons</span>
                  </div>
                  <h3 className="text-xl font-bold">Profile vs Profile</h3>
                  <p className="text-gray-500">
                    Profiles are compared based on education, experience, and achievements to ensure fair rankings.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
                    <span className="font-medium">02</span>
                    <span>Dynamic Rankings</span>
                  </div>
                  <h3 className="text-xl font-bold">Real-time Updates</h3>
                  <p className="text-gray-500">
                    Rankings adjust automatically as more votes come in, ensuring accuracy and reflecting the
                    community's opinion.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
                    <span className="font-medium">03</span>
                    <span>Network Access</span>
                  </div>
                  <h3 className="text-xl font-bold">Connect with Top Profiles</h3>
                  <p className="text-gray-500">
                    Connect with top-ranked GT alumni and students for career opportunities and networking.
                  </p>
                </div>
              </div>

              <div className="mx-auto w-full max-w-md">
                <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-100">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold">ELO Leaderboard</h3>
                      <span className="text-sm text-gray-500">Top 5</span>
                    </div>
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((rank) => (
                        <div
                          key={rank}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center font-semibold text-white shadow-sm">
                            {rank}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500"></div>
                          <div className="flex-1">
                            <div className="h-4 w-32 bg-gray-200 rounded-full"></div>
                            <div className="h-3 w-24 bg-gray-100 rounded-full mt-1"></div>
                          </div>
                          <div className="text-lg font-bold text-yellow-600">{1800 - (rank - 1) * 25}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
                    <Link href="/leaderboard">
                      <Button variant="link" className="text-yellow-600 flex items-center gap-1 mx-auto">
                        View Full Leaderboard
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-800 mb-1">
                GT Ranked
              </span>
              <p className="text-sm text-gray-500">Ranking Georgia Tech's network using the ELO system</p>
            </div>

            <div className="flex gap-6">
              <Link href="/" className="text-sm text-gray-500 hover:text-yellow-600">
                Home
              </Link>
              <Link href="/vote" className="text-sm text-gray-500 hover:text-yellow-600">
                Vote
              </Link>
              <Link href="/leaderboard" className="text-sm text-gray-500 hover:text-yellow-600">
                Leaderboard
              </Link>
            </div>

            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} GT Ranked. Data powered by Aviato API
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

