import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { desabafos as mockDesabafos } from '@/lib/mock-data'
import { DesabafoCard } from '@/components/desabafos/DesabafoCard'
import {
  getDesabafos,
  createDesabafo,
  updateDesabafo,
  deleteDesabafo,
} from '@/lib/db'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DesabafoFilters,
  DesabafoFilterValues,
} from '@/components/desabafos/DesabafoFilters'
import { CreateDesabafo } from '@/components/desabafos/CreateDesabafo'
import { useAuth } from '@/contexts/AuthContext'
import { Desabafo } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const Desabafos = () => {
  const [desabafos, setDesabafos] = useState<Desabafo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Partial<DesabafoFilterValues>>({})
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const tag = searchParams.get('tag')
    if (tag) {
      setSearchTerm(`#${tag}`)
    }

    let mounted = true
    ;(async () => {
      try {
        const remote = await getDesabafos()
        if (mounted && remote.length > 0) {
          // map remote rows to Desabafo shape used by UI
          const mapped = remote.map((r: any) => ({
            id: r.id,
            user_id: r.user_id || null,
            created_date: new Date(r.created_at),
            content: r.content,
            image_url: r.image_url || undefined,
            hashtags: r.hashtags || [],
            reactions: r.reactions || {},
            comments: r.comments || [],
          }))
          setDesabafos(mapped)
          return
        }
      } catch (err) {
        console.warn(
          'Failed to load desabafos from DB, falling back to mock',
          err,
        )
      }

      setDesabafos(mockDesabafos)
    })()

    return () => {
      mounted = false
    }
  }, [searchParams])

  const handleCreateDesabafo = async (data: {
    content: string
    hashtags: string
    imageUrl?: string
  }) => {
    const newDesabafo: Desabafo = {
      id: `desabafo-${Date.now()}`,
      user_id: user?.id || null,
      created_date: new Date(),
      content: data.content,
      image_url: data.imageUrl,
      hashtags: data.hashtags.split(' ').filter((h) => h.startsWith('#')),
      reactions: {},
      comments: [],
    }

    // optimistic
    setDesabafos((prev) => [newDesabafo, ...prev])

    try {
      const created = await createDesabafo({
        id: newDesabafo.id,
        content: newDesabafo.content,
        image_url: newDesabafo.image_url || null,
        hashtags: newDesabafo.hashtags,
        user_id: newDesabafo.user_id || null,
      })
      if (!created) throw new Error('Failed to persist desabafo')
      // replace optimistic id with stored id if differ
      setDesabafos((prev) =>
        prev.map((d) =>
          d.id === newDesabafo.id ? { ...d, id: created.id } : d,
        ),
      )
      toast({
        title: 'Sucesso!',
        description: 'Seu desabafo foi publicado anonimamente.',
      })
    } catch (err) {
      console.error('Failed to create desabafo', err)
      // rollback
      setDesabafos((prev) => prev.filter((d) => d.id !== newDesabafo.id))
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível publicar seu desabafo.',
      })
    }
  }

  const handleUpdateDesabafo = async (
    id: string,
    data: { content: string; hashtags: string },
  ) => {
    const previous = desabafos.find((d) => d.id === id)
    setDesabafos((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              content: data.content,
              hashtags: data.hashtags
                .split(' ')
                .filter((h) => h.startsWith('#')),
              updated_at: new Date(),
            }
          : d,
      ),
    )

    try {
      const ok = await updateDesabafo(id, {
        content: data.content,
        hashtags: data.hashtags.split(' ').filter((h) => h.startsWith('#')),
      })
      if (!ok) throw new Error('Failed to persist update')
      toast({ title: 'Sucesso!', description: 'Seu desabafo foi atualizado.' })
    } catch (err) {
      console.error('Failed to update desabafo', err)
      // rollback
      if (previous)
        setDesabafos((prev) => prev.map((d) => (d.id === id ? previous : d)))
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar seu desabafo.',
      })
    }
  }

  const handleDeleteDesabafo = async (id: string) => {
    const previous = desabafos
    setDesabafos((prev) => prev.filter((d) => d.id !== id))
    try {
      const ok = await deleteDesabafo(id)
      if (!ok) throw new Error('Failed to delete')
      toast({
        variant: 'destructive',
        title: 'Sucesso!',
        description: 'Seu desabafo foi excluído.',
      })
    } catch (err) {
      console.error('Failed to delete desabafo', err)
      setDesabafos(previous)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir seu desabafo.',
      })
    }
  }

  const filteredDesabafos = desabafos
    .filter(
      (d) =>
        d.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.hashtags.some((h) =>
          h.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    )
    .filter((d) => {
      const totalReactions = Object.values(d.reactions).reduce(
        (s, c) => s + c,
        0,
      )
      if (
        filters.dateRange?.from &&
        new Date(d.created_date) < filters.dateRange.from
      )
        return false
      if (
        filters.dateRange?.to &&
        new Date(d.created_date) > filters.dateRange.to
      )
        return false
      if (filters.minReactions && totalReactions < filters.minReactions)
        return false
      if (filters.minComments && d.comments.length < filters.minComments)
        return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        const reactionsA = Object.values(a.reactions).reduce((s, c) => s + c, 0)
        const reactionsB = Object.values(b.reactions).reduce((s, c) => s + c, 0)
        return reactionsB - reactionsA
      }
      return b.created_date.getTime() - a.created_date.getTime()
    })

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="text-center mb-8 animate-fade-in-down">
        <h1 className="text-3xl font-bold font-display">Mural de Desabafos</h1>
        <p className="text-muted-foreground mt-2">
          Um espaço seguro para compartilhar seus pensamentos anonimamente.
        </p>
      </div>
      <div className="mb-8 animate-fade-in-up">
        <CreateDesabafo onDesabafo={handleCreateDesabafo} />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar desabafos por texto ou #tag..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" /> Filtros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <DesabafoFilters
              onApply={setFilters}
              onClear={() => setFilters({})}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex justify-end mb-4">
        <ToggleGroup
          type="single"
          value={sortBy}
          onValueChange={(value) => {
            if (value) setSortBy(value as 'recent' | 'popular')
          }}
          className="w-full sm:w-auto"
        >
          <ToggleGroupItem value="recent" className="flex-1 sm:flex-initial">
            Mais Recentes
          </ToggleGroupItem>
          <ToggleGroupItem value="popular" className="flex-1 sm:flex-initial">
            Mais Populares
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="space-y-6">
        {filteredDesabafos.map((desabafo) => (
          <DesabafoCard
            key={desabafo.id}
            desabafo={desabafo}
            onUpdate={handleUpdateDesabafo}
            onDelete={handleDeleteDesabafo}
          />
        ))}
      </div>
    </div>
  )
}
export default Desabafos
