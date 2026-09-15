import { z } from 'zod'

const PHONE_REGEX = /^\(\d{2}\) \d{4,5}-\d{4}$/

export const clientInviteSchema = z.object({
  name: z.string().min(1, 'Informe o nome.'),
  email: z.email('Informe um e-mail válido.'),
  phone: z
    .string()
    .min(1, 'Informe o telefone.')
    .regex(PHONE_REGEX, 'Telefone inválido.'),
  type: z.enum(['PF', 'PJ']),
})

export type ClientInviteFormValues = z.infer<typeof clientInviteSchema>

export const emptyClientInviteFormValues: ClientInviteFormValues = {
  name: '',
  email: '',
  phone: '',
  type: 'PF',
}
