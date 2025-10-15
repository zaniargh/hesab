"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { CustomerSidebar } from "@/components/customer-sidebar"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.type !== "customer") {
      router.push("/")
    }
  }, [router])

  return (
    <div className="flex h-screen" dir="rtl">
      <div className={`transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0"} overflow-hidden`}>
        <CustomerSidebar />
      </div>

      <main className="flex-1 overflow-y-auto bg-background relative">
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          size="icon"
          variant="outline"
          className="fixed top-4 right-4 z-50 shadow-lg"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        {children}
      </main>
      <Toaster />
    </div>
  )
}
