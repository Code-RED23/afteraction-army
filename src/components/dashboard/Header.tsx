'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Menu, X, LayoutDashboard, MessageSquarePlus, TrendingUp, Settings } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const mobileNav = [
  { href: '/dashboard', label: 'AARs', icon: LayoutDashboard },
  { href: '/dashboard/debrief', label: 'Run AAR', icon: MessageSquarePlus },
  { href: '/dashboard/insights', label: 'Insights', icon: TrendingUp },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Header({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const title = pathname === '/dashboard' ? 'After Action Reviews'
    : pathname.startsWith('/dashboard/debrief') ? 'AAR with First Sergeant'
    : pathname.startsWith('/dashboard/insights') ? 'Unit Insights'
    : pathname.startsWith('/dashboard/settings') ? 'Unit Settings'
    : pathname.match(/\/dashboard\/[^/]+$/) ? 'Review AAR'
    : 'Dashboard';

  return (
    <>
      <header className="h-14 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1.5 text-gray-400 hover:text-gray-200">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/dashboard" className="md:hidden flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm font-bold">AfterAction</span>
          </Link>
          <h1 className="hidden md:block text-sm font-medium text-gray-300">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:block">{userName}</span>
          <UserButton appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
        </div>
      </header>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-gray-950/95 pt-14">
          <nav className="p-4 space-y-1">
            {mobileNav.map((item) => {
              const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className={cn('flex items-center gap-3 px-4 py-3 rounded-lg text-sm', isActive ? 'bg-green-900/20 text-green-400' : 'text-gray-400 hover:text-gray-200')}>
                  <Icon className="w-5 h-5" />{item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
