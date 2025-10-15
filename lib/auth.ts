export interface Receipt {
  id: string
  amount: string
  trackingCode: string
  depositId: string
  description: string
  depositorName: string
  receiptDate: string // تاریخ میلادی ISO
  submittedBy: string
  submittedByName: string
  submittedAt: string
  status?: "pending" | "approved" | "needs_follow_up"
  approvedBy?: string[]
}

export interface BankAccount {
  id: string
  accountHolderName: string
  accountNumber: string
  sheba: string
  cardNumber: string
  bankName: string
  declaredAmount: string
  receipts: Receipt[]
}

export interface CustomerTransaction {
  id: string
  fromCustomerId: string
  fromCustomerName: string
  toCustomerId: string
  toCustomerName: string
  description: string
  declaredTotalAmount?: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
  type: "deposit_from_customer" | "deposit_to_customer"
  accounts: BankAccount[]
}

export interface CustomerConnection {
  id: string
  ownerId: string
  connectedCustomerId: string
  customName: string
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  username: string
  password: string
  phone: string
  address: string
  uniqueCode?: string // کد یکتا را اختیاری کردیم برای مشتریان خارج از سیستم
  createdAt: string
  preferredCurrency?: "ریال" | "تومان"
}

export interface Admin {
  username: string
  password: string
}

export interface CustomerRequest {
  id: string
  fromCustomerId: string
  fromCustomerName: string
  toCustomerId: string
  toCustomerName: string
  customName: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
}

const DEFAULT_ADMIN: Admin = {
  username: "admin",
  password: "admin123",
}

export function loginAdmin(username: string, password: string): boolean {
  return username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password
}

export function loginCustomer(username: string, password: string): Customer | null {
  const customers = getCustomers()
  const customer = customers.find((c) => c.username === username && c.password === password)
  return customer || null
}

export function setCurrentUser(user: { type: "admin" | "customer"; data?: Customer }): void {
  localStorage.setItem("currentUser", JSON.stringify(user))
}

export function getCurrentUser(): { type: "admin" | "customer"; data?: Customer } | null {
  const user = localStorage.getItem("currentUser")
  return user ? JSON.parse(user) : null
}

export function logout(): void {
  localStorage.removeItem("currentUser")
}

export function getCustomers(): Customer[] {
  const customers = localStorage.getItem("customers")
  return customers ? JSON.parse(customers) : []
}

