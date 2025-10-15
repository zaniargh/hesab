"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Users, FileText, CreditCard, User, LogOut } from "lucide-react"
import { authAPI } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

const menuItems = [
  {
    title: "پروفایل",
    href: "/admin/profile",
    icon: User,
  },
  {
    title: "لیست مشتریان",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "اعلام شماره حساب",
    href: "/admin/accounts",
    icon: CreditCard,
  },
  {
    title: "اسناد گذشته",
    href: "/admin/documents",
    icon: FileText,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      toast({
        title: "خروج موفق",
        description: "از سیستم خارج شدید",
      })
      router.push("/")
      router.refresh()
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در خروج از سیستم",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex h-screen w-64 flex-col border-l bg-card" dir="rtl">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-center bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent">
          سیستم اعلام شماره حساب
        </h2>
        <p className="text-sm text-muted-foreground text-center mt-1">پنل مدیریت</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-gradient-to-l from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive bg-transparent"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          خروج از سیستم
        </Button>
      </div>
    </div>
  )
}
