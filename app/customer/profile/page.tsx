"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { User, Phone, MapPin, UserCircle, Copy, Check } from "lucide-react"
import { getCurrentUser, type Customer } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function CustomerProfilePage() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const user = getCurrentUser()
    if (user?.type === "customer" && user.data) {
      setCustomer(user.data)
    }
  }, [])

  const handleCopyCode = () => {
    if (customer?.uniqueCode) {
      navigator.clipboard.writeText(customer.uniqueCode)
      setCopied(true)
      toast({
        title: "کپی شد",
        description: "کد یکتا کپی شد",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!customer) {
    return (
      <div className="p-8 flex items-center justify-center" dir="rtl">
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    )
  }

  return (
    <div className="p-8" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">پروفایل کاربری</CardTitle>
              <CardDescription>اطلاعات حساب کاربری شما</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-l from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <UserCircle className="h-5 w-5 text-blue-600" />
            <span className="font-medium">مشتری سیستم اعلام شماره حساب</span>
          </div>

          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <Label className="text-sm font-medium mb-2 block">کد یکتای شما</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-2xl font-mono font-bold text-primary bg-background px-4 py-3 rounded-lg text-center tracking-wider">
                {customer.uniqueCode}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopyCode} className="h-12 w-12 bg-transparent">
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              این کد را با دیگران به اشتراک بگذارید تا بتوانند شما را به لیست خود اضافه کنند
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                نام و نام خانوادگی
              </Label>
              <Input value={customer.name} disabled className="text-right" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                شماره تلفن
              </Label>
              <Input value={customer.phone} disabled className="text-right" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                آدرس
              </Label>
              <Input value={customer.address} disabled className="text-right" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                نام کاربری
              </Label>
              <Input value={customer.username} disabled className="text-right" />
            </div>

            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="text-sm text-muted-foreground">برای تغییر اطلاعات خود با مدیر سیستم تماس بگیرید</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
