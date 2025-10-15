"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { User, Shield } from "lucide-react"

export default function AdminProfilePage() {
  return (
    <div className="p-8" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">پروفایل مدیریت</CardTitle>
              <CardDescription>اطلاعات حساب کاربری مدیر سیستم</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-l from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="font-medium">دسترسی: مدیر کل سیستم</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>نام کاربری</Label>
              <Input value="admin" disabled className="text-right" />
            </div>

            <div className="space-y-2">
              <Label>نقش</Label>
              <Input value="مدیر سیستم" disabled className="text-right" />
            </div>

            <div className="space-y-2">
              <Label>دسترسی‌ها</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-3 rounded-md border bg-card text-sm">✓ مدیریت مشتریان</div>
                <div className="p-3 rounded-md border bg-card text-sm">✓ اعلام شماره حساب</div>
                <div className="p-3 rounded-md border bg-card text-sm">✓ مشاهده اسناد</div>
                <div className="p-3 rounded-md border bg-card text-sm">✓ دسترسی کامل</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
