import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Link, useNavigate } from 'react-router-dom'
import { communities as mockCommunities } from '@/lib/mock-data'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  CommunityFilters,
  CommunityFilterValues,
} from '@/components/social/CommunityFilters'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CreateCommunityForm,
  CommunityFormValues,
} from '@/components/social/CreateCommunityForm'
import { useToast } from '@/components/ui/use-toast'
import { Community } from '@/lib/types'

const Comunidades = () => {
  const [communities, setCommunities] = useState<Community[]>(mockCommunities)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Partial<CommunityFilterValues>>({})
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleCreateCommunity = (data: CommunityFormValues) => {
    const coverFile = data.cover_image?.[0]
    const imageUrl = coverFile
      ? URL.createObjectURL(coverFile)
      : `https://img.usecurling.com/p/400/200?q=${encodeURIComponent(data.name)}`

    const newCommunity: Community = {
      id: `${Date.now()}`,
      name: data.name,
      description: data.description,
      image_url: imageUrl,
      members_count: 1,
      is_private: data.is_private,
      category: data.category,
      created_date: new Date(),
    }
    setCommunities((prev) => [newCommunity, ...prev])
    setIsCreateModalOpen(false)
    toast({
      title: 'Sucesso!',
      description: `A comunidade "${data.name}" foi criada.`,
    })
    navigate(`/comunidades/${newCommunity.id}`)
  }

  const filteredCommunities = communities
    .filter((community) => {
      const term = searchTerm.toLowerCase()
      return (
        community.name.toLowerCase().includes(term) ||
        community.description.toLowerCase().includes(term)
      )
    })
    .filter((community) => {
      if (
        filters.creationDate?.from &&
        new Date(community.created_date) < filters.creationDate.from
      )
        return false
      if (
        filters.creationDate?.to &&
        new Date(community.created_date) > filters.creationDate.to
      )
        return false
      if (filters.minMembers && community.members_count < filters.minMembers)
        return false
      if (filters.privacy === 'public' && community.is_private) return false
      if (filters.privacy === 'private' && !community.is_private) return false
      return true
    })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 animate-fade-in-down">
        <h1 className="text-2xl sm:text-3xl font-bold font-display">
          Comunidades
        </h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Criar Comunidade
        </Button>
      </div>
      <Card className="glass-card p-4 mb-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar comunidades..."
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
            <PopoverContent className="w-full max-w-xs sm:w-96" align="end">
              <CommunityFilters
                onApply={setFilters}
                onClear={() => setFilters({})}
              />
            </PopoverContent>
          </Popover>
        </div>
      </Card>
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Criar Nova Comunidade</DialogTitle>
          </DialogHeader>
          <CreateCommunityForm
            onSubmit={handleCreateCommunity}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCommunities.map((community, index) => (
          <Link
            to={`/comunidades/${community.id}`}
            key={community.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Card className="glass-card overflow-hidden group interactive-card">
              <img
                src={community.image_url}
                alt={community.name}
                className="w-full h-32 object-cover"
              />
              <CardContent className="p-4">
                <h2 className="text-lg font-bold font-display group-hover:text-primary transition-colors">
                  {community.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1 h-10 overflow-hidden">
                  {community.description}
                </p>
                <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                  <span>{community.members_count} membros</span>
                  {community.is_private && (
                    <span className="font-bold text-amber-400">PRIVADA</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Comunidades
