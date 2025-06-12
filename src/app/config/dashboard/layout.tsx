
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, ListPlus, Settings, LogOut, ShieldCheck, Settings2 } from "lucide-react";
import { logoutAction } from "../actions";

export const metadata: Metadata = {
  title: "Dashboard de Configuração",
  description: "Gerencie seus quizzes e configurações.",
};

async function handleLogout() {
    "use server";
    await logoutAction();
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/config/dashboard" className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span className="">Painel Ice Lazer</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                href="/config/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Home className="h-4 w-4" />
                Início (Quizzes)
              </Link>
              <Link
                href="/config/dashboard/quiz/create"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <ListPlus className="h-4 w-4" />
                Criar Novo Quiz
              </Link>
              <Link
                href="/config/dashboard/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Settings2 className="h-4 w-4" />
                Configurações Whitelabel
              </Link>
            </nav>
          </div>
          <div className="mt-auto p-4">
            <form action={handleLogout}>
                <Button variant="ghost" className="w-full justify-start">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                </Button>
            </form>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu de navegação</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="/config/dashboard"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <span>Painel Ice Lazer</span>
                </Link>
                <Link
                  href="/config/dashboard"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Home className="h-5 w-5" />
                  Início (Quizzes)
                </Link>
                <Link
                  href="/config/dashboard/quiz/create"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <ListPlus className="h-5 w-5" />
                  Criar Novo Quiz
                </Link>
                <Link
                  href="/config/dashboard/settings"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Settings2 className="h-5 w-5" />
                  Configurações Whitelabel
                </Link>
              </nav>
              <div className="mt-auto">
                <form action={handleLogout}>
                    <Button variant="ghost" className="w-full justify-start">
                        <LogOut className="mr-2 h-4 w-4" /> Sair
                    </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
           <div className="w-full flex-1 text-center font-semibold">
             Dashboard
           </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
