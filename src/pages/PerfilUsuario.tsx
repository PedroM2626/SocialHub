import { useState, useEffect } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import NotFound from './NotFound'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PostCard } from '@/components/social/PostCard'
import { useAuth } from '@/contexts/AuthContext'
import { User, Post } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  users as mockUsers,
  posts as mockPosts,
  communities as mockCommunities,
  communityMessages as mockCommunityMessages,
  conversations as mockConversations,
} from '@/lib/mock-data'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { Globe, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const PerfilUsuario = () => {
  const { userId } = useParams<{ userId: string }>()
  const { user: currentUser, updateUser } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      if (!userId) return

      setLoading(true)
      await new Promise((res) => setTimeout(res, 500))

      let profileData = mockUsers.find((u) => u.id === userId)

      if (!profileData) {
        // try to find author in posts
        profileData = mockPosts.find((p) => p.author.id === userId)?.author

        // try community messages
        if (!profileData) profileData = mockCommunityMessages.find((m) => m.author.id === userId)?.author

        // try conversations participants
        if (!profileData) profileData = mockConversations.find((c) => c.participant?.id === userId)?.participant

        if (!profileData) {
          setLoading(false)
          return
        }
      }

      setProfile(profileData)
      setIsFollowing(Math.random() > 0.5)

      const userPosts = mockPosts.filter((p) => p.author.id === userId)
      setPosts(userPosts)

      setLoading(false)
    }

    fetchProfileAndPosts()
  }, [userId])

  const handleFollowToggle = () => {
    if (!profile || !currentUser) return
    const newFollowingState = !isFollowing
    setIsFollowing(newFollowingState)

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            followers_count:
              prev.followers_count + (newFollowingState ? 1 : -1),
          }
        : null,
    )

    updateUser({
      following_count:
        currentUser.following_count + (newFollowingState ? 1 : -1),
    })

    toast({
      title: newFollowingState
        ? `Você está seguindo ${profile.name}`
        : `Você deixou de seguir ${profile.name}`,
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl p-4">
        <Skeleton className="h-64 w-full" />
        <div className="flex items-end gap-4 -mt-20 ml-4">
          <Skeleton className="h-40 w-40 rounded-full border-4 border-background" />
          <div className="flex-1 pb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    // Render NotFound inline to avoid navigating to /404 and producing misleading console messages
    return <NotFound />
  }

  if (userId === currentUser?.id) {
    return <Navigate to="/perfil" replace />
  }

  return (
    <div>
      <div className="relative h-48 md:h-64 w-full">
        <img
          src={profile.cover_image}
          alt="Capa do perfil"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>
      <div className="container mx-auto max-w-5xl px-4 -mt-16 sm:-mt-20 pb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
          <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-background">
            <AvatarImage src={profile.profile_image} />
            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left py-2">
            <h1 className="text-3xl font-bold font-display">{profile.name}</h1>
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 justify-center sm:justify-start"
              >
                <Globe className="h-4 w-4" />
                {profile.website}
              </a>
            )}
          </div>
          <Button
            onClick={handleFollowToggle}
            variant={isFollowing ? 'outline' : 'default'}
            className={cn(isFollowing && 'text-primary border-primary')}
          >
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </Button>
        </div>
        <p className="mt-4 text-center sm:text-left max-w-2xl">{profile.bio}</p>
        {profile.interests && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
            {profile.interests.map((interest) => (
              <Badge key={interest} variant="secondary">
                {interest}
              </Badge>
            ))}
          </div>
        )}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-card text-center p-4">
            <p className="text-2xl font-bold">{posts.length}</p>
            <p className="text-muted-foreground">Posts</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <p className="text-2xl font-bold">{profile.followers_count}</p>
            <p className="text-muted-foreground">Seguidores</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <p className="text-2xl font-bold">{profile.following_count}</p>
            <p className="text-muted-foreground">Seguindo</p>
          </Card>
        </div>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold font-display">
              Posts de {profile.name}
            </h2>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users /> Comunidades
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockCommunities.slice(0, 2).map((community) => (
                  <Link
                    to={`/comunidades/${community.id}`}
                    key={community.id}
                    className="flex items-center gap-3 hover:bg-accent p-2 rounded-lg"
                  >
                    <Avatar className="h-10 w-10">
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerfilUsuario
