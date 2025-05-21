import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface NotificationSettings {
  newMessage: boolean;
  missionComplete: boolean;
  newReferral: boolean;
  earnings: boolean;
}

export function useNotifications(userId: number) {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['notificationSettings', userId],
    queryFn: async (): Promise<NotificationSettings> => {
      const response = await fetch('/api/performer/notifications/settings');
      if (!response.ok) {
        throw new Error('Bildirim ayarları yüklenirken bir hata oluştu');
      }
      return response.json();
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<NotificationSettings>) => {
      const response = await fetch('/api/performer/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        throw new Error('Ayarlar güncellenirken bir hata oluştu');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      toast.success('Bildirim ayarları güncellendi');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Bir hata oluştu');
    },
  });

  return {
    settings,
    updateSettings,
  };
} 