import { z } from 'zod'

export const clientPortalLoginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
})

export type ClientPortalLoginInput = z.infer<typeof clientPortalLoginSchema>
