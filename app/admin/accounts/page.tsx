"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Plus, Trash2, Save } from "lucide-react"
import {
  getCustomers,
  addTransaction,
  getTransactions,
  deleteTransaction,
  type Customer,
  type Transaction,
  type BankAccount,
} from "@/lib/auth"

export default function AccountsPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [description, setDescription] = useState("")
  const [transactionType, setTransactionType] = useState<"deposit_to_customer" | "deposit_from_customer">(
    "deposit_to_customer",
  )
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [currentAccount, setCurrentAccount] = useState<BankAccount>({
    id: "",
    accountHolderName: "",
    sheba: "",
    cardNumber: "",
    bankName: "",
    declaredAmount: "",
  })

  useEffect(() => {
    setCustomers(getCustomers())
    setTransactions(getTransactions())
  }, [])

  const handleAddAccount = () => {
    if (
      !currentAccount.accountHolderName ||
      !currentAccount.sheba ||
      !currentAccount.cardNumber ||
      !currentAccount.bankName ||
      !currentAccount.declaredAmount
    ) {
      alert("لطفاً تمام فیلدها را پر کنید")
      return
    }

    const newAccount: BankAccount = {
      ...currentAccount,
      id: Date.now().toString(),
    }

    setAccounts([...accounts, newAccount])
    setCurrentAccount({
      id: "",
      accountHolderName: "",
      sheba: "",
      cardNumber: "",
      bankName: "",
      declaredAmount: "",
    })
  }

  const handleRemoveAccount = (id: string) => {
    setAccounts(accounts.filter((acc) => acc.id !== id))
  }

  const handleUpdateAccountPayment = (id: string, paidAmount: string, trackingCode: string) => {
    setAccounts(accounts.map((acc) => (acc.id === id ? { ...acc, paidAmount, trackingCode } : acc)))
  }

  const handleSubmitTransaction = () => {
    if (!selectedCustomer || !description || accounts.length === 0) {
      alert("لطفاً تمام فیلدها را پر کنید و حداقل یک حساب اضافه کنید")
      return
    }

    const customer = customers.find((c) => c.id === selectedCustomer)
    if (!customer) return

    const newTransaction = addTransaction({
      customerId: selectedCustomer,
      customerName: customer.name,
      description,
      type: transactionType,
      accounts,
      status: "pending",
    })

    setTransactions([...transactions, newTransaction])
    setIsDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setSelectedCustomer("")
    setDescription("")
    setTransactionType("deposit_to_customer")
    setAccounts([])
    setCurrentAccount({
      id: "",
      accountHolderName: "",
      sheba: "",
      cardNumber: "",
      bankName: "",
      declaredAmount: "",
    })
  }

  const handleDeleteTransaction = (id: string) => {
    if (confirm("آیا از حذف این معامله اطمینان دارید؟")) {
      deleteTransaction(id)
      setTransactions(transactions.filter((t) => t.id !== id))
    }
  }

  const selectedCustomerName = customers.find((c) => c.id === selectedCustomer)?.name || "مشتری"

  return (
    <div className="p-8" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">اعلام شماره حساب</CardTitle>
                <CardDescription>مدیریت و اعلام شماره حساب‌های بانکی</CardDescription>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  معامله جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle>ایجاد معامله جدید</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>انتخاب مشتری</Label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="مشتری را انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>توضیحات معامله</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="توضیحات معامله را وارد کنید"
                      rows={3}
                    />
                  </div>

                  <Tabs value={transactionType} onValueChange={(v) => setTransactionType(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="deposit_to_customer">واریز ما به حساب {selectedCustomerName}</TabsTrigger>
                      <TabsTrigger value="deposit_from_customer">واریز {selectedCustomerName} به حساب ما</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <h3 className="font-semibold text-lg">اعلام شماره حساب</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>اسم صاحب حساب</Label>
                        <Input
                          value={currentAccount.accountHolderName}
                          onChange={(e) => setCurrentAccount({ ...currentAccount, accountHolderName: e.target.value })}
                          placeholder="نام صاحب حساب"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>شماره شبا</Label>
                        <Input
                          value={currentAccount.sheba}
                          onChange={(e) => setCurrentAccount({ ...currentAccount, sheba: e.target.value })}
                          placeholder="IR..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>شماره کارت</Label>
                        <Input
                          value={currentAccount.cardNumber}
                          onChange={(e) => setCurrentAccount({ ...currentAccount, cardNumber: e.target.value })}
                          placeholder="0000-0000-0000-0000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>اسم بانک</Label>
                        <Input
                          value={currentAccount.bankName}
                          onChange={(e) => setCurrentAccount({ ...currentAccount, bankName: e.target.value })}
                          placeholder="نام بانک"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label>مبلغ اعلامی</Label>
                        <Input
                          value={currentAccount.declaredAmount}
                          onChange={(e) => setCurrentAccount({ ...currentAccount, declaredAmount: e.target.value })}
                          placeholder="مبلغ به ریال"
                          type="number"
                        />
                      </div>
                    </div>

                    <Button onClick={handleAddAccount} variant="outline" className="w-full gap-2 bg-transparent">
                      <Plus className="h-4 w-4" />
                      اضافه کردن حساب جدید
                    </Button>
                  </div>

                  {accounts.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold">حساب‌های اضافه شده</h3>
                      {accounts.map((account) => (
                        <Card key={account.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <p className="font-semibold">{account.accountHolderName}</p>
                                <p className="text-sm text-muted-foreground">{account.bankName}</p>
                                <p className="text-sm font-mono">{account.sheba}</p>
                                <p className="text-sm font-mono">{account.cardNumber}</p>
                                <p className="text-sm font-semibold text-primary">
                                  مبلغ اعلامی: {Number(account.declaredAmount).toLocaleString()} ریال
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveAccount(account.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                              <div className="space-y-2">
                                <Label className="text-xs">مبلغ پرداختی</Label>
                                <Input
                                  value={account.paidAmount || ""}
                                  onChange={(e) =>
                                    handleUpdateAccountPayment(account.id, e.target.value, account.trackingCode || "")
                                  }
                                  placeholder="مبلغ پرداختی"
                                  type="number"
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">کد پیگیری</Label>
                                <Input
                                  value={account.trackingCode || ""}
                                  onChange={(e) =>
                                    handleUpdateAccountPayment(account.id, account.paidAmount || "", e.target.value)
                                  }
                                  placeholder="کد پیگیری"
                                  className="h-9"
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  <Button onClick={handleSubmitTransaction} className="w-full gap-2">
                    <Save className="h-4 w-4" />
                    ثبت معامله
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              هنوز معامله‌ای ثبت نشده است
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{transaction.customerName}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(transaction.createdAt).toLocaleDateString("fa-IR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            transaction.type === "deposit_to_customer"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {transaction.type === "deposit_to_customer" ? "واریز به مشتری" : "واریز از مشتری"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {transaction.accounts.map((account) => (
                        <div key={account.id} className="border rounded-lg p-4 bg-muted/30">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">صاحب حساب</p>
                              <p className="font-medium">{account.accountHolderName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">بانک</p>
                              <p className="font-medium">{account.bankName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">شماره شبا</p>
                              <p className="font-mono text-sm">{account.sheba}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">شماره کارت</p>
                              <p className="font-mono text-sm">{account.cardNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">مبلغ اعلامی</p>
                              <p className="font-semibold text-primary">
                                {Number(account.declaredAmount).toLocaleString()} ریال
                              </p>
                            </div>
                            {account.paidAmount && (
                              <div>
                                <p className="text-sm text-muted-foreground">مبلغ پرداختی</p>
                                <p className="font-semibold text-green-600">
                                  {Number(account.paidAmount).toLocaleString()} ریال
                                </p>
                              </div>
                            )}
                            {account.trackingCode && (
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">کد پیگیری</p>
                                <p className="font-mono">{account.trackingCode}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
