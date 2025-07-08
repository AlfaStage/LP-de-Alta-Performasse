
"use client";

import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { iconList } from '@/lib/lucide-icons';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

const IconComponents = LucideIcons as { [key: string]: React.FC<LucideIcons.LucideProps> };

interface IconPickerProps {
  value?: keyof typeof IconComponents;
  onChange: (iconName: keyof typeof IconComponents) => void;
  className?: string;
}

export default function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search) return iconList;
    return iconList.filter(icon => icon.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const SelectedIcon = value ? IconComponents[value] : IconComponents.HelpCircle;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground", className)}
        >
          <div className="flex items-center gap-2">
            {SelectedIcon && <SelectedIcon className="h-4 w-4" />}
            {value || 'Selecione um ícone'}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="p-2 border-b">
           <div className="relative">
             <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder="Buscar ícone..." 
                className="pl-8" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
           </div>
        </div>
        <ScrollArea className="h-72">
          <div className="p-2 grid grid-cols-6 gap-1">
            {filteredIcons.map((iconName) => {
              const IconComponent = IconComponents[iconName];
              if (!IconComponent) return null;
              return (
                <Button
                  key={iconName}
                  variant={value === iconName ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="h-9 w-9"
                >
                  <IconComponent className="h-5 w-5" />
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

    