import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import Explorar from './pages/Explorar'
import Perfil from './pages/Perfil'
import Notificacoes from './pages/Notificacoes'
import Comunidades from './pages/Comunidades'
import ComunidadeDetalhes from './pages/ComunidadeDetalhes'
import ComunidadeChat from './pages/ComunidadeChat'
import Mensagens from './pages/Mensagens'
import Tarefas from './pages/Tarefas'
import Desabafos from './pages/Desabafos'
import PerfilUsuario from './pages/PerfilUsuario'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import GerenciarTags from './pages/GerenciarTags'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/explorar" element={<Explorar />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/perfil/:userId" element={<PerfilUsuario />} />
              <Route path="/notificacoes" element={<Notificacoes />} />
              <Route path="/comunidades" element={<Comunidades />} />
              <Route
                path="/comunidades/:communityId"
                element={<ComunidadeDetalhes />}
              />
              <Route
                path="/comunidades/:communityId/chat"
                element={<ComunidadeChat />}
              />
              <Route path="/mensagens" element={<Mensagens />} />
              <Route path="/tarefas" element={<Tarefas />} />
              <Route path="/tarefas/tags" element={<GerenciarTags />} />
              <Route path="/desabafos" element={<Desabafos />} />
            </Route>
          </Route>
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
