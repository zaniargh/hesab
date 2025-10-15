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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Check, X, Users } from "lucide-react"
import {
  getCurrentUser,
  getMyConnections,
  getCustomerById,
  getCustomerRequests,
  createCustomerRequest,
  acceptCustomerRequest,
  rejectCustomerRequest,
  addOfflineCustomer,
  type CustomerConnection,
  type CustomerRequest,
} from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function MyCustomersPage() {
  const [connections, setConnections] = useState<CustomerConnection[]>([])
  const [requests, setRequests] = useState<CustomerRequest[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [customerId, setCustomerId] = useState<string>("")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    uniqueCode: "",
    customName: "",
    customerName: "", // اضافه کردن فیلد نام مشتری برای مشتریان بدون کد یکتا
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const user = getCurrentUser()
    if (user?.type === "customer" && user.data) {
      setCustomerId(user.data.id)
      setConnections(getMyConnections(user.data.id))
      const allRequests = getCustomerRequests()
      setRequests(allRequests.filter((r) => r.toCustomerId === user.data!.id && r.status === "pending"))
    }
  }

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.uniqueCode.trim()) {
      const result = addOfflineCustomer(customerId, formData.customerName, formData.customName)

      if (result.success) {
        toast({
          title: "موفق",
          description: result.message,
        })
        setIsAddDialogOpen(false)
        setFormData({ uniqueCode: "", customName: "", customerName: "" })
        loadData()
      } else {
        toast({
          title: "خطا",
          description: result.message,
          variant: "destructive",
        })
      }
      return
    }

    // اگر کد یکتا وارد شده، درخواست معمولی ارسال کن
    const result = createCustomerRequest(customerId, formData.uniqueCode, formData.customName)

    if (result.success) {
      toast({
        title: "موفق",
        description: result.message,
      })
      setIsAddDialogOpen(false)
      setFormData({ uniqueCode: "", customName: "", customerName: "" })
      loadData()
    } else {
      toast({
        title: "خطا",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleAcceptRequest = (requestId: string) => {
    acceptCustomerRequest(requestId)
    toast({
      title: "موفق",
      description: "درخواست تایید شد",
    })
    loadData()
  }

  const handleRejectRequest = (requestId: string) => {
    rejectCustomerRequest(requestId)
    toast({
      title: "موفق",
      description: "درخواست رد شد",
    })
    loadData()
  }

  return (
    <div className="p-8" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">مشتریان من</CardTitle>
              <CardDescription>مدیریت لیست مشتریان و درخواست‌ها</CardDescription>
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
                  <DialogTitle>افزودن مشتری</DialogTitle>
                  <DialogDescription>
                    برای مشتری داخل سیستم کد یکتا وارد کنید، برای مشتری خارج از سیستم فقط نام وارد کنید
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCustomer} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">نام مشتری *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                      className="text-right"
                      placeholder="نام واقعی مشتری"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uniqueCode">کد یکتای مشتری (اختیاری)</Label>
                    <Input
                      id="uniqueCode"
                      value={formData.uniqueCode}
                      onChange={(e) => setFormData({ ...formData, uniqueCode: e.target.value.toUpperCase() })}
                      className="text-right"
                      placeholder="مثال: ABC12345 (برای مشتری داخل سیستم)"
                    />
                    <p className="text-xs text-muted-foreground">
                      اگر کد یکتا وارد نکنید، مشتری به عنوان مشتری خارج از سیستم اضافه می‌شود
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customName">نام دلخواه برای این مشتری *</Label>
                    <Input
                      id="customName"
                      value={formData.customName}
                      onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                      required
                      className="text-right"
                      placeholder="نامی که می‌خواهید برای این مشتری ذخیره شود"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {formData.uniqueCode.trim() ? "ارسال درخواست" : "افزودن مشتری خارج از سیستم"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="connections" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="connections">
                <Users className="h-4 w-4 ml-2" />
                لیست مشتریان ({connections.length})
              </TabsTrigger>
              <TabsTrigger value="requests">
                درخواست‌های در انتظار
                {requests.length > 0 && (
                  <Badge variant="destructive" className="mr-2">
                    {requests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="connections" className="space-y-4 mt-4">
              {connections.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>هنوز مشتری‌ای اضافه نکرده‌اید</p>
                  <p className="text-sm mt-2">با کلیک روی دکمه بالا، مشتری جدید اضافه کنید</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {connections.map((connection) => {
                    const customer = getCustomerById(connection.connectedCustomerId)
                    return (
                      <Card key={connection.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{connection.customName}</h3>
                              <p className="text-sm text-muted-foreground">نام اصلی: {customer?.name}</p>
                              {customer?.uniqueCode ? (
                                <>
                                  <p className="text-xs text-muted-foreground mt-1">تلفن: {customer?.phone}</p>
                                  <Badge variant="secondary" className="mt-2">
                                    داخل سیستم
                                  </Badge>
                                </>
                              ) : (
                                <Badge variant="outline" className="mt-2">
                                  خارج از سیستم
                                </Badge>
                              )}
                            </div>
                            <Badge variant="secondary">متصل</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4 mt-4">
              {requests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>درخواست جدیدی وجود ندارد</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {requests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{request.fromCustomerName}</h3>
                            <p className="text-sm text-muted-foreground">
                              می‌خواهد شما را با نام "{request.customName}" اضافه کند
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(request.createdAt).toLocaleDateString("fa-IR")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAcceptRequest(request.id)} className="gap-1">
                              <Check className="h-4 w-4" />
                              تایید
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectRequest(request.id)}
                              className="gap-1"
                            >
                              <X className="h-4 w-4" />
                              رد
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
