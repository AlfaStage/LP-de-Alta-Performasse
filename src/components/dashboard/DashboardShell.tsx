
'use client';

import React, { useState, type ReactNode } from 'react';
import Link from 'next/link';
// Image import removed as we are using text title
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, ListPlus, Settings2, LogOut, PanelLeftClose, PanelRightOpen, Briefcase } from 'lucide-react';

interface DashboardShellProps {
  children: ReactNode;
  logoutAction: () => Promise<void>;
}

const navItems = [
  { href: "/config/dashboard", label: "Quizzes (Início)", icon: Home },
  { href: "/config/dashboard/quiz/create", label: "Criar Novo Quiz", icon: ListPlus },
  { href: "/config/dashboard/settings", label: "Configurações", icon: Settings2 },
];

export default function DashboardShell({ children, logoutAction }: DashboardShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={`grid min-h-screen w-full bg-background transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'md:grid-cols-[80px_1fr]' : 'md:grid-cols-[280px_1fr]'
      }`}
    >
      {/* Desktop Sidebar - Fixed */}
      <div className={`hidden border-r bg-card md:flex flex-col shadow-sm sticky top-0 h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className={`flex h-20 items-center border-b shrink-0 ${isSidebarCollapsed ? 'px-4 justify-center' : 'px-6 justify-between'}`}>
          {!isSidebarCollapsed && (
            <Link href="/config/dashboard" className="flex items-center gap-3" aria-label="Página Inicial do Dashboard">
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
          <nav className={`grid items-start text-sm font-medium gap-1 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg py-3 text-muted-foreground transition-all duration-200 ease-in-out hover:bg-primary/10 hover:text-primary hover:shadow-sm group ${isSidebarCollapsed ? 'justify-center px-1' : 'px-3'}`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                {!isSidebarCollapsed && item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
          <form action={logoutAction}>
            <Button variant="ghost" 
              className={`w-full py-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group ${isSidebarCollapsed ? 'justify-center px-1' : 'justify-start px-3'}`}
              title={isSidebarCollapsed ? "Sair" : undefined}
            >
              <LogOut className={`h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Sair"}
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile Header & Main Content Area */}
      <div className="flex flex-col overflow-y-auto">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30 shadow-sm md:hidden">
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
                   <span className="font-display text-2xl font-bold text-sky-600">LP de Alta Performasse</span>
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
                <form action={logoutAction}>
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive group py-3">
                    <LogOut className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" /> Sair
                  </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
          {/* Content of mobile header (like title or user menu) is removed, only menu trigger remains */}
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
