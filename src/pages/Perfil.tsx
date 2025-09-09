import { useState, useRef } from 'react'
import { Edit, Search, Filter, Camera } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PostCard } from '@/components/social/PostCard'
import { posts as mockPosts } from '@/lib/mock-data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { PostFilters, PostFilterValues } from '@/components/social/PostFilters'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { useToast } from '@/components/ui/use-toast'
import { Post } from '@/lib/types'

const Perfil = () => {
  const { user: currentUser, updateUser } = useAuth()
  const { toast } = useToast()
  const [posts, setPosts] = useState(
    mockPosts.filter((p) => p.author.id === currentUser?.id),
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Partial<PostFilterValues>>({})
  const [name, setName] = useState(currentUser?.name || '')
  const [bio, setBio] = useState(currentUser?.bio || '')
  const [website, setWebsite] = useState(currentUser?.website || '')
  const [interests, setInterests] = useState(
    currentUser?.interests?.join(', ') || '',
  )
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const profileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string | null>>,
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // result is a base64 data URL
        setter(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveChanges = async () => {
    const payload = {
      name,
      bio,
      website,
      interests: interests.split(',').map((i) => i.trim()),
      profile_image: profileImage || currentUser.profile_image,
      cover_image: coverImage || currentUser.cover_image,
    }
    try {
      await updateUser(payload)
      toast({ title: 'Sucesso!', description: 'Perfil atualizado.' })
    } catch (err) {
      console.error('Perfil update error', err)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil.',
      })
    }
  }

  const handleDeletePost = (postId: string) => {
    setPosts((currentPosts) => currentPosts.filter((p) => p.id !== postId))
    toast({ title: 'Sucesso!', description: 'Seu post foi excluído.' })
  }

  const userPosts = posts
    .filter((post) =>
      post.content.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((post) => {
      if (
        filters.dateRange?.from &&
        new Date(post.created_date) < filters.dateRange.from
      )
        return false
      if (
        filters.dateRange?.to &&
        new Date(post.created_date) > filters.dateRange.to
      )
        return false
      if (filters.minLikes && post.likes_count < filters.minLikes) return false
      if (filters.minComments && post.comments_count < filters.minComments)
        return false
      if (filters.hasMedia && !post.image_url) return false
      if (
        filters.keyword &&
        !post.content.toLowerCase().includes(filters.keyword.toLowerCase())
      )
        return false
      return true
    })

  return (
    <div>
      <div className="relative h-48 md:h-64 w-full group">
        <img
          src={coverImage || currentUser.cover_image}
          alt="Capa do perfil"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => coverInputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
        </Button>
        <input
          type="file"
          ref={coverInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileChange(e, setCoverImage)}
        />
      </div>
      <div className="container mx-auto max-w-5xl px-4 -mt-16 sm:-mt-20 pb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
          <div className="relative group">
            <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-background">
              <AvatarImage src={profileImage || currentUser.profile_image} />
              <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => profileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <input
              type="file"
              ref={profileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setProfileImage)}
            />
          </div>
          <div className="flex-1 text-center sm:text-left py-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display">
              {currentUser.name}
            </h1>
            <p className="text-muted-foreground">{currentUser.email}</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Edit className="mr-2 h-4 w-4" /> Editar Perfil
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Editar Perfil</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://seu-site.com"
                  />
                </div>
                <div>
                  <Label htmlFor="interests">Interesses</Label>
                  <Input
                    id="interests"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="Tecnologia, Viagens (separado por vírgulas)"
                  />
                </div>
                <DialogTrigger asChild>
                  <Button className="w-full" onClick={handleSaveChanges}>
                    Salvar alterações
                  </Button>
                </DialogTrigger>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="mt-4 text-center sm:text-left max-w-2xl">
          {currentUser.bio}
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-card text-center p-4">
            <p className="text-2xl font-bold">{userPosts.length}</p>
            <p className="text-muted-foreground">Posts</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <p className="text-2xl font-bold">{currentUser.followers_count}</p>
            <p className="text-muted-foreground">Seguidores</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <p className="text-2xl font-bold">{currentUser.following_count}</p>
            <p className="text-muted-foreground">Seguindo</p>
          </Card>
        </div>
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold font-display">Meus Posts</h2>
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nos meus posts..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="end">
                  <PostFilters
                    onApply={setFilters}
                    onClear={() => setFilters({})}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-6">
            {userPosts.map((post) => (
              <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Perfil
