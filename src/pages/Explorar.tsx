import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Filter, ListTodo, MessageSquareHeart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PostCard } from '@/components/social/PostCard'
import {
  posts as mockPosts,
  users as mockUsers,
  communities as mockCommunities,
  desabafos as mockDesabafos,
  tasks as mockTasks,
} from '@/lib/mock-data'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { PostFilters, PostFilterValues } from '@/components/social/PostFilters'
import { Badge } from '@/components/ui/badge'

const Explorar = () => {
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Partial<PostFilterValues>>({})

  useEffect(() => {
    const query = searchParams.get('q')
    if (query) {
      setSearchTerm(query)
    }
  }, [searchParams])

  const searchResults = useMemo(() => {
    const term = searchTerm.toLowerCase()
    if (!term) {
      return {
        posts: mockPosts.sort((a, b) => b.likes_count - a.likes_count),
        users: mockUsers.sort((a, b) => b.followers_count - a.followers_count),
        communities: mockCommunities.sort(
          (a, b) => b.members_count - a.members_count,
        ),
        desabafos: [],
        tasks: [],
      }
    }

    const isHashtagSearch = term.startsWith('#')
    const keyword = isHashtagSearch ? term.slice(1) : term

    const filteredUsers = isHashtagSearch
      ? []
      : mockUsers.filter((user) => user.name.toLowerCase().includes(keyword))

    const filteredCommunities = isHashtagSearch
      ? []
      : mockCommunities.filter(
          (c) =>
            c.name.toLowerCase().includes(keyword) ||
            c.description.toLowerCase().includes(keyword),
        )

    const filteredPosts = mockPosts.filter((p) =>
      isHashtagSearch
        ? p.hashtags.some((h) => h.toLowerCase() === term)
        : p.content.toLowerCase().includes(keyword),
    )

    const filteredDesabafos = mockDesabafos.filter((d) =>
      isHashtagSearch
        ? d.hashtags.some((h) => h.toLowerCase() === term)
        : d.content.toLowerCase().includes(keyword),
    )

    const filteredTasks = mockTasks.filter((t) =>
      isHashtagSearch
        ? t.tags.some((tag) => tag.toLowerCase() === keyword)
        : t.title.toLowerCase().includes(keyword) ||
          t.description.toLowerCase().includes(keyword),
    )

    return {
      posts: filteredPosts,
      users: filteredUsers,
      communities: filteredCommunities,
      desabafos: filteredDesabafos,
      tasks: filteredTasks,
    }
  }, [searchTerm])

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="relative mb-8 flex items-center gap-2 animate-fade-in-down">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por keywords ou #hashtags..."
          className="pl-12 h-12 text-lg rounded-full glass-card flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-full h-12 w-12 p-0">
              <Filter className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full max-w-xs sm:w-96" align="end">
            <PostFilters onApply={setFilters} onClear={() => setFilters({})} />
          </PopoverContent>
        </Popover>
      </div>

      {searchTerm ? (
        <div className="space-y-8">
          {searchResults.users.length > 0 && (
            <Card className="glass-card animate-fade-in-up">
              <CardHeader>
                <CardTitle>Usuários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {searchResults.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.profile_image} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link
                          to={`/perfil/${user.id}`}
                          className="font-semibold hover:underline"
                        >
                          {user.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button size="sm">Seguir</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {searchResults.communities.length > 0 && (
            <Card
              className="glass-card animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              <CardHeader>
                <CardTitle>Comunidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {searchResults.communities.map((community) => (
                  <Link
                    to={`/comunidades/${community.id}`}
                    key={community.id}
                    className="flex items-center gap-3 hover:bg-accent p-2 rounded-lg"
                  >
                    <Avatar>
                      <AvatarImage src={community.image_url} />
                      <AvatarFallback>{community.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{community.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {community.members_count} membros
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
          {searchResults.posts.length > 0 && (
            <Card
              className="glass-card animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              <CardHeader>
                <CardTitle>Posts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {searchResults.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </CardContent>
            </Card>
          )}
          {searchResults.desabafos.length > 0 && (
            <Card
              className="glass-card animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              <CardHeader>
                <CardTitle>Desabafos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {searchResults.desabafos.map((d) => (
                  <Link
                    to="/desabafos"
                    key={d.id}
                    className="block p-3 rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquareHeart className="h-5 w-5 text-primary mt-1" />
                      <p className="text-sm text-muted-foreground italic">
                        "{d.content.substring(0, 150)}..."
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
          {searchResults.tasks.length > 0 && (
            <Card
              className="glass-card animate-fade-in-up"
              style={{ animationDelay: '400ms' }}
            >
              <CardHeader>
                <CardTitle>Tarefas Públicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {searchResults.tasks
                  .filter((t) => t.is_public)
                  .map((t) => (
                    <Link
                      to="/tarefas"
                      key={t.id}
                      className="block p-3 rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-start gap-3">
                        <ListTodo className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <p className="font-semibold">{t.title}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">{t.priority}</Badge>
                            {t.tags.map((tag) => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="glass-card animate-fade-in-up">
              <CardHeader>
                <CardTitle className="font-display text-xl">
                  Posts em Alta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {searchResults.posts.slice(0, 3).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card
              className="glass-card animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              <CardHeader>
                <CardTitle className="font-display text-xl">
                  Pessoas Sugeridas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {searchResults.users.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.profile_image} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link
                          to={`/perfil/${user.id}`}
                          className="font-semibold hover:underline"
                        >
                          {user.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button size="sm">Seguir</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default Explorar
