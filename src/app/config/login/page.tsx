
"use client";
import React, { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAction } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { KeyRound, LogIn, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
// import { fetchWhitelabelSettings } from '@/app/config/dashboard/settings/actions'; // Logo is replaced by text
// import type { WhitelabelConfig } from '@/types/quiz';


function LoginLoadingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-6">LP de Alta Performasse</div>
          <h1 className="text-3xl font-bold text-foreground">Acessar Painel</h1>
          <p className="text-muted-foreground mt-2">Carregando...</p>
        </div>
        <Card className="shadow-2xl rounded-lg">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password-loading">Senha de Acesso</Label>
              <Input id="password-loading" type="password" disabled placeholder="●●●●●●●●" className="text-lg py-3 bg-muted/50" />
            </div>
            <Button type="submit" className="w-full text-lg py-6" disabled>
              <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6" />
              Carregando
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoginClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redirectedFrom, setRedirectedFrom] = useState<string | null>(null);
  // const [logoUrl, setLogoUrl] = useState<string>("https://placehold.co/150x50.png?text=Logo"); // Replaced by text

  useEffect(() => {
    setRedirectedFrom(searchParams.get('redirectedFrom'));
    // Logo fetching removed
  }, [searchParams]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await loginAction(password);
      if (result.success) {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-8">
              LP de Alta Performasse
            </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Acesso ao Painel de Controle</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus quizzes e configurações.</p>
        </div>
        <Card className="shadow-2xl rounded-lg bg-card">
          <CardHeader className="p-8 text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2"><KeyRound className="h-6 w-6 text-primary" /> Autenticação Segura</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">Senha de Acesso</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="●●●●●●●●"
                  className="text-lg py-3 h-12"
                />
              </div>
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/30">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle>Falha no Login</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full text-lg py-6 h-14 rounded-md" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6" />
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
        </Card>
         <p className="text-xs text-muted-foreground text-center w-full">
            Utilize a senha mestra configurada para o sistema.
          </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingSkeleton />}>
      <LoginClientContent />
    </Suspense>
  );
}
