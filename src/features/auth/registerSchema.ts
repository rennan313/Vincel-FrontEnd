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
    companyType: z.enum(['PF', 'PJ']),
    companyDocument: z.string().min(1, 'Informe o documento do escritório.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>
