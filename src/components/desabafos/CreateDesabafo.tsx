import { useState, useRef } from 'react'
import { Image as ImageIcon, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

interface CreateDesabafoProps {
  onDesabafo: (desabafo: {
    content: string
    hashtags: string
    imageUrl?: string
  }) => void
}

export const CreateDesabafo = ({ onDesabafo }: CreateDesabafoProps) => {
  const [content, setContent] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    await new Promise((res) => setTimeout(res, 500))

    onDesabafo({ content, hashtags, imageUrl: imagePreview || undefined })

    setContent('')
    setHashtags('')
    handleRemoveImage()
    setIsSubmitting(false)
    toast({
      title: 'Sucesso!',
      description: 'Seu desabafo foi publicado anonimamente.',
    })
  }

  return (
    <Card className="glass-card transition-all duration-300 hover:shadow-deep">
      <form onSubmit={handleSubmit}>
        <CardContent className="p-4 pb-0">
          <div className="w-full">
            <Textarea
              placeholder="Compartilhe o que está em seu coração... (será anônimo)"
              className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg resize-none p-0 overflow-hidden min-h-[60px]"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {imagePreview && (
              <div className="mt-4 relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="rounded-lg max-h-60 w-auto border border-border/50"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="mt-4">
              <Input
                placeholder="#desabafo #anonimo"
                className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 flex justify-between items-center border-t border-border/50 mt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-muted-foreground hover:text-primary"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
              onChange={handleFileChange}
            />
          </div>
          <Button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="rounded-full"
          >
            {isSubmitting ? 'Publicando...' : 'Publicar'}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
