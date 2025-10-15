# گزارش جامع بررسی ایرادات پروژه

تاریخ بررسی: 2025-10-15

## 🔴 مشکلات بحرانی (Critical Issues)

### 1. باگ کدی در تابع `rejectCustomerRequest` (lib/auth.ts:258-265)
**شدت:** ⚠️ بحرانی - باعث کرش اپلیکیشن می‌شود

```typescript
export function rejectCustomerRequest(requestId: string): void {
  const requests = localStorage.getItem("customerRequests")  // ❌ رشته برمی‌گرداند
  const index = requests.findIndex((r) => r.id === requestId)  // ❌ findIndex روی string کار نمی‌کند
  if (index !== -1) {
    requests[index].status = "rejected"
    localStorage.setItem("customerRequests", JSON.stringify(requests))
  }
}
```

**مشکل:** `localStorage.getItem()` یک رشته (string) برمی‌گرداند، اما کد سعی می‌کند `findIndex` را روی آن صدا بزند که فقط روی آرایه کار می‌کند.

**راه حل:** باید `JSON.parse()` استفاده شود:
```typescript
const requests = JSON.parse(localStorage.getItem("customerRequests") || "[]")
```

---

### 2. مشکلات امنیتی شدید (Security Vulnerabilities)

#### 2.1 رمز عبور پیش‌فرض هاردکد شده
**فایل:** `lib/auth.ts:77-80`
```typescript
const DEFAULT_ADMIN: Admin = {
  username: "admin",
  password: "admin123",  // ❌ رمز عبور ضعیف و هاردکد شده
}
```

**خطرات:**
- رمز عبور در کد منبع قابل مشاهده است
- رمز عبور بسیار ضعیف است
- هیچ سازوکار تغییر رمز وجود ندارد
- در صفحه لاگین نمایش داده می‌شود (app/page.tsx:117)

#### 2.2 ذخیره رمز عبور به صورت متن ساده (Plain Text)
**فایل:** `lib/auth.ts:86-90, 110-119`
```typescript
export function loginCustomer(username: string, password: string): Customer | null {
  const customers = getCustomers()
  const customer = customers.find((c) => c.username === username && c.password === password)
  return customer || null
}
```

**مشکلات:**
- رمزهای عبور در localStorage بدون هیچ رمزنگاری ذخیره می‌شوند
- رمزها در حافظه مرورگر به صورت متن ساده قابل دسترسی هستند
- هیچ مکانیزم هشینگ (bcrypt, argon2) استفاده نشده

#### 2.3 عدم احراز هویت مناسب
**فایل:** `app/admin/layout.tsx:18-23`, `app/customer/layout.tsx:21-26`
```typescript
useEffect(() => {
  const user = getCurrentUser()
  if (!user || user.type !== "admin") {
    router.push("/")
  }
}, [router])
```

**مشکلات:**
- احراز هویت فقط در سمت کلاینت انجام می‌شود
- localStorage به راحتی قابل دستکاری است
- هیچ توکن JWT یا session امنی وجود ندارد
- API endpoint امنی برای احراز هویت وجود ندارد

#### 2.4 نبود CSRF Protection
- هیچ مکانیزم محافظت در برابر CSRF attacks وجود ندارد
- عدم استفاده از CSRF tokens

---

### 3. استفاده از localStorage برای داده‌های حساس
**تعداد موارد:** 34 مورد در `lib/auth.ts`

**مشکلات:**
- داده‌های مالی مهم در localStorage ذخیره می‌شوند
- localStorage قابل دسترسی توسط JavaScript است (آسیب‌پذیر به XSS)
- عدم رمزنگاری داده‌ها
- از دست رفتن داده‌ها با پاک کردن کش مرورگر
- عدم پشتیبان‌گیری خودکار
- محدودیت حجم (معمولاً 5-10MB)

**داده‌های حساسی که ذخیره می‌شوند:**
- اطلاعات مشتریان و رمزهای عبور
- اطلاعات کامل حساب‌های بانکی
- تراکنش‌های مالی
- شماره کارت، شماره شبا
- مبالغ مالی

**توصیه:** استفاده از یک backend API و دیتابیس مناسب (PostgreSQL, MongoDB)

---

### 4. تولید ID با `Date.now()`
**موارد:** 8 مورد در پروژه

```typescript
id: Date.now().toString()
```

**مشکلات:**
- احتمال ID تکراری در صورت ایجاد سریع رکوردها
- غیرقابل پیش‌بینی نیست
- برای موارد چند نخی (multi-threaded) مناسب نیست

**راه حل:** استفاده از UUID:
```typescript
import { v4 as uuidv4 } from 'uuid';
id: uuidv4()
```

---

## 🟡 مشکلات مهم (High Priority)

### 5. کانفیگوریشن خطرناک Next.js
**فایل:** `next.config.mjs`
```javascript
eslint: {
  ignoreDuringBuilds: true,  // ❌ خطاهای ESLint نادیده گرفته می‌شوند
},
typescript: {
  ignoreBuildErrors: true,   // ❌ خطاهای TypeScript نادیده گرفته می‌شوند
},
```

