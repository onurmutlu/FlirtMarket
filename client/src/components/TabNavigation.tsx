import { Link, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';
import {
  Home,
  MessageSquare,
  User,
  DollarSign,
  LayoutDashboard,
} from 'lucide-react';

interface TabNavigationProps {
  className?: string;
}

export default function TabNavigation({ className }: TabNavigationProps) {
  const location = useLocation();
  const { user } = useUser();

  const isPerformer = user?.type === 'performer';

  const tabs = [
    {
      name: 'Keşfet',
      path: '/',
      icon: Home,
      show: true,
      match: (path: string) => path === '/',
    },
    {
      name: 'Mesajlar',
      path: '/messages',
      icon: MessageSquare,
      show: true,
      match: (path: string) => path.startsWith('/messages') || path.startsWith('/conversation'),
    },
    {
      name: 'Profil',
      path: '/profile',
      icon: User,
      show: true,
      match: (path: string) => path === '/profile',
    },
    {
      name: 'Panel',
      path: '/performer/dashboard',
      icon: LayoutDashboard,
      show: isPerformer,
      match: (path: string) => path.startsWith('/performer/dashboard'),
    },
    {
      name: 'Kazanç',
      path: '/earnings',
      icon: DollarSign,
      show: isPerformer,
      match: (path: string) => path === '/earnings',
    },
  ];

  return (
    <nav className={cn('bg-background', className)}>
      <div className="container mx-auto px-4">
        <div className="flex justify-around">
          {tabs
            .filter(tab => tab.show)
            .map(tab => {
              const Icon = tab.icon;
              const isActive = tab.match(location.pathname);

              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={cn(
                    'flex flex-col items-center py-2 px-3 text-sm transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="mt-1">{tab.name}</span>
                </Link>
              );
            })}
        </div>
      </div>
    </nav>
  );
}
