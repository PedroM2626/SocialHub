import { useState } from 'react'
import { tags as mockTags } from '@/lib/mock-data'
import { Tag } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

const GerenciarTags = () => {
  const [tags, setTags] = useState<Tag[]>(mockTags)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#8b5cf6')
  const { toast } = useToast()

  const handleCreate = () => {
    if (!newTagName.trim()) return
    const newTag = {
      id: `tag-${Date.now()}`,
      name: newTagName,
      color: newTagColor,
    }
    setTags((prev) => [...prev, newTag])
    setNewTagName('')
    setNewTagColor('#8b5cf6')
    toast({ title: 'Sucesso!', description: 'Tag criada.' })
  }

  const handleUpdate = () => {
    if (!editingTag || !editingTag.name.trim()) return
    setTags((prev) =>
      prev.map((t) => (t.id === editingTag.id ? editingTag : t)),
    )
    setEditingTag(null)
    toast({ title: 'Sucesso!', description: 'Tag atualizada.' })
  }

  const handleDelete = (tagId: string) => {
    setTags((prev) => prev.filter((t) => t.id !== tagId))
    toast({
      variant: 'destructive',
      title: 'Sucesso!',
      description: 'Tag excluída.',
    })
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <h1 className="text-2xl sm:text-3xl font-bold font-display mb-8">Gerenciar Tags</h1>
      <Card className="glass-card mb-8">
        <CardHeader>
          <CardTitle>Nova Tag</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
          <Input
            placeholder="Nome da tag"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <label htmlFor="new-tag-color">Cor:</label>
            <Input
              id="new-tag-color"
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="w-12 h-10 p-1"
            />
          </div>
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Criar
          </Button>
        </CardContent>
      </Card>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Tags Existentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
            >
              <Badge
                style={{
                  backgroundColor: tag.color,
                  color: 'hsl(var(--primary-foreground))',
                }}
              >
                {tag.name}
              </Badge>
              <div className="flex gap-2">
                <Dialog onOpenChange={(open) => !open && setEditingTag(null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTag({ ...tag })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Tag</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center gap-4 py-4">
                      <Input
                        value={editingTag?.name || ''}
                        onChange={(e) =>
                          setEditingTag((prev) =>
                            prev ? { ...prev, name: e.target.value } : null,
                          )
                        }
                      />
                      <Input
                        type="color"
                        value={editingTag?.color || ''}
                        onChange={(e) =>
                          setEditingTag((prev) =>
                            prev ? { ...prev, color: e.target.value } : null,
                          )
                        }
                        className="w-12 h-10 p-1"
                      />
                      <DialogClose asChild>
                        <Button onClick={handleUpdate}>Salvar</Button>
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(tag.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default GerenciarTags
