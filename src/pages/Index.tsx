import { useState, useEffect } from 'react'
import { Search, Sparkles, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PostCard } from '@/components/social/PostCard'
import { CreatePost } from '@/components/social/CreatePost'
import { Post } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { PostFilters, PostFilterValues } from '@/components/social/PostFilters'
import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'
import { posts as mockPosts } from '@/lib/mock-data'
import { useToast } from '@/components/ui/use-toast'

const Index = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Partial<PostFilterValues>>({})
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setPosts(mockPosts)
      setLoading(false)
    }, 1000)
  }, [])

  const handlePost = async (newPostContent: {
    content: string
    hashtags: string
    imageUrl?: string
  }) => {
    if (!user) return

    const hashtagsArray = newPostContent.hashtags
      .split(' ')
      .filter((h) => h.startsWith('#'))

    const newPost: Post = {
      id: `post-${Date.now()}`,
      author: user,
      created_date: new Date(),
      content: newPostContent.content,
      image_url: newPostContent.imageUrl,
      hashtags: hashtagsArray,
      likes_count: 0,
      comments_count: 0,
      comments: [],
      reactions: {},
    }

    setPosts((currentPosts) => [newPost, ...currentPosts])
  }

  const handleDeletePost = (postId: string) => {
    setPosts((currentPosts) => currentPosts.filter((p) => p.id !== postId))
    toast({
      title: 'Sucesso!',
      description: 'Seu post foi excluído.',
    })
  }

  const filteredPosts = posts.filter((post) => {
    const searchMatch =
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.hashtags.some((h) =>
        h.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    if (!searchMatch) return false

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
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <header className="sticky top-0 lg:top-auto lg:relative z-30 bg-background/80 backdrop-blur-lg -mx-4 px-4 py-4 mb-6 border-b border-border/50 animate-fade-in-down">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary animate-pulse-sm" />
            <h1 className="text-2xl font-bold font-display">Início</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar no feed..."
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
      </header>

      <div className="space-y-6">
        <div className="animate-fade-in-up">
          <CreatePost onPost={handlePost} />
        </div>
        {loading ? (
          <>
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </>
        ) : (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
          ))
        )}
      </div>
    </div>
  )
}

export default Index
