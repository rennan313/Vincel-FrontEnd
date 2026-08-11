import { z } from 'zod'
import { passwordMeetsCriteria } from '@/features/auth/passwordCriteria'
import { ASSIGNABLE_ROLES } from '@/features/users/usersApi'

const userBaseSchema = z.object({
  name: z.string().min(2, 'Informe o nome completo.'),
  email: z.email('Informe um e-mail válido.'),
  role: z.enum(ASSIGNABLE_ROLES, { message: 'Selecione um perfil.' }),
})

export const createUserFormSchema = userBaseSchema.extend({
  password: z
    .string()
    .refine(passwordMeetsCriteria, 'A senha não atende aos critérios de segurança.'),
})

export const updateUserFormSchema = userBaseSchema

export type UserFormValues = z.infer<typeof userBaseSchema> & { password: string }

export const emptyUserFormValues: UserFormValues = {
  name: '',
  email: '',
  role: 'ARCHITECT',
  password: '',
}
