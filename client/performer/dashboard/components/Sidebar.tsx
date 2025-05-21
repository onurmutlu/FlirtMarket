import { NavLink } from 'react-router-dom';
import { MessageSquare, BarChart2, Target, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Mesajlar',
    href: '/performer/inbox',
    icon: MessageSquare,
  },
  {
    title: 'İstatistikler',
    href: '/performer/stats',
    icon: BarChart2,
  },
  {
    title: 'Görevler',
    href: '/performer/missions',
    icon: Target,
  },
  {
    title: 'Referanslar',
    href: '/performer/referrals',
    icon: Users,
  },
  {
    title: 'Ayarlar',
    href: '/performer/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  return (
    <div className="w-64 h-screen border-r bg-card p-4">
      <div className="flex items-center space-x-2 px-2 mb-8">
        <img src="/logo.png" alt="Logo" className="w-8 h-8" />
        <span className="font-semibold">FlirtMarket</span>
      </div>
      
      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center space-x-2 px-2 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
} 