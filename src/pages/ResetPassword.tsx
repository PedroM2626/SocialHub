import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Sparkles, CheckCircle } from 'lucide-react'
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
import { useToast } from '@/components/ui/use-toast'
import { useState, useEffect } from 'react'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'A senha deve ter pelo menos 8 caracteres.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

const ResetPassword = () => {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Token Inválido',
        description: 'O link de redefinição de senha é inválido ou expirou.',
      })
      navigate('/login')
    }
  }, [token, navigate, toast])

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setLoading(true)
    await new Promise((res) => setTimeout(res, 1000))
    setSuccess(true)
    toast({
      title: 'Senha redefinida com sucesso!',
      description: 'Você já pode fazer login com sua nova senha.',
    })
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl sm:text-3xl font-display">
              Redefinir Senha
            </CardTitle>
          </div>
          <CardDescription>Crie uma nova senha para sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
              <p>Sua senha foi alterada com sucesso!</p>
              <Button asChild className="w-full">
                <Link to="/login">Ir para o Login</Link>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ResetPassword
