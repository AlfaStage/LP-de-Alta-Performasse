
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Database, FileJson, LucideIcon } from 'lucide-react';

const docNavItems: { title: string; href: string; icon: LucideIcon }[] = [
  {
    title: 'API de Estatísticas',
    href: '/config/dashboard/documentation/api',
    icon: Database,
  },
  {
    title: 'Guia: Criar Quiz (JSON)',
    href: '/config/dashboard/documentation/quiz-json',
    icon: FileJson,
  },
];

export default function DocumentationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="md:w-1/4 lg:w-1/5">
        <h2 className="text-xl font-bold mb-4">Documentação</h2>
        <nav className="flex flex-col gap-1">
          {docNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true} 
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
