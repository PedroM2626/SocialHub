import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]

const communitySchema = z.object({
  name: z
    .string()
    .min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' })
    .max(50),
  description: z
    .string()
    .min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' })
    .max(200),
  cover_image: z
    .any()
    .optional()
    .refine(
      (files) =>
        !files ||
        (files instanceof FileList &&
          files.length > 0 &&
          files[0].size <= MAX_FILE_SIZE &&
          ACCEPTED_IMAGE_TYPES.includes(files[0].type)),
      'Arquivo inválido. Verifique o tamanho (máx 5MB) e o formato (JPG, PNG, GIF, WEBP).',
    ),
  category: z.string().min(2, { message: 'A categoria é obrigatória.' }),
  is_private: z.boolean().default(false),
})

export type CommunityFormValues = z.infer<typeof communitySchema>

interface CreateCommunityFormProps {
  onSubmit: (data: CommunityFormValues) => void
  onCancel: () => void
}

export const CreateCommunityForm = ({
  onSubmit,
  onCancel,
}: CreateCommunityFormProps) => {
  const form = useForm<CommunityFormValues>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
      name: '',
      description: '',
      cover_image: undefined,
      category: '',
      is_private: false,
    },
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImagePreview(URL.createObjectURL(file))
      form.setValue('cover_image', e.target.files as FileList)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    form.setValue('cover_image', undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Comunidade</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Amantes de Café" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o propósito da sua comunidade..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Hobbies, Tecnologia, Esportes"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cover_image"
          render={() => (
            <FormItem>
              <FormLabel>Imagem de Capa (Opcional)</FormLabel>
              <FormControl>
                <div className="w-full p-2 border-2 border-dashed rounded-lg border-border/50 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    onChange={handleFileChange}
                  />
                  {!imagePreview ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Escolher Arquivo
                    </Button>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="rounded-lg max-h-40 w-auto mx-auto"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Recomendado: 1200x400px, máx 5MB.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_private"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Comunidade Privada</FormLabel>
                <FormDescription>
                  Apenas membros convidados poderão ver e participar.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Criar Comunidade</Button>
        </div>
      </form>
    </Form>
  )
}