export function addCustomer(customer: Omit<Customer, "id" | "createdAt">): Customer {
  const customers = getCustomers()
  const newCustomer: Customer = {
    ...customer,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
  customers.push(newCustomer)
  localStorage.setItem("customers", JSON.stringify(customers))
  return newCustomer
}

export function updateCustomer(id: string, updates: Partial<Customer>): void {
  const customers = getCustomers()
  const index = customers.findIndex((c) => c.id === id)
  if (index !== -1) {
    customers[index] = { ...customers[index], ...updates }
    localStorage.setItem("customers", JSON.stringify(customers))
  }
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers()
  const filtered = customers.filter((c) => c.id !== id)
  localStorage.setItem("customers", JSON.stringify(filtered))
}

export function getCustomerById(id: string): Customer | null {
  const customers = getCustomers()
  return customers.find((c) => c.id === id) || null
}

export function getMyConnections(customerId: string): CustomerConnection[] {
  const connections = localStorage.getItem("customerConnections")
  const allConnections: CustomerConnection[] = connections ? JSON.parse(connections) : []
  return allConnections.filter((c) => c.ownerId === customerId)
}

export function addConnection(connection: Omit<CustomerConnection, "id" | "createdAt">): CustomerConnection {
  const connections = localStorage.getItem("customerConnections")
  const allConnections: CustomerConnection[] = connections ? JSON.parse(connections) : []
  const newConnection: CustomerConnection = {
    ...connection,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
  allConnections.push(newConnection)
  localStorage.setItem("customerConnections", JSON.stringify(allConnections))
  return newConnection
}

export function deleteConnection(id: string): void {
  const connections = localStorage.getItem("customerConnections")
  const allConnections: CustomerConnection[] = connections ? JSON.parse(connections) : []
  const filtered = allConnections.filter((c) => c.id !== id)
  localStorage.setItem("customerConnections", JSON.stringify(filtered))
}

export function updateConnection(id: string, updates: Partial<CustomerConnection>): void {
  const connections = localStorage.getItem("customerConnections")
  const allConnections: CustomerConnection[] = connections ? JSON.parse(connections) : []
  const index = allConnections.findIndex((c) => c.id === id)
  if (index !== -1) {
    allConnections[index] = { ...allConnections[index], ...updates }
    localStorage.setItem("customerConnections", JSON.stringify(allConnections))
  }
}

export function getCustomerRequests(): CustomerRequest[] {
  const requests = localStorage.getItem("customerRequests")
  return requests ? JSON.parse(requests) : []
}

export function createCustomerRequest(
  fromCustomerId: string,
  uniqueCode: string,
  customName: string,
): { success: boolean; message: string } {
  const customers = getCustomers()
  const toCustomer = customers.find((c) => c.uniqueCode === uniqueCode)

  if (!toCustomer) {
    return { success: false, message: "مشتری با این کد یکتا یافت نشد" }
  }

  if (toCustomer.id === fromCustomerId) {
    return { success: false, message: "نمی‌توانید خودتان را اضافه کنید" }
  }

  // بررسی ارتباط موجود
  const connections = getMyConnections(fromCustomerId)
  if (connections.some((c) => c.connectedCustomerId === toCustomer.id)) {
    return { success: false, message: "این مشتری قبلاً اضافه شده است" }
  }

  // بررسی درخواست تکراری
  const requests = getCustomerRequests()
  if (
    requests.some(
      (r) => r.fromCustomerId === fromCustomerId && r.toCustomerId === toCustomer.id && r.status === "pending",
    )
  ) {
    return { success: false, message: "درخواست قبلاً ارسال شده است" }
  }

  const fromCustomer = getCustomerById(fromCustomerId)
  if (!fromCustomer) {
    return { success: false, message: "خطا در یافتن اطلاعات شما" }
  }

  const newRequest: CustomerRequest = {
    id: Date.now().toString(),
    fromCustomerId,
    fromCustomerName: fromCustomer.name,
    toCustomerId: toCustomer.id,
    toCustomerName: toCustomer.name,
    customName,
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  requests.push(newRequest)
  localStorage.setItem("customerRequests", JSON.stringify(requests))

  return { success: true, message: "درخواست با موفقیت ارسال شد" }
}

export function acceptCustomerRequest(requestId: string): void {
  const requests = getCustomerRequests()
  const request = requests.find((r) => r.id === requestId)
  if (request) {
    request.status = "accepted"
    localStorage.setItem("customerRequests", JSON.stringify(requests))

    // اضافه کردن ارتباط دو طرفه
    addConnection({
      ownerId: request.toCustomerId,
      connectedCustomerId: request.fromCustomerId,
      customName: request.customName,
    })
    addConnection({
      ownerId: request.fromCustomerId,
      connectedCustomerId: request.toCustomerId,
      customName: request.toCustomerName,
    })
  }
}

export function rejectCustomerRequest(requestId: string): void {
  const requests = localStorage.getItem("customerRequests")
  const index = requests.findIndex((r) => r.id === requestId)
  if (index !== -1) {
    requests[index].status = "rejected"
    localStorage.setItem("customerRequests", JSON.stringify(requests))
  }
}

export function acceptRequest(requestId: string): void {
  acceptCustomerRequest(requestId)
}

export function rejectRequest(requestId: string): void {
  rejectCustomerRequest(requestId)
}

export function getMyCustomerTransactions(customerId: string): CustomerTransaction[] {
  const transactions = localStorage.getItem("customerTransactions")
  const allTransactions: CustomerTransaction[] = transactions ? JSON.parse(transactions) : []
  return allTransactions.filter((t) => t.fromCustomerId === customerId || t.toCustomerId === customerId)
}

export function addCustomerTransaction(
  transaction: Omit<CustomerTransaction, "id" | "createdAt" | "status">,
): CustomerTransaction {
  const transactions = localStorage.getItem("customerTransactions")
  const allTransactions: CustomerTransaction[] = transactions ? JSON.parse(transactions) : []
  const newTransaction: CustomerTransaction = {
    ...transaction,
    id: Date.now().toString(),
    status: "pending",
    createdAt: new Date().toISOString(),
  }
  allTransactions.push(newTransaction)
  localStorage.setItem("customerTransactions", JSON.stringify(allTransactions))
  return newTransaction
}

export function updateCustomerTransaction(id: string, updates: Partial<CustomerTransaction>): void {
  const transactions = localStorage.getItem("customerTransactions")
  const allTransactions: CustomerTransaction[] = transactions ? JSON.parse(transactions) : []
  const index = allTransactions.findIndex((t) => t.id === id)
  if (index !== -1) {
    allTransactions[index] = { ...allTransactions[index], ...updates }
    localStorage.setItem("customerTransactions", JSON.stringify(allTransactions))
  }
}

export function deleteCustomerTransaction(id: string): void {
  const transactions = localStorage.getItem("customerTransactions")
  const allTransactions: CustomerTransaction[] = transactions ? JSON.parse(transactions) : []
  const filtered = allTransactions.filter((t) => t.id !== id)
  localStorage.setItem("customerTransactions", JSON.stringify(filtered))
}

export function getAllTransactions(): CustomerTransaction[] {
  const transactions = localStorage.getItem("customerTransactions")
  return transactions ? JSON.parse(transactions) : []
}

export function approveReceipt(
  transactionId: string,
  accountId: string,
  receiptId: string,
  userId: string,
  userName: string,
): void {
  const transactions = localStorage.getItem("customerTransactions")
  const allTransactions: CustomerTransaction[] = transactions ? JSON.parse(transactions) : []
  const transaction = allTransactions.find((t) => t.id === transactionId)

  if (transaction) {
    const account = transaction.accounts.find((a) => a.id === accountId)
    if (account) {
      const receipt = account.receipts.find((r) => r.id === receiptId)
      if (receipt) {
        receipt.status = "approved"
        receipt.approvedBy = receipt.approvedBy || []
        if (!receipt.approvedBy.includes(userId)) {
          receipt.approvedBy.push(userId)
        }
        localStorage.setItem("customerTransactions", JSON.stringify(allTransactions))
      }
    }
  }
}

export function markNeedsFollowUp(
  transactionId: string,
  accountId: string,
  receiptId: string,
  userId: string,
  userName: string,
): void {
  const transactions = localStorage.getItem("customerTransactions")
  const allTransactions: CustomerTransaction[] = transactions ? JSON.parse(transactions) : []
  const transaction = allTransactions.find((t) => t.id === transactionId)

  if (transaction) {
    const account = transaction.accounts.find((a) => a.id === accountId)
    if (account) {
      const receipt = account.receipts.find((r) => r.id === receiptId)
      if (receipt) {
        receipt.status = "needs_follow_up"
        localStorage.setItem("customerTransactions", JSON.stringify(allTransactions))
      }
    }
  }
}

export function getPreferredCurrency(customerId: string): "ریال" | "تومان" {
  const currency = localStorage.getItem(`currency_${customerId}`)
  return (currency as "ریال" | "تومان") || "تومان"
}

export function setPreferredCurrency(customerId: string, currency: "ریال" | "تومان"): void {
  localStorage.setItem(`currency_${customerId}`, currency)
}

// Additional functions or updates can be added here if needed

export function addTransaction(
  transaction: Omit<CustomerTransaction, "id" | "createdAt" | "status">,
): CustomerTransaction {
  return addCustomerTransaction(transaction)
}

export function getTransactions(customerId: string): CustomerTransaction[] {
  return getMyCustomerTransactions(customerId)
}

export function deleteTransaction(id: string): void {
  deleteCustomerTransaction(id)
}

export function addOfflineCustomer(
  fromCustomerId: string,
  customerName: string,
  customName: string,
): { success: boolean; message: string } {
  const fromCustomer = getCustomerById(fromCustomerId)
  if (!fromCustomer) {
    return { success: false, message: "خطا در یافتن اطلاعات شما" }
  }

  // ایجاد یک مشتری ساختگی برای مشتری خارج از سیستم
  const offlineCustomer: Customer = {
    id: `offline_${Date.now()}`,
    name: customerName,
    username: "",
    password: "",
    phone: "",
    address: "",
    uniqueCode: undefined, // بدون کد یکتا
    createdAt: new Date().toISOString(),
  }

  // ذخیره مشتری ساختگی
  const customers = getCustomers()
  customers.push(offlineCustomer)
  localStorage.setItem("customers", JSON.stringify(customers))

  // اضافه کردن ارتباط یک طرفه (فقط برای کاربر فعلی)
  addConnection({
    ownerId: fromCustomerId,
    connectedCustomerId: offlineCustomer.id,
    customName: customName || customerName,
  })

  return { success: true, message: "مشتری خارج از سیستم با موفقیت اضافه شد" }
}
