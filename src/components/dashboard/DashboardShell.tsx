
'use client';

import React, { useState, type ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, ListPlus, Settings2, LogOut, PanelLeftClose, PanelRightOpen, Briefcase, BookText, BarChartHorizontalBig } from 'lucide-react';

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  exactMatch?: boolean;
  isCollapsed: boolean;
  onLinkClick?: () => void;
}

const navItems = [
  { href: "/config/dashboard", label: "Quizzes (Início)", icon: Home, exactMatch: true },
  { href: "/config/dashboard/quiz/create", label: "Criar Novo Quiz", icon: ListPlus, exactMatch: true }, 
  { href: "/config/dashboard/settings", label: "Configurações", icon: Settings2, exactMatch: false }, 
  { href: "/config/dashboard/documentation", label: "Documentação", icon: BookText, exactMatch: false }, 
];

function NavLink({ href, label, icon: Icon, exactMatch = false, isCollapsed, onLinkClick }: NavItemProps) {
    const pathname = usePathname();
    const isActive = exactMatch ? pathname === href : pathname.startsWith(href);

    return (
        <Link
            href={href}
            onClick={onLinkClick}
            prefetch={true} 
            className={`flex items-center gap-3.5 rounded-lg py-2.5 transition-all duration-200 ease-in-out group
                        ${isCollapsed ? 'justify-center px-2.5 h-11' : 'px-3.5 h-11'}
                        ${isActive 
                            ? 'bg-primary/15 text-primary shadow-sm font-semibold' 
                            : 'text-muted-foreground hover:bg-primary/10 hover:text-primary hover:shadow-sm'
                        }`}
            title={isCollapsed ? label : undefined}
        >
            <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary transition-colors'}`} />
            {!isCollapsed && <span>{label}</span>}
        </Link>
    );
}

function DashboardNav({ isCollapsed, onLinkClick }: { isCollapsed: boolean, onLinkClick?: () => void }) {
    return (
        <nav className={`grid items-start text-sm font-medium gap-1.5 ${isCollapsed ? 'px-2' : 'px-4'}`}>
            {navItems.map((item) => (
                <NavLink key={item.href} {...item} isCollapsed={isCollapsed} onLinkClick={onLinkClick} />
            ))}
        </nav>
    );
}


interface DashboardShellProps {
  children: ReactNode;
  logoutAction: () => Promise<void>;
}

export default function DashboardShell({ children, logoutAction }: DashboardShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  // Close mobile sheet on navigation
  useEffect(() => {
    if (isMobileSheetOpen) {
      setIsMobileSheetOpen(false); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);


  return (
    <div className={`grid min-h-screen w-full bg-background transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'md:grid-cols-[68px_1fr]' : 'md:grid-cols-[280px_1fr]'
      }`}
    >
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col border-r bg-card shadow-sm sticky top-0 h-screen transition-all duration-300 ease-in-out`}>
        <div className={`flex h-20 items-center border-b shrink-0 ${isSidebarCollapsed ? 'px-3 justify-center' : 'px-6 justify-between'}`}>
          <Link href="/config/dashboard" className="flex items-center gap-2.5" aria-label="Página Inicial do Dashboard">
             <BarChartHorizontalBig className="h-7 w-7 text-primary" />
             {!isSidebarCollapsed && <span className="font-display text-xl font-bold text-primary">LP de Alta Performasse</span>}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
            <DashboardNav isCollapsed={isSidebarCollapsed} />
        </div>

        <div className="mt-auto p-4 border-t space-y-2">
           <Button
            onClick={toggleSidebar}
            variant="ghost"
            size="icon"
            className={`w-full text-muted-foreground hover:text-primary hover:bg-primary/10
                        ${isSidebarCollapsed ? 'justify-center h-11' : 'justify-start h-11 px-3.5'}`}
            aria-label={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isSidebarCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            {!isSidebarCollapsed && "Recolher Menu"}
          </Button>
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
      </aside>

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
                    <BarChartHorizontalBig className="h-7 w-7 text-primary" />
                   <span className="font-display text-xl font-bold text-primary">LP de Alta Performasse</span>
                </Link>
              </div>
              <div className="py-4">
                  <DashboardNav isCollapsed={false} onLinkClick={() => setIsMobileSheetOpen(false)} />
              </div>
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
             LP de Alta Performasse
          </footer>
        </main>
      </div>
    </div>
  );
}
