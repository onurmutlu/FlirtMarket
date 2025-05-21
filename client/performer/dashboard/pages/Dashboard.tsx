import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { usePerformerStats } from '../hooks/usePerformerStats';
import { InboxPanel } from '../components/InboxPanel';
import { EarningsChart } from '../components/EarningsChart';
import { MissionBox } from '../components/MissionBox';
import { ReferralStats } from '../components/ReferralStats';
import { BadgeStatus } from '../components/BadgeStatus';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedNumber } from '../components/AnimatedNumber';

export default function PerformerDashboard() {
  const navigate = useNavigate();
  const { user, isLoading } = useUser();
  const userId = user?.id || 0;
  const { data: stats } = usePerformerStats(userId);

  useEffect(() => {
    if (!isLoading && (!user || user.type !== 'performer')) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Kazanç</p>
                <h3 className="text-2xl font-bold mt-1">
                  <AnimatedNumber value={stats?.totalEarnings || 0} suffix="ZYRA" />
                </h3>
              </div>
              <div className="rounded-full p-2 bg-primary/10">
                <span className="material-icons text-primary">monetization_on</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktif Sohbetler</p>
                <h3 className="text-2xl font-bold mt-1">
                  <AnimatedNumber value={stats?.activeChats || 0} />
                </h3>
              </div>
              <div className="rounded-full p-2 bg-primary/10">
                <span className="material-icons text-primary">chat</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Yanıt Oranı</p>
                <h3 className="text-2xl font-bold mt-1">
                  <AnimatedNumber value={stats?.responseRate || 0} suffix="%" />
                </h3>
              </div>
              <div className="rounded-full p-2 bg-primary/10">
                <span className="material-icons text-primary">speed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ortalama Puan</p>
                <h3 className="text-2xl font-bold mt-1">
                  <AnimatedNumber value={stats?.averageRating || 0} suffix="/5" />
                </h3>
              </div>
              <div className="rounded-full p-2 bg-primary/10">
                <span className="material-icons text-primary">star</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ana İçerik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol Sütun */}
        <div className="space-y-6">
          <InboxPanel userId={userId} />
          <MissionBox userId={userId} />
        </div>
        
        {/* Sağ Sütun */}
        <div className="space-y-6">
          <EarningsChart userId={userId} />
          <ReferralStats userId={userId} />
          <BadgeStatus userId={userId} />
        </div>
      </div>
    </div>
  );
} 