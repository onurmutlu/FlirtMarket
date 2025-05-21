import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import type { ProfileFormData, NotificationSettings } from '../types';

const profileSchema = z.object({
  displayName: z.string().min(3, 'En az 3 karakter olmalı'),
  bio: z.string().max(500, 'En fazla 500 karakter olabilir'),
  photoUrl: z.string().url('Geçerli bir URL giriniz'),
  hourlyRate: z.number().min(10, 'En az 10 ZYRA olmalı'),
});

interface SettingsPanelProps {
  userId: number;
}

export function SettingsPanel({ userId }: SettingsPanelProps) {
  const [isBusy, setIsBusy] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      photoUrl: '',
      hourlyRate: 10,
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['performerSettings', userId],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Profil bilgileri yüklenemedi');
      }
      const data = await response.json() as ProfileFormData;
      form.reset(data);
      return data;
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ['notificationSettings', userId],
    queryFn: async () => {
      const response = await fetch('/api/notifications/settings');
      if (!response.ok) {
        throw new Error('Bildirim ayarları yüklenemedi');
      }
      return response.json() as Promise<NotificationSettings>;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Profil güncellenirken bir hata oluştu');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performerSettings'] });
      toast({
        title: 'Başarılı',
        description: 'Profil bilgileri güncellendi',
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

  const updateNotifications = useMutation({
    mutationFn: async (data: Partial<NotificationSettings>) => {
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Bildirim ayarları güncellenirken bir hata oluştu');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      toast({
        title: 'Başarılı',
        description: 'Bildirim ayarları güncellendi',
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

  const toggleBusyMode = async () => {
    try {
      setIsBusy(!isBusy);
      const response = await fetch('/api/status/busy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBusy: !isBusy }),
      });
      
      if (!response.ok) {
        throw new Error('Durum güncellenirken bir hata oluştu');
      }
      
      toast({
        title: 'Başarılı',
        description: isBusy ? 'Meşgul modu kapatıldı' : 'Meşgul modu açıldı',
      });
    } catch (error) {
      setIsBusy(isBusy);
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ayarlar</CardTitle>
        <CardDescription>Profil ve bildirim ayarlarını yönet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meşgul Modu */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <h4 className="font-medium">Meşgul Modu</h4>
            <p className="text-sm text-muted-foreground">
              Yeni mesaj almak istemediğinde aktifleştir
            </p>
          </div>
          <Switch
            checked={isBusy}
            onCheckedChange={toggleBusyMode}
          />
        </div>

        {/* Bildirim Ayarları */}
        <div className="rounded-lg border p-4 space-y-4">
          <h4 className="font-medium">Bildirim Ayarları</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Yeni Mesaj</p>
                <p className="text-sm text-muted-foreground">
                  Yeni mesaj geldiğinde bildirim al
                </p>
              </div>
              <Switch
                checked={notifications?.newMessage}
                onCheckedChange={(checked) =>
                  updateNotifications.mutate({ newMessage: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Görev Tamamlama</p>
                <p className="text-sm text-muted-foreground">
                  Görev tamamlandığında bildirim al
                </p>
              </div>
              <Switch
                checked={notifications?.missionComplete}
                onCheckedChange={(checked) =>
                  updateNotifications.mutate({ missionComplete: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Yeni Referans</p>
                <p className="text-sm text-muted-foreground">
                  Yeni referans geldiğinde bildirim al
                </p>
              </div>
              <Switch
                checked={notifications?.newReferral}
                onCheckedChange={(checked) =>
                  updateNotifications.mutate({ newReferral: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Profil Düzenleme */}
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-4">Profil Düzenleme</h4>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Görünen İsim</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biyografi</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormDescription>
                      Kendinizi kısaca tanıtın
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profil Fotoğrafı URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saatlik Ücret (ZYRA)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
} 