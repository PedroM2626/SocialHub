import { useState, useRef } from 'react'
import { Image as ImageIcon, Send, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '../ui/use-toast'
import { cn } from '@/lib/utils'
import { Input } from '../ui/input'
import { Card, CardContent, CardFooter } from '../ui/card'

interface CreatePostProps {
  onPost: (post: {
    content: string
    hashtags: string
    imageUrl?: string
  }) => void
}

export const CreatePost = ({ onPost }: CreatePostProps) => {
  const [content, setContent] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

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
    if (!content.trim() || !user) return

    setIsSubmitting(true)
    await new Promise((res) => setTimeout(res, 500))

    onPost({ content, hashtags, imageUrl: imagePreview || undefined })

    setContent('')
    setHashtags('')
    handleRemoveImage()
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setIsSubmitting(false)
    toast({
      title: 'Sucesso!',
      description: 'Seu post foi publicado.',
    })
  }

  return (
    <Card className="glass-card transition-all duration-300 hover:shadow-deep">
      <form onSubmit={handleSubmit}>
        <CardContent className="p-4 pb-0">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={user?.profile_image} />
              <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold">{user?.name}</span>
          </div>
          <div className="w-full mt-4">
            <Textarea
              ref={textareaRef}
              placeholder={`No que você está pensando, ${user?.name.split(' ')[0]}?`}
              className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg resize-none p-0 overflow-hidden min-h-[60px]"
              value={content}
              onChange={handleTextareaInput}
              rows={2}
            />
            {imagePreview && (
              <div className="mt-4 relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="rounded-lg max-h-80 w-full object-cover border border-border/50"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="mt-4">
              <Input
                placeholder="#hashtags"
                className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 flex justify-between items-center border-t border-border/50 mt-4">
          <div className="flex items-center gap-1">
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
            className={cn(
              'rounded-full font-bold transition-all duration-300',
              'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105',
            )}
          >
            {isSubmitting ? 'Publicando...' : 'Publicar'}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
