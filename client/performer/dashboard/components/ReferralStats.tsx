import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { AnimatedNumber } from './AnimatedNumber';
import type { Referral } from '../types';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
  recentReferrals: Referral[];
}

interface ReferralStatsProps {
  userId: number;
}

export function ReferralStats({ userId }: ReferralStatsProps) {
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['referralStats', userId],
    queryFn: async (): Promise<ReferralStats> => {
      if (!userId) return {
        referralCode: '',
        totalReferrals: 0,
        totalEarnings: 0,
        recentReferrals: []
      };

      const response = await fetch('/api/performer/referrals');
      if (!response.ok) {
        throw new Error('Referans bilgileri yüklenirken hata oluştu');
      }
      return response.json();
    },
  });

  const copyReferralLink = async () => {
    if (!stats?.referralCode) return;

    const referralLink = `${window.location.origin}/register?ref=${stats.referralCode}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Başarılı!",
        description: "Referans linki kopyalandı",
      });
    } catch (err) {
      toast({
        title: "Hata!",
        description: "Referans linki kopyalanamadı",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referans Programı</CardTitle>
          <CardDescription>Arkadaşlarını davet et, bonus kazan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referans Programı</CardTitle>
        <CardDescription>Arkadaşlarını davet et, bonus kazan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referans Kodu */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Referans Kodun</p>
            <Button variant="outline" size="sm" onClick={copyReferralLink}>
              <span className="material-icons mr-2 text-base">content_copy</span>
              Kopyala
            </Button>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <code className="text-sm">{stats?.referralCode}</code>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="rounded-lg border p-4 text-center"
          >
            <div className="text-2xl font-bold text-primary">
              <AnimatedNumber value={stats?.totalReferrals || 0} />
            </div>
            <p className="text-sm text-muted-foreground">Toplam Referans</p>
          </motion.div>
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="rounded-lg border p-4 text-center"
          >
            <div className="text-2xl font-bold text-primary">
              <AnimatedNumber value={stats?.totalEarnings || 0} suffix="ZYRA" />
            </div>
            <p className="text-sm text-muted-foreground">Toplam Kazanç</p>
          </motion.div>
        </div>

        {/* Son Referanslar */}
        {stats?.recentReferrals && stats.recentReferrals.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">Son Referanslar</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Kazanç</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentReferrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>{referral.username}</TableCell>
                    <TableCell>
                      <AnimatedNumber value={referral.earnedCoins} suffix="ZYRA" />
                    </TableCell>
                    <TableCell>
                      {format(new Date(referral.joinedAt), 'PPP', { locale: tr })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 