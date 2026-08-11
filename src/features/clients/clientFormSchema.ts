import { z } from 'zod'

const PHONE_REGEX = /^\(\d{2}\) \d{4,5}-\d{4}$/

export const addressSchema = z.object({
  zip: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

export const clientFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome.'),
  email: z.email('Informe um e-mail válido.'),
  phone: z
    .string()
    .min(1, 'Informe o telefone.')
    .regex(PHONE_REGEX, 'Telefone inválido.'),
  type: z.enum(['PF', 'PJ']),
  document: z.string().optional(),
  address: addressSchema,
})

export type ClientFormValues = z.infer<typeof clientFormSchema>

export const emptyClientFormValues: ClientFormValues = {
  name: '',
  email: '',
  phone: '',
  type: 'PF',
  document: '',
  address: {
    zip: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  },
}
