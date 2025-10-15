"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function CustomerPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/customer/profile")
  }, [router])

  return null
}
