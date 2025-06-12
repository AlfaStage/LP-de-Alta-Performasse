
"use client";
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAction } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { KeyRound, LogIn, AlertTriangle, Loader2 } from 'lucide-react';
// Removido APP_BASE_URL já que o redirecionamento será relativo

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await loginAction(password);
      if (result.success) {
        const redirectedFrom = searchParams.get('redirectedFrom');
        // Usar caminho relativo para router.push
        router.push(redirectedFrom || '/config/dashboard');
      } else {
        setError(result.message || 'Falha no login.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl font-bold">Acesso ao Painel de Configuração</CardTitle>
          <CardDescription>Digite sua senha para gerenciar os quizzes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Senha de Acesso</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="********"
                className="text-base"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro de Login</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full text-base py-3" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Processando...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            Use a senha configurada nas variáveis de ambiente.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
