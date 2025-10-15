import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 شروع seed...')

  // حذف داده‌های موجود (برای development)
  if (process.env.NODE_ENV === 'development') {
    await prisma.receipt.deleteMany()
    await prisma.bankAccount.deleteMany()
    await prisma.customerTransaction.deleteMany()
    await prisma.customerRequest.deleteMany()
    await prisma.customerConnection.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.admin.deleteMany()
    console.log('✅ داده‌های قبلی پاک شد')
  }

  // ایجاد Admin پیش‌فرض
  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_DEFAULT_PASSWORD || 'admin123',
    10
  )

  const admin = await prisma.admin.upsert({
    where: { username: process.env.ADMIN_DEFAULT_USERNAME || 'admin' },
    update: {},
    create: {
      username: process.env.ADMIN_DEFAULT_USERNAME || 'admin',
      password: hashedPassword,
    },
  })

  console.log('✅ Admin ایجاد شد:', { username: admin.username })

  // ایجاد چند مشتری نمونه
  const customers = []
  for (let i = 1; i <= 3; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: `مشتری نمونه ${i}`,
        username: `customer${i}`,
        password: await bcrypt.hash('password123', 10),
        phone: `0912345678${i}`,
        address: `آدرس نمونه ${i}`,
        uniqueCode: `ZAN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        preferredCurrency: 'تومان',
      },
    })
    customers.push(customer)
    console.log(`✅ مشتری ${i} ایجاد شد:`, { username: customer.username, uniqueCode: customer.uniqueCode })
  }

  console.log('\n🎉 Seed با موفقیت انجام شد!')
  console.log('\n📝 اطلاعات ورود:')
  console.log('👨‍💼 Admin: username=admin, password=admin123')
  console.log('👤 Customer1: username=customer1, password=password123')
  console.log('👤 Customer2: username=customer2, password=password123')
  console.log('👤 Customer3: username=customer3, password=password123')
}

main()
  .catch((e) => {
    console.error('❌ خطا در seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
