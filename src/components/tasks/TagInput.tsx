import { useState } from 'react'
import { X, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Tag } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

interface TagInputProps {
  value: Tag[]
  onChange: (tags: Tag[]) => void
  availableTags: Tag[]
  onTagCreate: (tag: Omit<Tag, 'id'>) => Tag
}

export const TagInput = ({
  value,
  onChange,
  availableTags,
  onTagCreate,
}: TagInputProps) => {
  const [open, setOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#8b5cf6')

  const handleSelect = (tag: Tag) => {
    if (!value.some((t) => t.id === tag.id)) {
      onChange([...value, tag])
    }
    setOpen(false)
  }

  const handleRemove = (tagId: string) => {
    onChange(value.filter((t) => t.id !== tagId))
  }

  const handleCreate = () => {
    if (newTagName.trim() === '') return
    const newTag = onTagCreate({ name: newTagName, color: newTagColor })
    onChange([...value, newTag])
    setNewTagName('')
    setNewTagColor('#8b5cf6')
    setOpen(false)
  }

  const unselectedTags = availableTags.filter(
    (tag) => !value.some((selectedTag) => selectedTag.id === tag.id),
  )

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-[40px]">
        {value.map((tag) => (
          <Badge
            key={tag.id}
            className="flex items-center gap-1 text-sm"
            style={{
              backgroundColor: tag.color,
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemove(tag.id)}
              className="rounded-full hover:bg-black/20 focus:outline-none"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[250px]">
            <Command>
              <CommandInput placeholder="Buscar ou criar tag..." />
              <CommandList>
                <CommandEmpty>
                  <div className="p-2 space-y-2">
                    <p className="text-sm text-center">
                      Nenhuma tag encontrada.
                    </p>
                    <Input
                      placeholder="Nome da nova tag"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <label htmlFor="tag-color" className="text-sm">
                        Cor:
                      </label>
                      <Input
                        id="tag-color"
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-10 h-10 p-1"
                      />
                    </div>
                    <Button size="sm" className="w-full" onClick={handleCreate}>
                      Criar Tag
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup heading="Tags existentes">
                  {unselectedTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleSelect(tag)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
