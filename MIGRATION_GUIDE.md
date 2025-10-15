# راهنمای مهاجرت از نسخه قبلی

این راهنما نحوه مهاجرت از نسخه قدیمی (با localStorage) به نسخه جدید (با PostgreSQL) را شرح می‌دهد.

## ⚠️ هشدار

**قبل از شروع مهاجرت، از داده‌های فعلی خود نسخه پشتیبان تهیه کنید!**

\`\`\`javascript
// در Console مرورگر اجرا کنید:
const backup = {
  customers: localStorage.getItem('customers'),
  customerConnections: localStorage.getItem('customerConnections'),
  customerRequests: localStorage.getItem('customerRequests'),
  customerTransactions: localStorage.getItem('customerTransactions'),
  currentUser: localStorage.getItem('currentUser'),
}

console.log(JSON.stringify(backup))
// خروجی را کپی و در یک فایل ذخیره کنید
\`\`\`

## تفاوت‌های اصلی

| قبل | بعد |
|-----|-----|
| localStorage | PostgreSQL |
| بدون رمزنگاری رمز | bcrypt hashing |
| Client-side auth | JWT + HttpOnly cookies |
| `Date.now()` IDs | UUID |
| بدون validation | Zod schemas |
| بدون API | RESTful API |

## تغییرات Breaking

### 1. ساختار داده‌ها

#### Customer
\`\`\`typescript
// قبل
interface Customer {
  id: string
  name: string
  username: string
  password: string  // plain text ❌
  phone: string
  address: string
  uniqueCode?: string
  createdAt: string
  preferredCurrency?: "ریال" | "تومان"
}

// بعد
interface Customer {
  id: string  // حالا UUID است
  name: string
  username: string
  // password در API برگردانده نمی‌شود
  phone: string
  address: string
  uniqueCode: string | null
  preferredCurrency: string
  createdAt: Date  // Timestamp
  updatedAt: Date  // جدید
}
\`\`\`

### 2. احراز هویت

#### قبل:
\`\`\`typescript
import { loginAdmin, setCurrentUser, getCurrentUser } from '@/lib/auth'

// Login
if (loginAdmin(username, password)) {
  setCurrentUser({ type: 'admin' })
  // ...
}

// Get user
const user = getCurrentUser()
\`\`\`

#### بعد:
\`\`\`typescript
import { authAPI } from '@/lib/api-client'

// Login
const response = await authAPI.login(username, password)
// Token automatically stored in cookie

// Get user
const { user } = await authAPI.getMe()
\`\`\`

### 3. مدیریت مشتریان

#### قبل:
\`\`\`typescript
import { getCustomers, addCustomer } from '@/lib/auth'

const customers = getCustomers()
const newCustomer = addCustomer({ name, username, password, ... })
\`\`\`

#### بعد:
\`\`\`typescript
import { customerAPI } from '@/lib/api-client'

const { customers } = await customerAPI.getAll()
const { customer } = await customerAPI.create({ name, username, password, ... })
\`\`\`

## اسکریپت مهاجرت داده‌ها

یک اسکریپت برای مهاجرت داده‌های localStorage به PostgreSQL:

\`\`\`typescript
// scripts/migrate-localStorage-to-postgres.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function migrate() {
  // 1. بازیابی داده‌ها از localStorage backup
  const backup = {
    customers: JSON.parse(localStorage.getItem('customers') || '[]'),
    connections: JSON.parse(localStorage.getItem('customerConnections') || '[]'),
    requests: JSON.parse(localStorage.getItem('customerRequests') || '[]'),
    transactions: JSON.parse(localStorage.getItem('customerTransactions') || '[]'),
  }

  // 2. مهاجرت مشتریان
  for (const customer of backup.customers) {
    // Hash password
    const hashedPassword = await bcrypt.hash(customer.password, 10)

    await prisma.customer.create({
      data: {
        id: customer.id,
        name: customer.name,
        username: customer.username,
        password: hashedPassword,
        phone: customer.phone,
        address: customer.address,
        uniqueCode: customer.uniqueCode,
        preferredCurrency: customer.preferredCurrency || 'تومان',
      },
    })
  }

  // 3. مهاجرت ارتباطات
  for (const connection of backup.connections) {
    await prisma.customerConnection.create({
      data: {
        id: connection.id,
        ownerId: connection.ownerId,
        connectedCustomerId: connection.connectedCustomerId,
        customName: connection.customName,
      },
    })
  }

  // 4. مهاجرت درخواست‌ها
  for (const request of backup.requests) {
    await prisma.customerRequest.create({
      data: {
        id: request.id,
        fromCustomerId: request.fromCustomerId,
        fromCustomerName: request.fromCustomerName,
        toCustomerId: request.toCustomerId,
        toCustomerName: request.toCustomerName,
        customName: request.customName,
        status: request.status,
      },
    })
  }

  // 5. مهاجرت تراکنش‌ها
  for (const transaction of backup.transactions) {
    const createdTransaction = await prisma.customerTransaction.create({
      data: {
        id: transaction.id,
        fromCustomerId: transaction.fromCustomerId,
        fromCustomerName: transaction.fromCustomerName,
        toCustomerId: transaction.toCustomerId,
        toCustomerName: transaction.toCustomerName,
        description: transaction.description,
        declaredTotalAmount: transaction.declaredTotalAmount,
        status: transaction.status,
        type: transaction.type,
      },
    })

    // مهاجرت حساب‌های بانکی
    for (const account of transaction.accounts) {
      const createdAccount = await prisma.bankAccount.create({
        data: {
          transactionId: createdTransaction.id,
          accountHolderName: account.accountHolderName,
          accountNumber: account.accountNumber,
          sheba: account.sheba,
          cardNumber: account.cardNumber,
          bankName: account.bankName,
          declaredAmount: account.declaredAmount,
        },
      })

      // مهاجرت فیش‌ها
      if (account.receipts) {
        for (const receipt of account.receipts) {
          await prisma.receipt.create({
            data: {
              accountId: createdAccount.id,
              amount: receipt.amount,
              trackingCode: receipt.trackingCode,
              depositId: receipt.depositId,
              description: receipt.description,
              depositorName: receipt.depositorName,
              receiptDate: receipt.receiptDate,
              submittedBy: receipt.submittedBy,
              submittedByName: receipt.submittedByName,
              status: receipt.status || 'pending',
              approvedBy: receipt.approvedBy || [],
            },
          })
        }
      }
    }
  }

  console.log('✅ مهاجرت با موفقیت انجام شد!')
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
\`\`\`

## چک‌لیست مهاجرت

- [ ] تهیه نسخه پشتیبان از localStorage
- [ ] نصب PostgreSQL
- [ ] تنظیم `.env` file
- [ ] اجرای `pnpm db:push`
- [ ] اجرای اسکریپت مهاجرت (یا seed)
- [ ] تست ورود با اکانت‌های موجود
- [ ] تست عملکرد تمام فیچرها
- [ ] بررسی صحت داده‌های مهاجرت شده
- [ ] حذف localStorage قدیمی
- [ ] آپدیت کدهای client-side

## مشکلات احتمالی

### 1. رمز عبورهای قدیمی کار نمی‌کنند

**علت:** رمزهای عبور حالا hash شده‌اند.

**راه حل:** از طریق پنل admin رمز عبور کاربران را reset کنید.

### 2. IDs تغییر کرده‌اند

**علت:** حالا از UUID استفاده می‌شود.

**راه حل:** روابط خارجی (foreign keys) خودکار توسط Prisma مدیریت می‌شوند.

### 3. uniqueCode تکراری

**علت:** ممکن است در localStorage کدهای تکراری وجود داشته باشد.

**راه حل:** قبل از مهاجرت، uniqueCode ها را بررسی و یکتا کنید.

## پس از مهاجرت

### 1. پاک کردن localStorage

\`\`\`javascript
// در Console مرورگر
localStorage.clear()
\`\`\`

### 2. تست کامل

- [ ] Login/Logout
- [ ] مدیریت مشتریان
- [ ] ایجاد تراکنش
- [ ] افزودن فیش
- [ ] تایید فیش
- [ ] ارتباطات مشتریان

### 3. مانیتورینگ

\`\`\`bash
# بررسی لاگ‌های دیتابیس
pnpm db:studio

# مشاهده تمام رکوردها
\`\`\`

## پشتیبانی

اگر در حین مهاجرت با مشکل مواجه شدید:
1. نسخه پشتیبان را بازیابی کنید
2. مشکل را در Issues گزارش دهید
3. از فایل `SETUP_GUIDE.md` برای راه‌اندازی از صفر استفاده کنید

موفق باشید! 🚀
