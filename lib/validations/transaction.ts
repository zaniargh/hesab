import { z } from 'zod'

export const bankAccountSchema = z.object({
  accountHolderName: z.string().min(2, 'نام صاحب حساب الزامی است'),
  accountNumber: z.string().optional(),
  sheba: z.string().min(20, 'شماره شبا باید حداقل 20 کاراکتر باشد'),
  cardNumber: z.string().min(16, 'شماره کارت باید 16 رقم باشد'),
  bankName: z.string().min(2, 'نام بانک الزامی است'),
  declaredAmount: z.string().min(1, 'مبلغ اعلامی الزامی است'),
})

export const receiptSchema = z.object({
  amount: z.string().min(1, 'مبلغ الزامی است'),
  trackingCode: z.string().min(1, 'کد پیگیری الزامی است'),
  depositId: z.string().min(1, 'شناسه واریز الزامی است'),
  description: z.string().min(1, 'توضیحات الزامی است'),
  depositorName: z.string().min(2, 'نام واریزکننده الزامی است'),
  receiptDate: z.string().min(1, 'تاریخ فیش الزامی است'),
})

export const createTransactionSchema = z.object({
  toCustomerId: z.string().uuid('شناسه مشتری نامعتبر است'),
  description: z.string().min(5, 'توضیحات باید حداقل 5 کاراکتر باشد'),
  type: z.enum(['deposit_from_customer', 'deposit_to_customer']),
  declaredTotalAmount: z.string().optional(),
  accounts: z.array(bankAccountSchema).min(1, 'حداقل یک حساب بانکی الزامی است'),
})

export type BankAccountInput = z.infer<typeof bankAccountSchema>
export type ReceiptInput = z.infer<typeof receiptSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
