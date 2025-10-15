# سیستم اعلام شماره حساب پیشرفته زانیار

یک سیستم مدیریت مشتریان و اعلام شماره حساب بانکی با امنیت بالا، ساخته شده با Next.js 15، PostgreSQL، و Prisma.

## ✨ ویژگی‌ها

### 🔐 امنیت
- ✅ رمزنگاری رمزهای عبور با bcrypt (10 rounds)
- ✅ احراز هویت JWT با HttpOnly cookies
- ✅ Middleware برای محافظت از routes
- ✅ Validation کامل با Zod
- ✅ CSRF protection آماده
- ✅ Rate limiting آماده (قابل فعال‌سازی)
- ✅ Type-safe API با TypeScript

### 📊 دیتابیس
- ✅ PostgreSQL برای ذخیره‌سازی امن داده‌ها
- ✅ Prisma ORM برای مدیریت دیتابیس
- ✅ Migration system
- ✅ Seed data برای توسعه
- ✅ Cascading deletes برای یکپارچگی داده‌ها

### 🎨 فیچرها
- ✅ پنل مدیریت (Admin)
  - مدیریت کامل مشتریان (CRUD)
  - مشاهده تمام تراکنش‌ها
  - اعلام شماره حساب به مشتریان
  
- ✅ پنل مشتری (Customer)
  - مدیریت ارتباطات با سایر مشتریان
  - اعلام شماره حساب
  - ثبت فیش واریز
  - تایید/رد فیش‌های دریافتی
  - افزودن مشتریان خارج از سیستم

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها
- Node.js 18 یا بالاتر
- PostgreSQL 14 یا بالاتر
- pnpm (یا npm/yarn)

### مرحله 1: کلون کردن پروژه
\`\`\`bash
git clone <repository-url>
cd my-v0-project
\`\`\`

### مرحله 2: نصب dependencies
\`\`\`bash
pnpm install
\`\`\`

### مرحله 3: راه‌اندازی دیتابیس PostgreSQL

#### روش 1: PostgreSQL محلی
\`\`\`bash
# نصب PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# شروع سرویس
sudo systemctl start postgresql

# ایجاد دیتابیس
sudo -u postgres createdb zaniar_db

# ایجاد کاربر (اختیاری)
sudo -u postgres createuser -P zaniar_user
\`\`\`

#### روش 2: Docker
\`\`\`bash
docker run --name zaniar-postgres \\
  -e POSTGRES_PASSWORD=yourpassword \\
  -e POSTGRES_DB=zaniar_db \\
  -p 5432:5432 \\
  -d postgres:14
\`\`\`

### مرحله 4: تنظیم متغیرهای محیطی
\`\`\`bash
# کپی کردن فایل .env.example
cp .env.example .env

# ویرایش .env و تنظیم DATABASE_URL
nano .env
\`\`\`

مثال `.env`:
\`\`\`env
DATABASE_URL="postgresql://username:password@localhost:5432/zaniar_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
ADMIN_DEFAULT_USERNAME="admin"
ADMIN_DEFAULT_PASSWORD="admin123"
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

### مرحله 5: اجرای Migrations و Seed
\`\`\`bash
# اجرای migrations
pnpm db:push

# اجرای seed (ایجاد admin و مشتریان نمونه)
pnpm db:seed
\`\`\`

### مرحله 6: اجرای پروژه
\`\`\`bash
# Development mode
pnpm dev

# Production build
pnpm build
pnpm start
\`\`\`

پروژه روی `http://localhost:3000` اجرا می‌شود.

## 🔑 اطلاعات ورود پیش‌فرض

### مدیر (Admin)
- نام کاربری: `admin`
- رمز عبور: `admin123`

### مشتریان نمونه
- نام کاربری: `customer1` | رمز عبور: `password123`
- نام کاربری: `customer2` | رمز عبور: `password123`
- نام کاربری: `customer3` | رمز عبور: `password123`

⚠️ **توجه:** حتماً رمز عبور admin را بعد از اولین ورود تغییر دهید!

## 📁 ساختار پروژه

