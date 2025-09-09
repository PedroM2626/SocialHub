import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Sparkles, Mail } from 'lucide-react'
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
import { useState } from 'react'
import { users } from '@/lib/mock-data'

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { toast } = useToast()
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true)
    await new Promise((res) => setTimeout(res, 1000))

    const userExists = users.some((user) => user.email === data.email)

    if (userExists) {
      setEmailSent(true)
      toast({
        title: 'E-mail de recuperação enviado!',
        description: `Se um usuário com o e-mail ${data.email} existir, um link para redefinir a senha foi enviado.`,
      })
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nenhum usuário encontrado com este e-mail.',
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl sm:text-3xl font-display">
              Recuperar Senha
            </CardTitle>
          </div>
          <CardDescription>
            Digite seu e-mail para receber o link de recuperação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="text-center space-y-4">
              <Mail className="h-16 w-16 text-primary mx-auto animate-pulse-sm" />
              <p>
                Um e-mail foi enviado para{' '}
                <strong>{form.getValues('email')}</strong> com as instruções
                para redefinir sua senha.
              </p>
              <Button asChild className="w-full">
                <Link to="/login">Voltar para o Login</Link>
              </Button>
            </div>
          ) : (
            <>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
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
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                  </Button>
                </form>
              </Form>
              <div className="mt-6 text-center text-sm">
                Lembrou a senha?{' '}
                <Link to="/login" className="underline hover:text-primary">
                  Faça login
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ForgotPassword
