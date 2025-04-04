"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft } from "lucide-react"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Authentication logic would go here
    console.log({ email, password, rememberMe })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <div className="container pt-8 px-4 md:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-yellow-600 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to home</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md px-8 py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-800 mb-2">
              Sign In
            </h1>
            <p className="text-gray-600">
              Sign in to your GT Ranked account to vote and access personalized features
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@gatech.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-sm text-yellow-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-gray-200"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Remember me for 30 days
              </Label>
            </div>

            <Button type="submit" className="w-full h-12 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white">
              Sign In
            </Button>
          </form>

          <div className="mt-8 pt-6 text-center border-t border-gray-100">
            <p className="text-gray-600 mb-2">Don't have an account?</p>
            <Button variant="outline" asChild className="rounded-full">
              <Link href="#">Create Account</Link>
            </Button>
            <p className="mt-6 text-xs text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