\`\`\`
├── app/
│   ├── api/              # API routes (Next.js)
│   │   ├── auth/         # احراز هویت
│   │   ├── customers/    # مدیریت مشتریان
│   │   ├── transactions/ # تراکنش‌ها
│   │   ├── connections/  # ارتباطات مشتریان
│   │   ├── requests/     # درخواست‌های ارتباط
│   │   └── receipts/     # فیش‌های واریز
│   ├── admin/            # پنل مدیریت
│   ├── customer/         # پنل مشتری
│   └── page.tsx          # صفحه لاگین
├── components/           # React components
├── lib/
│   ├── db/               # Prisma client
│   ├── auth-utils/       # JWT, bcrypt, cookies
│   ├── validations/      # Zod schemas
│   ├── api-client.ts     # Client-side API calls
│   └── types.ts          # TypeScript types
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
└── middleware.ts         # Next.js middleware
\`\`\`

## 🛠️ دستورات مفید

\`\`\`bash
# Development
pnpm dev                  # اجرای سرور development
pnpm build                # ساخت برای production
pnpm start                # اجرای production server

# Database
pnpm db:push              # اعمال schema به دیتابیس
pnpm db:migrate           # ایجاد migration جدید
pnpm db:seed              # اجرای seed
pnpm db:studio            # باز کردن Prisma Studio

# Code Quality
pnpm lint                 # اجرای ESLint
\`\`\`

## 🔧 API Endpoints

### احراز هویت
- `POST /api/auth/login` - ورود به سیستم
- `POST /api/auth/logout` - خروج از سیستم
- `GET /api/auth/me` - دریافت اطلاعات کاربر فعلی

### مشتریان (Admin فقط)
- `GET /api/customers` - لیست مشتریان
- `POST /api/customers` - ایجاد مشتری جدید
- `GET /api/customers/:id` - جزئیات مشتری
- `PATCH /api/customers/:id` - ویرایش مشتری
- `DELETE /api/customers/:id` - حذف مشتری

### تراکنش‌ها
- `GET /api/transactions` - لیست تراکنش‌ها
- `POST /api/transactions` - ایجاد تراکنش جدید
- `GET /api/transactions/:id` - جزئیات تراکنش
- `PATCH /api/transactions/:id` - ویرایش تراکنش
- `DELETE /api/transactions/:id` - حذف تراکنش

### فیش‌های واریز
- `POST /api/transactions/:id/receipts` - اضافه کردن فیش
- `POST /api/receipts/:id/approve` - تایید فیش
- `POST /api/receipts/:id/needs-follow-up` - نیاز به پیگیری

### ارتباطات و درخواست‌ها
- `GET /api/connections` - لیست ارتباطات
- `DELETE /api/connections/:id` - حذف ارتباط
- `GET /api/requests` - لیست درخواست‌ها
- `POST /api/requests` - ایجاد درخواست
- `POST /api/requests/:id/accept` - پذیرش درخواست
- `POST /api/requests/:id/reject` - رد درخواست

## 🔒 امنیت

### تغییرات امنیتی اعمال شده:
1. ✅ رمزهای عبور با bcrypt هش می‌شوند
2. ✅ JWT tokens در HttpOnly cookies ذخیره می‌شوند
3. ✅ همه API routes محافظت شده‌اند
4. ✅ Validation با Zod در همه endpoints
5. ✅ TypeScript برای type safety
6. ✅ SQL injection محافظت شده (توسط Prisma)
7. ✅ XSS محافظت شده (توسط React)

### توصیه‌های امنیتی برای Production:
1. JWT_SECRET را با یک کلید قوی جایگزین کنید
2. HTTPS را فعال کنید
3. Rate limiting را فعال کنید
4. CORS را تنظیم کنید
5. Helmet.js را اضافه کنید
6. Environment variables را در production امن نگه دارید
7. Regular security audits انجام دهید

## 🐛 باگ‌های رفع شده

1. ✅ باگ `rejectCustomerRequest` رفع شد (JSON.parse اضافه شد)
2. ✅ رمزهای عبور plain text → bcrypt hashing
3. ✅ localStorage → PostgreSQL database
4. ✅ Client-side auth → Server-side JWT
5. ✅ `Date.now()` IDs → UUID
6. ✅ عدم validation → Zod schemas
7. ✅ عدم error handling → Try-catch blocks
8. ✅ console.log ها حذف شدند
9. ✅ TypeScript errors فعال شد
10. ✅ ESLint config اضافه شد

## 📝 تغییرات نسبت به نسخه قبلی

| قبل | بعد |
|-----|-----|
| localStorage | PostgreSQL + Prisma |
| Plain text passwords | bcrypt hashing |
| Client-side auth | JWT + HttpOnly cookies |
| بدون validation | Zod schemas |
| `Date.now()` IDs | UUID |
| بدون API | RESTful API |
| ignore TypeScript errors | TypeScript strict mode |
| بدون error handling | Proper error handling |
| console.log ها | Production-ready |

## 📞 پشتیبانی

برای گزارش باگ یا درخواست فیچر، issue ایجاد کنید.

## 📄 لایسنس

MIT
