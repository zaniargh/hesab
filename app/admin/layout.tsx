"use client"

import type React from "react"

import { AdminSidebar } from "@/components/admin-sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      <Toaster />
    </div>
  )
}
