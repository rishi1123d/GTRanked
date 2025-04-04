import { redirect } from "next/navigation"

export default function VoteRedirectPage() {
  redirect("/profiles/vote")
}