**مشکلات:**
- باگ‌های TypeScript در زمان build شناسایی نمی‌شوند
- مشکلات کیفیت کد نادیده گرفته می‌شوند
- احتمال runtime errors افزایش می‌یابد

---

### 6. console.log های اضافی در کد Production
**تعداد:** 19 مورد در `app/customer/accounts/page.tsx`

```typescript
console.log(`[v0] میلیارد: "${numberPart}" = ${groups.billions}`)
console.log("[v0] اطلاعات استخراج شده:", {
```

**مشکلات:**
- افشای اطلاعات حساس در console مرورگر
- کاهش performance
- نشان دهنده کد debug نشده

---

### 7. عدم مدیریت خطا (Error Handling)
**مثال:** `app/admin/customers/page.tsx:100-108`
```typescript
const handleCopyCode = (code: string) => {
  navigator.clipboard.writeText(code)  // ❌ بدون try-catch
  setCopiedCode(code)
  // ...
}
```

**مشکلات:**
- عدم بررسی دسترسی به clipboard API
- عدم مدیریت خطا در موارد عدم موفقیت
- تجربه کاربری ضعیف در صورت بروز خطا

---

### 8. استفاده از `confirm` و `alert` به جای UI مدرن
**موارد:** چندین مورد
```typescript
if (confirm("آیا از حذف این مشتری اطمینان دارید؟")) {
```

**مشکلات:**
- UX ضعیف
- غیرقابل سفارشی‌سازی
- ناسازگار با طراحی مدرن
- بلاک کردن thread اصلی

**راه حل:** استفاده از AlertDialog component از shadcn/ui

---

### 9. عدم Validation مناسب ورودی‌ها
**مثال:** `app/admin/customers/page.tsx:49-59`
```typescript
const handleAddCustomer = (e: React.FormEvent) => {
  e.preventDefault()
  const newCustomer = addCustomer(formData)  // ❌ بدون validation
  // ...
}
```

**مشکلات:**
- عدم بررسی فرمت شماره تلفن
- عدم بررسی یکتا بودن username
- عدم بررسی قوت رمز عبور
- عدم بررسی فرمت شماره کارت و شبا
- عدم استفاده از Zod schema برای validation

---

### 10. عدم وجود eslint config
**نتیجه جستجو:** هیچ فایل `.eslintrc.*` یافت نشد

**مشکلات:**
- عدم یکپارچگی کد
- بیشتر شدن احتمال باگ
- عدم رعایت best practices

---

## 🟢 مشکلات بهینه‌سازی و کیفیت کد

### 11. عدم استفاده از Environment Variables
- رمزها و تنظیمات در کد هاردکد شده‌اند
- نیاز به فایل `.env` برای تنظیمات

---

### 12. عدم وجود تست
- هیچ فایل test وجود ندارد
- عدم پوشش تست
- احتمال بالای regression bugs

---

### 13. عدم وجود README و Documentation
- هیچ فایل README.md وجود ندارد
- عدم مستندات API
- عدم راهنمای نصب و راه‌اندازی

---

### 14. عدم Type Safety کامل
**مثال:** `app/admin/accounts/page.tsx:15-21`
```typescript
import {
  getCustomers,
  addTransaction,
  getTransactions,
  deleteTransaction,
  type Customer,
  type Transaction,  // ❌ این تایپ در lib/auth.ts وجود ندارد
  type BankAccount,
}
```

این ممکن است باعث خطای TypeScript شود.

---

### 15. عدم استفاده از React Server Components
- همه componentها `"use client"` هستند
- از مزایای Next.js 15 استفاده نشده
- Performance optimization کمتر

---

### 16. نبود Rate Limiting
- عدم محدودیت تعداد درخواست‌ها
- آسیب‌پذیر به brute force attacks

---

### 17. نبود Logging و Monitoring
- عدم ثبت فعالیت‌ها
- عدم امکان audit trail
- مشکل در debugging مسائل production

---

## 📊 خلاصه اولویت‌ها

### فوری (باید فوراً رفع شود):
1. ✅ رفع باگ `rejectCustomerRequest`
2. 🔒 رمزنگاری رمزهای عبور
3. 🔒 جایگزینی localStorage با backend API
4. 🔧 فعال کردن TypeScript و ESLint checks

### اولویت بالا:
5. 🛡️ اضافه کردن احراز هویت سمت سرور
6. 🗑️ حذف console.log ها
7. ✅ اضافه کردن validation با Zod
8. 🎨 جایگزینی alert/confirm با UI components

### اولویت متوسط:
9. 📝 نوشتن تست‌ها
10. 📚 نوشتن مستندات
11. 🔐 اضافه کردن CSRF protection
12. 📊 اضافه کردن logging و monitoring

---

## نتیجه‌گیری
این پروژه دارای **مشکلات امنیتی جدی** است که باید قبل از استفاده در محیط production برطرف شوند. مهمترین مشکل، **ذخیره اطلاعات حساس در localStorage بدون رمزنگاری** و **نبود یک backend مناسب** است.
