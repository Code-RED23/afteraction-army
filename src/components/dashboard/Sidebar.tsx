'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, MessageSquarePlus, TrendingUp, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  unitName: string;
  userRole: string;
}

const navItems = [
  { href: '/dashboard', label: 'AARs', icon: LayoutDashboard },
  { href: '/dashboard/debrief', label: 'Run AAR', icon: MessageSquarePlus, highlight: true },
  { href: '/dashboard/insights', label: 'Insights', icon: TrendingUp },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, ncoOnly: true },
];

export function Sidebar({ unitName, userRole }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900/50 border-r border-gray-800 flex flex-col h-screen sticky top-0 shrink-0 hidden md:flex">
      <div className="p-5 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-900/40 border border-green-800/40 flex items-center justify-center">
            <Shield className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <span className="text-sm font-bold text-gray-100">AfterAction</span>
            <span className="text-sm font-bold text-green-400"> Army</span>
          </div>
        </Link>
        <p className="text-xs text-gray-600 mt-2 truncate">{unitName}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems
          .filter((item) => !item.ncoOnly || userRole === 'admin' || userRole === 'nco')
          .map((item) => {
            const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive ? 'bg-green-900/20 text-green-400 border border-green-800/30'
                    : item.highlight ? 'text-green-300 hover:text-green-200 hover:bg-green-900/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                )}>
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <span className="text-xs text-gray-600">AfterAction Army v1.0</span>
      </div>
    </aside>
  );
}
