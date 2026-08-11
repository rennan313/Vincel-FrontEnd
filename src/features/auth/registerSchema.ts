import { z } from 'zod'
import { passwordMeetsCriteria } from '@/features/auth/passwordCriteria'

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Informe seu nome completo.'),
    email: z.email('Informe um e-mail válido.'),
    password: z
      .string()
      .refine(passwordMeetsCriteria, 'A senha não atende aos critérios de segurança.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>
