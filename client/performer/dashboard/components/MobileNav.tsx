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

export function MobileNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-card">
      <nav className="flex justify-around p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center p-2 rounded-lg text-xs',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
} 