import { useRef, useEffect, useState } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Palette,
  CaseSensitive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface RichTextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const fonts = [
  { name: 'Padrão', value: 'Inter' },
  { name: 'Display', value: 'Poppins' },
  { name: 'Serif', value: 'serif' },
  { name: 'Mono', value: 'monospace' },
]

export const RichTextInput = ({
  value,
  onChange,
  placeholder,
}: RichTextInputProps) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    execCmd('foreColor', e.target.value)
  }

  if (!isMounted) return null

  return (
    <div className="border border-input rounded-md focus-within:ring-2 focus-within:ring-ring">
      <div className="flex items-center p-1 border-b border-input flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => execCmd('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => execCmd('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => execCmd('underline')}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => execCmd('strikeThrough')}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-auto">
            <input
              type="color"
              onChange={handleColorChange}
              className="w-8 h-8 border-none cursor-pointer"
            />
          </PopoverContent>
        </Popover>
        <Select onValueChange={(value) => execCmd('fontName', value)}>
          <SelectTrigger className="w-[120px] h-8 ml-2">
            <CaseSensitive className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className={cn(
          'min-h-[80px] p-2 text-sm outline-none prose prose-sm dark:prose-invert max-w-full text-foreground bg-transparent',
          'before:content-[attr(data-placeholder)] before:text-muted-foreground before:absolute before:left-2 before:top-2',
          value ? 'before:hidden' : 'before:block',
        )}
        style={{ position: 'relative' }}
      />
    </div>
  )
}
