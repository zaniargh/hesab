# راهنمای سریع شروع کار (5 دقیقه)

این راهنما برای کسانی است که می‌خواهند **سریع** پروژه را اجرا کنند.

## گام 1: PostgreSQL را آماده کنید (2 دقیقه)

### روش سریع: Docker

```bash
docker run --name zaniar-postgres \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=zaniar_db \
  -p 5432:5432 \
  -d postgres:14
```

## گام 2: کلون و نصب (2 دقیقه)

```bash
# کلون پروژه
git clone <repository-url>
cd my-v0-project

# نصب dependencies
pnpm install
# یا: npm install
```

## گام 3: تنظیم .env (30 ثانیه)

```bash
# کپی فایل .env.example
cp .env.example .env
```

**فایل `.env` را ویرایش کنید:**

```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/zaniar_db"
JWT_SECRET="my-super-secret-key-change-me"
```

💡 **نکته:** اگر از Docker استفاده کردید، همین تنظیمات کافیه!

## گام 4: راه‌اندازی دیتابیس (30 ثانیه)

```bash
# اعمال schema + seed
pnpm db:push && pnpm db:seed
```

**خروجی موفق:**
```
✅ Admin ایجاد شد: { username: 'admin' }
✅ مشتری 1 ایجاد شد: { username: 'customer1', uniqueCode: 'ZAN-ABC123' }
...
```

## گام 5: اجرا! (همین الان!)

```bash
pnpm dev
```

باز کنید: **http://localhost:3000**

## اطلاعات ورود 🔑

### مدیر:
- نام کاربری: `admin`
- رمز: `admin123`

### مشتری:
- نام کاربری: `customer1`
- رمز: `password123`

---

## ❌ خطا؟ عیب‌یابی سریع

### PostgreSQL به کار نیفتاد؟

```bash
# بررسی اجرای Docker
docker ps

# اگر نیست، شروعش کنید
docker start zaniar-postgres
```

### خطای "Can't reach database"?

```bash
# بررسی DATABASE_URL در .env
cat .env | grep DATABASE_URL

# باید چیزی شبیه این باشد:
# DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/zaniar_db"
```

### پورت 3000 اشغال است؟

```bash
# استفاده از پورت دیگر
PORT=3001 pnpm dev
```

---

## ✅ همه چیز کار کرد؟

حالا می‌توانید:

1. ✅ با admin وارد شوید و مشتری جدید بسازید
2. ✅ با customer وارد شوید و تراکنش ایجاد کنید
3. ✅ Prisma Studio را باز کنید: `pnpm db:studio`

---

## 📚 مطالعه بیشتر

- راهنمای کامل: `README.md`
- راهنمای نصب دقیق: `SETUP_GUIDE.md`
- API Documentation: `README.md#api-endpoints`

موفق باشید! 🚀
