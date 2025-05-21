import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { AnimatedNumber } from './AnimatedNumber';
import type { Mission } from '../types';

interface MissionBoxProps {
  userId: number;
}

function MissionCard({ mission }: { mission: Mission }) {
  const progressPercentage = (mission.progress / mission.target) * 100;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const completeMission = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/missions/${mission.id}/complete`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Görev tamamlanırken bir hata oluştu');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performerMissions'] });
      toast({
        title: 'Başarılı!',
        description: `${mission.reward} ZYRA kazandınız!`,
      });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'],
      });
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4"
    >
      <Card className={mission.completed ? 'border-primary' : ''}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-medium">{mission.title}</h4>
              <p className="text-sm text-muted-foreground">
                {mission.description}
              </p>
            </div>
            <Badge variant={mission.completed ? 'default' : 'outline'}>
              <AnimatedNumber value={mission.reward} suffix="ZYRA" />
            </Badge>
          </div>
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                <AnimatedNumber value={mission.progress} /> / <AnimatedNumber value={mission.target} />
              </span>
              <span>
                <AnimatedNumber value={progressPercentage} suffix="%" />
              </span>
            </div>
            {!mission.completed && mission.progress >= mission.target && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-2 mt-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={() => completeMission.mutate()}
                disabled={completeMission.isPending}
              >
                {completeMission.isPending ? 'Tamamlanıyor...' : 'Ödülü Al'}
              </motion.button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MissionSkeleton() {
  return (
    <div className="mb-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="space-y-2 mt-4">
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MissionBox({ userId }: MissionBoxProps) {
  const { data: missions, isLoading } = useQuery({
    queryKey: ['performerMissions', userId],
    queryFn: async () => {
      const response = await fetch('/api/missions/today');
      if (!response.ok) {
        throw new Error('Görevler yüklenirken bir hata oluştu');
      }
      return response.json() as Promise<Mission[]>;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Günlük Görevler</CardTitle>
          <CardDescription>Görevleri tamamla, bonus kazan</CardDescription>
        </CardHeader>
        <CardContent>
          {Array(3).fill(0).map((_, i) => (
            <MissionSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  const completedCount = missions?.filter((m) => m.completed).length || 0;
  const totalMissions = missions?.length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Günlük Görevler</CardTitle>
            <CardDescription>
              <AnimatedNumber value={completedCount} /> / <AnimatedNumber value={totalMissions} /> görev tamamlandı
            </CardDescription>
          </div>
          {completedCount === totalMissions && totalMissions > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-primary text-2xl"
            >
              🎉
            </motion.div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="popLayout">
          {missions?.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
} 