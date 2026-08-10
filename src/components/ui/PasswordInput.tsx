import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input, type InputProps } from '@/components/ui/Input'

export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputProps, 'type' | 'rightSlot'>
>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="text-(--th-text-muted)"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
      {...props}
    />
  )
})
