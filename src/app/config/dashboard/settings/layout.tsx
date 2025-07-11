
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Settings, Palette, Link2, BarChart3, Info, Fingerprint, LucideIcon, BrainCircuit } from 'lucide-react';

const settingsNavItems: { title: string; href: string; icon: LucideIcon }[] = [
  {
    title: 'Geral',
    href: '/config/dashboard/settings/general',
    icon: Settings,
  },
  {
    title: 'Aparência',
    href: '/config/dashboard/settings/appearance',
    icon: Palette,
  },
  {
    title: 'Integrações',
    href: '/config/dashboard/settings/integrations',
    icon: Link2,
  },
  {
    title: 'Rastreadores',
    href: '/config/dashboard/settings/tracking',
    icon: Fingerprint,
  },
   {
    title: 'Prompts de IA',
    href: '/config/dashboard/settings/prompts',
    icon: BrainCircuit,
  },
  {
    title: 'Estatísticas',
    href: '/config/dashboard/settings/analytics',
    icon: BarChart3,
  },
  {
    title: 'Sobre',
    href: '/config/dashboard/settings/about',
    icon: Info,
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="md:w-1/4 lg:w-1/5">
        <h2 className="text-xl font-bold mb-4">Configurações</h2>
        <nav className="flex flex-col gap-1">
          {settingsNavItems.map((item) => (
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
