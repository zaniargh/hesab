"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loginAdmin, loginCustomer, setCurrentUser } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [adminUsername, setAdminUsername] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [customerUsername, setCustomerUsername] = useState("")
  const [customerPassword, setCustomerPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (loginAdmin(adminUsername, adminPassword)) {
      setCurrentUser({ type: "admin" })
      toast({
        title: "ورود موفق",
        description: "به پنل مدیریت خوش آمدید",
      })
      router.push("/admin")
    } else {
      toast({
        title: "خطا",
        description: "نام کاربری یا رمز عبور اشتباه است",
        variant: "destructive",
      })
    }

    setLoading(false)
  }

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const customer = loginCustomer(customerUsername, customerPassword)
    if (customer) {
      setCurrentUser({ type: "customer", data: customer })
      toast({
        title: "ورود موفق",
        description: `${customer.name} عزیز، خوش آمدید`,
      })
      router.push("/customer")
    } else {
      toast({
        title: "خطا",
        description: "نام کاربری یا رمز عبور اشتباه است",
        variant: "destructive",
      })
    }

    setLoading(false)
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
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin">مدیریت</TabsTrigger>
              <TabsTrigger value="customer">مشتری</TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">نام کاربری</Label>
                  <Input
                    id="admin-username"
                    type="text"
                    placeholder="نام کاربری خود را وارد کنید"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">رمز عبور</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="رمز عبور خود را وارد کنید"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="text-right"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "در حال ورود..." : "ورود به پنل مدیریت"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">پیش‌فرض: admin / admin123</p>
              </form>
            </TabsContent>

            <TabsContent value="customer">
              <form onSubmit={handleCustomerLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-username">نام کاربری</Label>
                  <Input
                    id="customer-username"
                    type="text"
                    placeholder="نام کاربری خود را وارد کنید"
                    value={customerUsername}
                    onChange={(e) => setCustomerUsername(e.target.value)}
                    required
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-password">رمز عبور</Label>
                  <Input
                    id="customer-password"
                    type="password"
                    placeholder="رمز عبور خود را وارد کنید"
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    required
                    className="text-right"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "در حال ورود..." : "ورود به پنل مشتری"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
