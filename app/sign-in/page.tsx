import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignInPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16 px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">GT Ranked</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/vote" className="text-sm font-medium hover:underline underline-offset-4">
              Vote
            </Link>
            <Link href="/leaderboard" className="text-sm font-medium hover:underline underline-offset-4">
              Leaderboard
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Sign in to your GT Ranked account to vote and access contact information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@gatech.edu" />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="text-sm text-yellow-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input id="password" type="password" />
                </div>
                <Button className="bg-yellow-600 hover:bg-yellow-700">Sign In</Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4">
            <div className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="#" className="text-yellow-600 hover:underline">
                Sign up
              </Link>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Only Georgia Tech email addresses are allowed to register.
            </div>
          </CardFooter>
        </Card>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} GT Ranked. All rights reserved.</p>
          <p className="text-xs text-gray-500">Data powered by Aviato API</p>
        </div>
      </footer>
    </div>
  )
}

