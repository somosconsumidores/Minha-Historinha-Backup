
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export const AuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        toast({
          title: "❌ Erro na autenticação",
          description: error.message,
          className: "text-black",
        });
      } else if (isSignUp) {
        toast({
          title: "✅ Conta criada!",
          description: "Verifique seu email para confirmar a conta.",
          className: "text-black",
        });
      } else {
        toast({
          title: "✅ Login realizado!",
          description: "Bem-vindo de volta!",
          className: "text-black",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erro inesperado",
        description: "Tente novamente em alguns instantes.",
        className: "text-black",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-purple-100 to-white p-4">
      <Card className="w-full max-w-md bg-white border-2 border-purple-300 shadow-lg">
        <CardHeader className="text-center bg-purple-50">
          <CardTitle className="text-2xl font-semibold text-black">
            {isSignUp ? 'Criar Conta' : 'Entrar'}
          </CardTitle>
          <CardDescription className="text-black">
            {isSignUp 
              ? 'Crie sua conta para salvar seus personagens' 
              : 'Entre na sua conta para continuar'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-white p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border-2 border-purple-200 text-black placeholder:text-gray-600 focus:border-purple-400 focus:ring-purple-400"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Senha (mínimo 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white border-2 border-purple-200 text-black placeholder:text-gray-600 focus:border-purple-400 focus:ring-purple-400"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-md transition-colors" 
              disabled={loading}
            >
              {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-black hover:text-purple-600 transition-colors underline"
            >
              {isSignUp 
                ? 'Já tem uma conta? Fazer login' 
                : 'Não tem conta? Criar agora'
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
