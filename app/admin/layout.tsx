"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.type !== "admin") {
      router.push("/")
    }
  }, [router])

  return (
    <div className="flex h-screen" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      <Toaster />
    </div>
  )
}
