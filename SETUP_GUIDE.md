# راهنمای نصب و راه‌اندازی کامل

این راهنما شما را قدم به قدم در نصب و راه‌اندازی پروژه همراهی می‌کند.

## قدم 1: نصب PostgreSQL

### گزینه A: نصب محلی (Ubuntu/Debian)

\`\`\`bash
# آپدیت لیست پکیج‌ها
sudo apt update

# نصب PostgreSQL
sudo apt install postgresql postgresql-contrib

# شروع سرویس PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# ورود به PostgreSQL
sudo -u postgres psql

# در PostgreSQL shell:
CREATE DATABASE zaniar_db;
CREATE USER zaniar_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE zaniar_db TO zaniar_user;
\\q
\`\`\`

### گزینه B: استفاده از Docker

\`\`\`bash
# اجرای PostgreSQL در Docker
docker run --name zaniar-postgres \\
  -e POSTGRES_PASSWORD=your_strong_password \\
  -e POSTGRES_USER=zaniar_user \\
  -e POSTGRES_DB=zaniar_db \\
  -p 5432:5432 \\
  -v zaniar-data:/var/lib/postgresql/data \\
  -d postgres:14

# بررسی اجرای container
docker ps

# دیدن لاگ‌ها
docker logs zaniar-postgres
\`\`\`

### گزینه C: استفاده از سرویس ابری

می‌توانید از سرویس‌های زیر استفاده کنید:
- **Supabase** (رایگان): https://supabase.com
- **Neon** (رایگان): https://neon.tech
- **Railway** (رایگان): https://railway.app
- **Render** (رایگان): https://render.com

## قدم 2: کلون کردن پروژه و نصب Dependencies

\`\`\`bash
# کلون پروژه
git clone <repository-url>
cd my-v0-project

# نصب pnpm (اگر ندارید)
npm install -g pnpm

# نصب dependencies
pnpm install
\`\`\`

## قدم 3: تنظیم فایل .env

\`\`\`bash
# کپی کردن فایل نمونه
cp .env.example .env

# ویرایش فایل .env
nano .env  # یا vim یا هر ادیتور دیگری
\`\`\`

محتوای فایل `.env`:

\`\`\`env
# Database - URL دیتابیس PostgreSQL خود را اینجا قرار دهید
DATABASE_URL="postgresql://zaniar_user:your_strong_password@localhost:5432/zaniar_db?schema=public"

# JWT Secret - یک کلید امن تولید کنید
# روش تولید: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Admin Default - اطلاعات admin پیش‌فرض
ADMIN_DEFAULT_USERNAME="admin"
ADMIN_DEFAULT_PASSWORD="admin123"  # حتما بعد از اولین ورود تغییر دهید!

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

### تولید JWT Secret امن:

\`\`\`bash
# روش 1: با OpenSSL
openssl rand -base64 32

# روش 2: با Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
\`\`\`

## قدم 4: راه‌اندازی دیتابیس

\`\`\`bash
# 1. اعمال schema به دیتابیس
pnpm db:push

# 2. اجرای seed برای ایجاد داده‌های اولیه
pnpm db:seed

# خروجی باید چیزی شبیه این باشد:
# 🌱 شروع seed...
# ✅ داده‌های قبلی پاک شد
# ✅ Admin ایجاد شد: { username: 'admin' }
# ✅ مشتری 1 ایجاد شد: { username: 'customer1', uniqueCode: 'ZAN-ABC123' }
# ...
\`\`\`

## قدم 5: اجرای پروژه

### Development Mode
\`\`\`bash
pnpm dev
\`\`\`

پروژه روی http://localhost:3000 اجرا می‌شود.

### Production Mode
\`\`\`bash
# Build
pnpm build

# Start
pnpm start
\`\`\`

## قدم 6: تست ورود به سیستم

### به عنوان Admin:
1. به http://localhost:3000 بروید
2. نام کاربری: `admin`
3. رمز عبور: `admin123`

### به عنوان مشتری:
1. به http://localhost:3000 بروید
2. نام کاربری: `customer1` (یا customer2, customer3)
3. رمز عبور: `password123`

## ⚠️ مهم: تغییر رمز عبور Admin

بعد از اولین ورود، حتماً رمز عبور admin را تغییر دهید:

1. وارد پنل admin شوید
2. به قسمت "پروفایل" بروید
3. رمز عبور جدید تنظیم کنید
4. فایل `.env` را آپدیت کنید و `ADMIN_DEFAULT_PASSWORD` را تغییر دهید

## 🔍 عیب‌یابی مشکلات رایج

### خطا: "connect ECONNREFUSED 127.0.0.1:5432"

**علت:** PostgreSQL در حال اجرا نیست.

**راه حل:**
\`\`\`bash
# اگر از PostgreSQL محلی استفاده می‌کنید:
sudo systemctl start postgresql

# اگر از Docker استفاده می‌کنید:
docker start zaniar-postgres
\`\`\`

### خطا: "password authentication failed"

**علت:** رمز عبور دیتابیس در `DATABASE_URL` اشتباه است.

**راه حل:** فایل `.env` را بررسی و `DATABASE_URL` را تصحیح کنید.

### خطا: "Prisma Client is not configured"

**علت:** Prisma generate اجرا نشده است.

**راه حل:**
\`\`\`bash
pnpm prisma generate
\`\`\`

### خطا: "Port 3000 is already in use"

**علت:** پورت 3000 قبلاً استفاده شده است.

**راه حل:**
\`\`\`bash
# پیدا کردن پروسس
lsof -ti:3000

# کشتن پروسس
kill -9 $(lsof -ti:3000)

# یا استفاده از پورت دیگری
PORT=3001 pnpm dev
\`\`\`

## 🛠️ دستورات مفید

\`\`\`bash
# مشاهده دیتابیس با Prisma Studio
pnpm db:studio

# ریست کردن دیتابیس (حذف همه داده‌ها)
pnpm db:push --force-reset
pnpm db:seed

# بررسی لاگ‌های PostgreSQL (محلی)
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# بررسی لاگ‌های PostgreSQL (Docker)
docker logs -f zaniar-postgres

# بررسی اتصال به دیتابیس
pnpm prisma db pull
\`\`\`

## 📦 آماده‌سازی برای Production

### 1. تنظیمات امنیتی

\`\`\`env
NODE_ENV="production"
JWT_SECRET="<generate-a-very-strong-random-key>"
ADMIN_DEFAULT_PASSWORD="<change-to-strong-password>"
\`\`\`

### 2. دیتابیس Production

اگر از سرویس ابری استفاده می‌کنید:

\`\`\`bash
# مثال: Supabase
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
\`\`\`

### 3. اجرای Migration

\`\`\`bash
# در production از migrate استفاده کنید (بجای db:push)
pnpm prisma migrate deploy
\`\`\`

### 4. Build و Deploy

\`\`\`bash
# Build
pnpm build

# اجرا
NODE_ENV=production pnpm start
\`\`\`

## 🚀 Deploy روی Vercel

\`\`\`bash
# نصب Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel
\`\`\`

در Vercel Dashboard:
1. به Settings → Environment Variables بروید
2. تمام متغیرهای `.env` را اضافه کنید
3. DATABASE_URL را از سرویس دیتابیس ابری خود بگیرید

## 📞 کمک و پشتیبانی

اگر مشکلی داشتید:
1. ابتدا بخش Troubleshooting را بخوانید
2. لاگ‌های خطا را بررسی کنید
3. Issue ایجاد کنید

موفق باشید! 🎉
