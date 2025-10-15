"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authAPI, APIError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authAPI.login(username, password)
      
      toast({
        title: "ورود موفق",
        description: response.user.type === 'admin' 
          ? "به پنل مدیریت خوش آمدید"
          : `${response.user.name} عزیز، خوش آمدید`,
      })

      // Redirect based on user type
      if (response.user.type === 'admin') {
        router.push("/admin")
      } else {
        router.push("/customer")
      }
      
      router.refresh()
    } catch (error) {
      if (error instanceof APIError) {
        toast({
          title: "خطا",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "خطا",
          description: "خطای سرور رخ داد",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4"
      dir="rtl"
    >
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent">
            سیستم اعلام شماره حساب پیشرفته زانیار
          </CardTitle>
          <CardDescription className="text-base">لطفاً برای ورود به سیستم اطلاعات خود را وارد کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">نام کاربری</Label>
              <Input
                id="username"
                type="text"
                placeholder="نام کاربری خود را وارد کنید"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                placeholder="رمز عبور خود را وارد کنید"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-right"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "در حال ورود..." : "ورود به سیستم"}
            </Button>
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>اطلاعات ورود پیش‌فرض:</p>
              <p>مدیر: admin / admin123</p>
              <p>مشتری: customer1 / password123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
