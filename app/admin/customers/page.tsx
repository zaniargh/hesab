"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Trash2, Search, Copy, Check } from "lucide-react"
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, type Customer } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    username: "",
    password: "",
    uniqueCode: "",
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = () => {
    setCustomers(getCustomers())
  }

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault()
    const newCustomer = addCustomer(formData)
    loadCustomers()
    setIsAddDialogOpen(false)
    setFormData({ name: "", phone: "", address: "", username: "", password: "", uniqueCode: "" })
    toast({
      title: "موفق",
      description: `مشتری با کد یکتا ${newCustomer.uniqueCode} اضافه شد`,
    })
  }

  const handleEditCustomer = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData)
      loadCustomers()
      setIsEditDialogOpen(false)
      setEditingCustomer(null)
      setFormData({ name: "", phone: "", address: "", username: "", password: "", uniqueCode: "" })
      toast({
        title: "موفق",
        description: "اطلاعات مشتری به‌روزرسانی شد",
      })
    }
  }

  const handleDeleteCustomer = (id: string) => {
    if (confirm("آیا از حذف این مشتری اطمینان دارید؟")) {
      deleteCustomer(id)
      loadCustomers()
      toast({
        title: "موفق",
        description: "مشتری حذف شد",
      })
    }
  }

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      username: customer.username || "",
      password: customer.password || "",
      uniqueCode: customer.uniqueCode || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast({
      title: "کپی شد",
      description: "کد یکتا کپی شد",
    })
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="p-8" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">لیست مشتریان</CardTitle>
              <CardDescription>مدیریت و مشاهده اطلاعات مشتریان</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  افزودن مشتری جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]" dir="rtl">
                <DialogHeader>
                  <DialogTitle>افزودن مشتری جدید</DialogTitle>
                  <DialogDescription>اطلاعات مشتری جدید را وارد کنید</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCustomer} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">نام و نام خانوادگی</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">شماره تلفن</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">آدرس</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">نام کاربری</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">رمز عبور</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="text-right"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    افزودن مشتری
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس نام، تلفن یا نام کاربری..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نام</TableHead>
                  <TableHead className="text-right">تلفن</TableHead>
                  <TableHead className="text-right">آدرس</TableHead>
                  <TableHead className="text-right">نام کاربری</TableHead>
                  <TableHead className="text-right">کد یکتا</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      هیچ مشتری‌ای یافت نشد
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.address}</TableCell>
                      <TableCell>{customer.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{customer.uniqueCode}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(customer.uniqueCode)}
                            className="h-7 w-7 p-0"
                          >
                            {copiedCode === customer.uniqueCode ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(customer)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteCustomer(customer.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>ویرایش اطلاعات مشتری</DialogTitle>
            <DialogDescription>اطلاعات مشتری را ویرایش کنید</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">نام و نام خانوادگی</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">شماره تلفن</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">آدرس</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">نام کاربری</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">رمز عبور</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-uniqueCode">کد یکتا</Label>
              <Input
                id="edit-uniqueCode"
                value={formData.uniqueCode}
                onChange={(e) => setFormData({ ...formData, uniqueCode: e.target.value })}
                required
                className="text-right font-mono"
                placeholder="مثال: ZAN-ABC123"
              />
              <p className="text-xs text-muted-foreground">کد یکتا باید منحصر به فرد باشد</p>
            </div>
            <Button type="submit" className="w-full">
              ذخیره تغییرات
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
