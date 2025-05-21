import { useQuery } from '@tanstack/react-query';

interface PerformerStats {
  totalEarnings: number;
  weeklyEarnings: number;
  responseRate: number;
  averageRating: number;
  totalMessages: number;
  activeChats: number;
}

export function usePerformerStats(userId: number) {
  return useQuery({
    queryKey: ['performerStats', userId],
    queryFn: async (): Promise<PerformerStats> => {
      if (!userId) return {
        totalEarnings: 0,
        weeklyEarnings: 0,
        responseRate: 0,
        averageRating: 0,
        totalMessages: 0,
        activeChats: 0
      };

      const response = await fetch(`/api/performer/${userId}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('İstatistikler yüklenirken bir hata oluştu');
      }
      return response.json();
    },
  });
} 