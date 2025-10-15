// Type definitions برای استفاده در سراسر اپلیکیشن

export interface Receipt {
  id: string
  accountId: string
  amount: string
  trackingCode: string
  depositId: string
  description: string
  depositorName: string
  receiptDate: string
  submittedBy: string
  submittedByName: string
  status: 'pending' | 'approved' | 'needs_follow_up'
  approvedBy: string[]
  submittedAt: string
  createdAt: string
  updatedAt: string
}

export interface BankAccount {
  id: string
  transactionId: string
  accountHolderName: string
  accountNumber?: string
  sheba: string
  cardNumber: string
  bankName: string
  declaredAmount: string
  receipts?: Receipt[]
  createdAt: string
  updatedAt: string
}

export interface CustomerTransaction {
  id: string
  fromCustomerId: string
  fromCustomerName: string
  toCustomerId: string
  toCustomerName: string
  description: string
  declaredTotalAmount?: string
  status: 'pending' | 'accepted' | 'rejected'
  type: 'deposit_from_customer' | 'deposit_to_customer'
  accounts: BankAccount[]
  createdAt: string
  updatedAt: string
}

export interface CustomerConnection {
  id: string
  ownerId: string
  connectedCustomerId: string
  customName: string
  createdAt: string
  connectedCustomer?: Customer
}

export interface Customer {
  id: string
  name: string
  username: string
  phone: string
  address: string
  uniqueCode?: string
  preferredCurrency: 'ریال' | 'تومان'
  createdAt: string
  updatedAt: string
}

export interface Admin {
  id: string
  username: string
  createdAt: string
  updatedAt: string
}

export interface CustomerRequest {
  id: string
  fromCustomerId: string
  fromCustomerName: string
  toCustomerId: string
  toCustomerName: string
  customName: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  updatedAt: string
}
