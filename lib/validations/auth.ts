import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3, 'نام کاربری باید حداقل 3 کاراکتر باشد'),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
})

export const registerCustomerSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد'),
  username: z.string().min(3, 'نام کاربری باید حداقل 3 کاراکتر باشد'),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
  phone: z.string().min(10, 'شماره تلفن معتبر نیست'),
  address: z.string().min(5, 'آدرس باید حداقل 5 کاراکتر باشد'),
  uniqueCode: z.string().optional(),
  preferredCurrency: z.enum(['ریال', 'تومان']).optional(),
})

export const updateCustomerSchema = registerCustomerSchema.partial()

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
