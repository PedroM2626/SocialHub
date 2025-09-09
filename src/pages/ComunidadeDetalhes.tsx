import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Users, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PostCard } from '@/components/social/PostCard'
import { CreatePost } from '@/components/social/CreatePost'
import { useAuth } from '@/contexts/AuthContext'
import { Community, Post, User } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  communities as mockCommunities,
  posts as mockPosts,
  users as mockUsers,
} from '@/lib/mock-data'
import { useToast } from '@/components/ui/use-toast'

const ComunidadeDetalhes = () => {
  const { communityId } = useParams<{ communityId: string }>()
  const { user } = useAuth()
  const { toast } = useToast()
  const [community, setCommunity] = useState<Community | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!communityId || !user) return
      setLoading(true)

      await new Promise((res) => setTimeout(res, 500))

      const foundCommunity = mockCommunities.find((c) => c.id === communityId)

      if (!foundCommunity) {
        setLoading(false)
        return
      }
      setCommunity(foundCommunity)

      const communityHashtag = `#${foundCommunity.name.replace(/\s+/g, '').toLowerCase()}`
      const communityPosts = mockPosts.filter((p) =>
        p.hashtags.includes(communityHashtag),
      )
      setPosts(communityPosts)

      const mockMembers = mockUsers.slice(0, 5)
      setMembers(mockMembers)
      setIsMember(mockMembers.some((m) => m.id === user.id))

      setLoading(false)
    }
    fetchData()
  }, [communityId, user])

  const handleJoinLeave = async () => {
    if (!community || !user) return

    setIsMember(!isMember)
    if (isMember) {
      setMembers(members.filter((m) => m.id !== user.id))
      community.members_count--
    } else {
      setMembers([...members, user])
      community.members_count++
    }
  }

  const handlePost = (newPostContent: {
    content: string
    hashtags: string
    imageUrl?: string
  }) => {
    if (!user || !community) return

    const communityHashtag = `#${community.name.replace(/\s+/g, '').toLowerCase()}`
    const hashtagsArray = newPostContent.hashtags
      .split(' ')
      .filter((h) => h.startsWith('#'))
    if (!hashtagsArray.includes(communityHashtag)) {
      hashtagsArray.push(communityHashtag)
    }

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
    toast({
      title: 'Sucesso!',
      description: `Post publicado na comunidade ${community.name}.`,
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <Skeleton className="h-64 w-full rounded-lg mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!community) return <p>Comunidade não encontrada.</p>

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <Card className="glass-card mb-8 overflow-hidden">
        <img
          src={community.image_url}
          alt={community.name}
          className="w-full h-48 object-cover"
        />
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display">
                {community.name}
              </h1>
              <p className="text-muted-foreground mt-2">
                {community.description}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={handleJoinLeave}>
                {isMember ? 'Sair da Comunidade' : 'Entrar na Comunidade'}
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/comunidades/${community.id}/chat`}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Chat
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {isMember && <CreatePost onPost={handlePost} />}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users /> Membros ({community.members_count})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {members.slice(0, 10).map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.profile_image} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Link
                    to={`/perfil/${member.id}`}
                    className="font-semibold hover:underline"
                  >
                    {member.name}
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ComunidadeDetalhes
