
'use client';

import React, { useState, type ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, ListPlus, Settings2, LogOut, PanelLeftClose, PanelRightOpen, Briefcase } from 'lucide-react';

interface DashboardShellProps {
  children: ReactNode;
  logoutAction: () => Promise<void>;
}

const navItems = [
  { href: "/config/dashboard", label: "Quizzes (Início)", icon: Home, exactMatch: true },
  { href: "/config/dashboard/quiz/create", label: "Criar Novo Quiz", icon: ListPlus },
  { href: "/config/dashboard/settings", label: "Configurações", icon: Settings2 },
];

export default function DashboardShell({ children, logoutAction }: DashboardShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  // Efeito para fechar a sidebar mobile quando a rota muda
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  useEffect(() => {
    setIsMobileSheetOpen(false);
  }, [pathname]);


  const isActive = (href: string, exactMatch: boolean = false) => {
    if (exactMatch) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={`grid min-h-screen w-full bg-background transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'md:grid-cols-[68px_1fr]' : 'md:grid-cols-[280px_1fr]'
      }`}
    >
      {/* Desktop Sidebar - Fixed */}
      <div className={`hidden border-r bg-card md:flex flex-col shadow-sm sticky top-0 h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-[68px]' : 'w-72'
        }`}
      >
        <div className={`flex h-20 items-center border-b shrink-0 ${isSidebarCollapsed ? 'px-3 justify-center' : 'px-6 justify-between'}`}>
          {!isSidebarCollapsed && (
            <Link href="/config/dashboard" className="flex items-center gap-2.5" aria-label="Página Inicial do Dashboard">
               <span className="font-display text-2xl font-bold text-sky-600">LP de Alta Performasse</span>
            </Link>
          )}
           {isSidebarCollapsed && (
            <Link href="/config/dashboard" aria-label="Página Inicial do Dashboard">
                <Briefcase className="h-7 w-7 text-sky-600" />
            </Link>
          )}
          <Button
            onClick={toggleSidebar}
            variant="ghost"
            size="icon"
            className="hidden md:flex text-muted-foreground hover:text-primary"
            aria-label={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isSidebarCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className={`grid items-start text-sm font-medium gap-1.5 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3.5 rounded-lg py-2.5 transition-all duration-200 ease-in-out group
                            ${isSidebarCollapsed ? 'justify-center px-2.5 h-11' : 'px-3.5 h-11'}
                            ${isActive(item.href, item.exactMatch) 
                                ? 'bg-primary/15 text-primary shadow-sm font-semibold' 
                                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary hover:shadow-sm'
                            }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive(item.href, item.exactMatch) ? 'text-primary' : 'text-muted-foreground group-hover:text-primary transition-colors'}`} />
                {!isSidebarCollapsed && item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
          <form action={logoutAction}>
            <Button variant="ghost" 
              className={`w-full py-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group
                          ${isSidebarCollapsed ? 'justify-center px-2.5 h-11' : 'justify-start px-3.5 h-11'}`}
              title={isSidebarCollapsed ? "Sair" : undefined}
            >
              <LogOut className={`h-5 w-5 shrink-0 text-muted-foreground group-hover:text-destructive transition-colors ${!isSidebarCollapsed ? 'mr-3.5' : ''}`} />
              {!isSidebarCollapsed && "Sair"}
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile Header & Main Content Area */}
      <div className="flex flex-col overflow-y-auto">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30 shadow-sm md:hidden">
          <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
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
                   <span className="font-display text-2xl font-bold text-sky-600">LP de Alta Performasse</span>
                </Link>
              </div>
              <nav className="grid gap-2 text-base font-medium p-4">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileSheetOpen(false)}
                    className={`flex items-center gap-4 rounded-lg px-3.5 py-3 transition-all duration-200 ease-in-out group
                                ${isActive(item.href, item.exactMatch) 
                                    ? 'bg-primary/15 text-primary font-semibold' 
                                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                                }`}
                  >
                    <item.icon className={`h-5 w-5 shrink-0 ${isActive(item.href, item.exactMatch) ? 'text-primary' : 'text-muted-foreground group-hover:text-primary transition-colors'}`} />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto p-4 border-t">
                <form action={logoutAction}>
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive group py-3 px-3.5">
                    <LogOut className="mr-4 h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" /> Sair
                  </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-grow flex flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8 bg-background">
          <div className="flex-grow">
            {children}
          </div>
          <footer className="text-center text-xs text-muted-foreground py-4 border-t mt-auto">
            Todos os direitos reservados FR Digital
          </footer>
        </main>
      </div>
    </div>
  );
}

