import { z } from 'zod'

export const createConnectionRequestSchema = z.object({
  uniqueCode: z.string().min(3, 'کد یکتا باید حداقل 3 کاراکتر باشد'),
  customName: z.string().min(2, 'نام سفارشی باید حداقل 2 کاراکتر باشد'),
})

export const addOfflineCustomerSchema = z.object({
  customerName: z.string().min(2, 'نام مشتری باید حداقل 2 کاراکتر باشد'),
  customName: z.string().min(2, 'نام سفارشی باید حداقل 2 کاراکتر باشد'),
})

export type CreateConnectionRequestInput = z.infer<typeof createConnectionRequestSchema>
export type AddOfflineCustomerInput = z.infer<typeof addOfflineCustomerSchema>
