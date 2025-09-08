import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { useState, useRef, useEffect } from 'react'

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
})

type LoginFormValues = z.infer<typeof loginSchema>

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { login } = useAuth()
  const { toast } = useToast()
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  const onSubmit = async (data: LoginFormValues) => {
    console.log('[Login] submit', data.email)
    if (!mountedRef.current) return
    setLoading(true)
    let timeout = setTimeout(() => {
      if (mountedRef.current) {
        console.error('[Login] timeout clearing loading')
        setLoading(false)
      }
    }, 15000)

    try {
      await login(data.email, data.password)
      console.log('[Login] login resolved')
    } catch (error) {
      console.error('[Login] login error', error)
      toast({
        variant: 'destructive',
        title: 'Erro de Login',
        description: 'E-mail ou senha inválidos. Por favor, tente novamente.',
      })
    } finally {
      clearTimeout(timeout)
      if (mountedRef.current) setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-display">SocialHub</CardTitle>
          </div>
          <CardDescription>
            Bem-vindo de volta! Faça login para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="seu@email.com"
                        {...field}
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            <Link
              to="/forgot-password"
              className="underline text-muted-foreground hover:text-primary"
            >
              Esqueceu sua senha?
            </Link>
          </div>
          <div className="mt-6 text-center text-sm">
            Não tem uma conta?{' '}
            <Link to="/register" className="underline hover:text-primary">
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
