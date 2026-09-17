import { useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { Camera, Loader2, X } from 'lucide-react'
import { ApiError } from '@/lib/apiClient'
import type { BriefingQuestion } from '@/features/projectBriefing/briefingTypes'

const ALLOWED_PHOTO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const PHOTO_MAX_BYTES = 10 * 1024 * 1024

interface BriefingPhotosFieldProps {
  question: BriefingQuestion
  value: string
  onChange: (value: string) => void
  /** Upload one file for this question — the public briefing page and the
   * client portal's own briefing page hit different (public vs.
   * client-jwt) endpoints, so the actual request is injected here. */
  uploadPhoto: (questionId: string, file: File) => Promise<{ url: string }>
}

/** Renders/edits a PHOTOS answer as a thumbnail grid. The value stays the
 * same newline-joined-URLs string LINKS uses — this just builds that
 * string from uploads instead of typed text. */
export function BriefingPhotosField({
  question,
  value,
  onChange,
  uploadPhoto,
}: BriefingPhotosFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const urls = value ? value.split('\n').filter(Boolean) : []

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    if (files.some((file) => !ALLOWED_PHOTO_TYPES.has(file.type))) {
      toast.error('Formato inválido — envie PNG, JPEG ou WEBP.')
      return
    }
    if (files.some((file) => file.size > PHOTO_MAX_BYTES)) {
      toast.error('Imagem muito grande — o limite é 10MB por foto.')
      return
    }

    setUploading(true)
    try {
      const uploaded = await Promise.all(
        files.map((file) => uploadPhoto(question.id, file)),
      )
      onChange([...urls, ...uploaded.map((item) => item.url)].join('\n'))
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível enviar a foto.',
      )
    } finally {
      setUploading(false)
    }
  }

  function handleRemove(url: string) {
    onChange(urls.filter((existing) => existing !== url).join('\n'))
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm text-(--th-text)">{question.label}</label>
      <div className="flex flex-wrap gap-2">
        {urls.map((url) => (
          <div
            key={url}
            className="group relative size-20 shrink-0 overflow-hidden rounded-lg border border-(--th-border)"
          >
            <img src={url} alt="" className="size-full object-cover" />
            <button
              type="button"
              aria-label="Remover foto"
              onClick={() => handleRemove(url)}
              className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-(--th-border) text-(--th-text-muted) transition-colors hover:bg-(--th-bg-elevated) disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
          <span className="text-[11px]">{uploading ? 'Enviando...' : 'Adicionar'}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  )
}
