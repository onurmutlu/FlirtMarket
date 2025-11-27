import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type Gifter = {
  username: string;
  giftCount: number;
  totalValue: number;
};

type RecentGift = {
  username: string;
  giftName: string;
  value: number;
  date: string;
};

type CashoutRecord = {
  amount: number;
  status: string;
  date: string;
  fee: number;
};

type MonetizationPanelProps = {
  userId: number;
};

export function MonetizationPanel({ userId }: MonetizationPanelProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState({
    subscribers: 0,
    monthlyIncome: 0,
    vipContent: 0
  });
  const [giftData, setGiftData] = useState<{
    totalGifts: number;
    topGifters: Gifter[];
    recentGifts: RecentGift[];
  }>({
    totalGifts: 0,
    topGifters: [],
    recentGifts: []
  });
  const [cashoutData, setCashoutData] = useState<{
    availableBalance: number;
    pendingCashouts: number;
    cashoutHistory: CashoutRecord[];
  }>({
    availableBalance: 0,
    pendingCashouts: 0,
    cashoutHistory: []
  });
  const [vipPrice, setVipPrice] = useState('');
  const [isCreatingVip, setIsCreatingVip] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [isRequestingCashout, setIsRequestingCashout] = useState(false);

  useEffect(() => {
    fetchMonetizationData();
  }, [userId]);

  const fetchMonetizationData = async () => {
    try {
      setLoading(true);
      
      // Gerçek API'ler hazır olduğunda burayı güncelleyin
      // Şimdilik demo veriler kullanıyoruz
      
      // Abonelik verileri
      setSubscriptionData({
        subscribers: 24,
        monthlyIncome: 2400,
        vipContent: 12
      });
      
      // Hediye verileri
      setGiftData({
        totalGifts: 156,
        topGifters: [
          { username: 'ahmet_k', giftCount: 42, totalValue: 1250 },
          { username: 'mehmet_y', giftCount: 28, totalValue: 980 },
          { username: 'ali_z', giftCount: 15, totalValue: 620 }
        ],
        recentGifts: [
          { username: 'kemal_s', giftName: 'Elmas', value: 100, date: '2023-11-20' },
          { username: 'ahmet_k', giftName: 'Taç', value: 200, date: '2023-11-19' },
          { username: 'mehmet_y', giftName: 'Şampanya', value: 50, date: '2023-11-18' }
        ]
      });
      
      // Para çekme verileri
      setCashoutData({
        availableBalance: 5600,
        pendingCashouts: 1000,
        cashoutHistory: [
          { amount: 2000, status: 'Tamamlandı', date: '2023-11-15', fee: 200 },
          { amount: 3000, status: 'Tamamlandı', date: '2023-11-01', fee: 300 },
          { amount: 1000, status: 'Beklemede', date: '2023-11-20', fee: 100 }
        ]
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Monetizasyon verileri yüklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createVipSubscription = async () => {
    if (!vipPrice || isNaN(Number(vipPrice)) || Number(vipPrice) <= 0) {
      toast({
        title: 'Geçersiz Fiyat',
        description: 'Lütfen geçerli bir abonelik fiyatı girin.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingVip(true);
    
    try {
      // Gerçek API hazır olduğunda burayı güncelleyin
      await new Promise(resolve => setTimeout(resolve, 1000)); // Demo için gecikme
      
      toast({
        title: 'Başarılı',
        description: 'VIP abonelik başarıyla oluşturuldu.',
      });
      
      setVipPrice('');
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'VIP abonelik oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingVip(false);
    }
  };

  const requestCashout = async () => {
    const amount = Number(cashoutAmount);
    
    if (!cashoutAmount || isNaN(amount) || amount <= 0) {
      toast({
        title: 'Geçersiz Miktar',
        description: 'Lütfen geçerli bir çekim miktarı girin.',
        variant: 'destructive',
      });
      return;
    }
    
    if (amount > cashoutData.availableBalance) {
      toast({
        title: 'Yetersiz Bakiye',
        description: 'Çekim miktarı mevcut bakiyenizden fazla olamaz.',
        variant: 'destructive',
      });
      return;
    }

    setIsRequestingCashout(true);
    
    try {
      // Gerçek API hazır olduğunda burayı güncelleyin
      await new Promise(resolve => setTimeout(resolve, 1000)); // Demo için gecikme
      
      // Bakiyeyi güncelle
      setCashoutData(prev => ({
        ...prev,
        availableBalance: prev.availableBalance - amount,
        pendingCashouts: prev.pendingCashouts + amount,
        cashoutHistory: [
          { amount, status: 'Beklemede', date: new Date().toISOString().split('T')[0], fee: amount * 0.1 },
          ...prev.cashoutHistory
        ]
      }));
      
      toast({
        title: 'Başarılı',
        description: 'Para çekme talebiniz başarıyla oluşturuldu.',
      });
      
      setCashoutAmount('');
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Para çekme talebi oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsRequestingCashout(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kazanç Yönetimi</CardTitle>
        <CardDescription>Abonelikler, hediyeler ve para çekme işlemleri</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="subscriptions">
          <TabsList className="mb-4">
            <TabsTrigger value="subscriptions">Abonelikler</TabsTrigger>
            <TabsTrigger value="gifts">Hediyeler</TabsTrigger>
            <TabsTrigger value="cashout">Para Çekme</TabsTrigger>
          </TabsList>
          
          {/* Abonelikler Sekmesi */}
          <TabsContent value="subscriptions">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Toplam Abone</p>
                  <p className="text-2xl font-bold">{subscriptionData.subscribers}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Aylık Gelir</p>
                  <p className="text-2xl font-bold">{subscriptionData.monthlyIncome} Coin</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">VIP İçerik Sayısı</p>
                  <p className="text-2xl font-bold">{subscriptionData.vipContent}</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h3 className="text-lg font-semibold mb-2">VIP Abonelik Oluştur</h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="vip-price">Aylık Abonelik Fiyatı (Coin)</Label>
                    <Input
                      id="vip-price"
                      placeholder="Örn: 500"
                      value={vipPrice}
                      onChange={(e) => setVipPrice(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={createVipSubscription}
                    disabled={isCreatingVip || !vipPrice}
                    className="self-end"
                  >
                    {isCreatingVip ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        İşlem Yapılıyor...
                      </>
                    ) : (
                      'VIP Abonelik Oluştur'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Hediyeler Sekmesi */}
          <TabsContent value="gifts">
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Toplam Alınan Hediye</p>
                <p className="text-2xl font-bold">{giftData.totalGifts}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">En Çok Hediye Gönderenler</h3>
                <div className="space-y-2">
                  {giftData.topGifters.map((gifter, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                          {gifter.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">@{gifter.username}</p>
                          <p className="text-sm text-muted-foreground">{gifter.giftCount} hediye</p>
                        </div>
                      </div>
                      <p className="font-medium">{gifter.totalValue} Coin</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Son Alınan Hediyeler</h3>
                <div className="space-y-2">
                  {giftData.recentGifts.map((gift, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                          🎁
                        </div>
                        <div>
                          <p className="font-medium">{gift.giftName}</p>
                          <p className="text-sm text-muted-foreground">@{gift.username}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{gift.value} Coin</p>
                        <p className="text-sm text-muted-foreground">{gift.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Para Çekme Sekmesi */}
          <TabsContent value="cashout">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Mevcut Bakiye</p>
                  <p className="text-2xl font-bold">{cashoutData.availableBalance} Coin</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Bekleyen Çekim</p>
                  <p className="text-2xl font-bold">{cashoutData.pendingCashouts} Coin</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Para Çekme Talebi</h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="cashout-amount">Çekilecek Miktar (Coin)</Label>
                    <Input
                      id="cashout-amount"
                      placeholder="Örn: 1000"
                      value={cashoutAmount}
                      onChange={(e) => setCashoutAmount(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Not: Para çekme işlemlerinde %10 platform komisyonu uygulanır.
                    </p>
                  </div>
                  <Button 
                    onClick={requestCashout}
                    disabled={isRequestingCashout || !cashoutAmount || Number(cashoutAmount) > cashoutData.availableBalance}
                    className="self-end"
                  >
                    {isRequestingCashout ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        İşlem Yapılıyor...
                      </>
                    ) : (
                      'Para Çekme Talebi Oluştur'
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Para Çekme Geçmişi</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Tarih</th>
                        <th className="text-left py-2 px-4">Miktar</th>
                        <th className="text-left py-2 px-4">Komisyon</th>
                        <th className="text-left py-2 px-4">Net Tutar</th>
                        <th className="text-left py-2 px-4">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashoutData.cashoutHistory.map((cashout, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{cashout.date}</td>
                          <td className="py-2 px-4">{cashout.amount} Coin</td>
                          <td className="py-2 px-4">{cashout.fee} Coin</td>
                          <td className="py-2 px-4">{cashout.amount - cashout.fee} Coin</td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              cashout.status === 'Beklemede' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : cashout.status === 'Onaylandı' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {cashout.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
