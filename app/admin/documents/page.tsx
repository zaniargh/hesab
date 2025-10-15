"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function DocumentsPage() {
  return (
    <div className="p-8" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">اسناد گذشته</CardTitle>
              <CardDescription>مشاهده و مدیریت اسناد و مدارک</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            این بخش در مراحل بعدی توسعه داده خواهد شد
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
