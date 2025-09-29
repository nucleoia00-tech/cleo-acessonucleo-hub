import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";
import Aguardando from "./pages/Aguardando";
import Bloqueado from "./pages/Bloqueado";
import PainelAdmin from "./pages/PainelAdmin";
import AcessoAdspower from "./pages/AcessoAdspower";
import PreviewContasSuporte from "./pages/PreviewContasSuporte";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/login" element={<Login />} />
            <Route path="/aguardando" element={<Aguardando />} />
            <Route path="/bloqueado" element={<Bloqueado />} />
            <Route path="/preview-contas-suporte" element={<PreviewContasSuporte />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <PainelAdmin />
                </ProtectedRoute>
              } 
            />
            
            {/* Member Routes */}
            <Route 
              path="/acesso-adspower" 
              element={
                <ProtectedRoute requiredRole="assinante" requiredStatus="ativo">
                  <AcessoAdspower />
                </ProtectedRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
