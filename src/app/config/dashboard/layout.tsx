
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, ListPlus, Settings2, LogOut, UserCircle } from "lucide-react";
import { logoutAction } from "../actions";
// import Image from "next/image"; // Replaced by text
// import { fetchWhitelabelSettings } from '@/app/config/dashboard/settings/actions'; // Logo is replaced by text

export const metadata: Metadata = {
  title: "Dashboard de Configuração",
  description: "Gerencie seus quizzes e configurações.",
};

async function handleLogout() {
    "use server";
    await logoutAction();
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const whitelabelConfig = await fetchWhitelabelSettings(); // Removed as logo is replaced by text
  // const logoUrlToUse = whitelabelConfig.logoUrl || "https://placehold.co/150x40.png?text=Logo"; // Replaced by text
  const projectTitle = "LP de Alta Performasse";

  const navItems = [
    { href: "/config/dashboard", label: "Quizzes (Início)", icon: Home },
    { href: "/config/dashboard/quiz/create", label: "Criar Novo Quiz", icon: ListPlus },
    { href: "/config/dashboard/settings", label: "Configurações", icon: Settings2 },
  ];

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr] bg-background">
      {/* Desktop Sidebar - Fixed */}
      <div className="hidden border-r bg-card md:flex flex-col shadow-sm sticky top-0 h-screen">
        <div className="flex h-20 items-center border-b px-6 shrink-0">
          <Link href="/config/dashboard" className="flex items-center gap-3" aria-label="Página Inicial do Dashboard">
            <span className="text-xl font-semibold text-primary">{projectTitle}</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all duration-200 ease-in-out hover:bg-primary/10 hover:text-primary hover:shadow-sm group"
              >
                <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
          <form action={handleLogout}>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive group py-3">
              <LogOut className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" /> Sair da Conta
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile Header & Main Content Area */}
      <div className="flex flex-col overflow-y-auto"> {/* This column will handle its own scroll */}
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30 shadow-sm md:shadow-none">
          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden border-muted-foreground/30"
                aria-label="Abrir menu de navegação"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-card p-0 w-[280px] shadow-xl">
              <div className="flex h-20 items-center border-b px-6">
                <Link href="/config/dashboard" className="flex items-center gap-3" aria-label="Página Inicial do Dashboard">
                   <span className="text-xl font-semibold text-primary">{projectTitle}</span>
                </Link>
              </div>
              <nav className="grid gap-2 text-base font-medium p-4">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-4 rounded-lg px-3 py-3 text-muted-foreground hover:bg-primary/10 hover:text-primary group"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto p-4 border-t">
                <form action={handleLogout}>
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive group py-3">
                    <LogOut className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" /> Sair
                  </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="w-full flex-1">
            <h1 className="text-xl font-semibold text-foreground md:hidden">Dashboard</h1>
            {/* Desktop can have breadcrumbs or page title here from children if needed */}
          </div>

          {/* User Menu / Profile (Placeholder for Mobile) */}
          <Button variant="ghost" size="icon" className="rounded-full md:hidden" aria-label="Menu do usuário">
            <UserCircle className="h-6 w-6 text-muted-foreground" />
          </Button>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
