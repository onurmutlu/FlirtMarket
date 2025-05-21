import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedNumber } from './AnimatedNumber';
import type { Badge } from '../types';

interface BadgeStatusProps {
  userId: number;
}

export function BadgeStatus({ userId }: BadgeStatusProps) {
  const { data: badges, isLoading } = useQuery({
    queryKey: ['performerBadges', userId],
    queryFn: async (): Promise<Badge[]> => {
      if (!userId) return [];

      const response = await fetch('/api/performer/badges');
      if (!response.ok) {
        throw new Error('Rozetler yüklenirken hata oluştu');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rozetler</CardTitle>
          <CardDescription>Başarılarınız ve seviyeleriniz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rozetler</CardTitle>
        <CardDescription>Başarılarınız ve seviyeleriniz</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {badges?.map((badge) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`rounded-full p-2 ${badge.unlocked ? 'bg-primary/10' : 'bg-muted'}`}>
                  <span className={`material-icons ${badge.unlocked ? 'text-primary' : 'text-muted-foreground'}`}>
                    {badge.icon}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{badge.name}</p>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                </div>
              </div>
              <div className="text-sm font-medium">
                Seviye <AnimatedNumber value={badge.level} /> / <AnimatedNumber value={badge.maxLevel} />
              </div>
            </div>
            <Progress value={(badge.progress / badge.target) * 100} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                <AnimatedNumber value={badge.progress} /> / <AnimatedNumber value={badge.target} />
              </span>
              <span>
                <AnimatedNumber value={(badge.progress / badge.target) * 100} suffix="%" />
              </span>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
} 