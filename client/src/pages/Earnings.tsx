import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { Transaction } from '@/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function Earnings() {
  const { user } = useUser();
  const { toast } = useToast();
  
  // Fetch transactions
  const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      return response.json();
    }
  });
  
  // Calculate earnings statistics
  const calculateStats = () => {
    if (!transactions) return { weekly: 0, monthly: 0, total: 0 };
    
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    
    const monthStart = new Date(now);
    monthStart.setDate(1);
    
    const earningTransactions = transactions.filter(tx => tx.amount > 0);
    
    const weekly = earningTransactions
      .filter(tx => new Date(tx.createdAt) >= weekStart)
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    const monthly = earningTransactions
      .filter(tx => new Date(tx.createdAt) >= monthStart)
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    const total = earningTransactions
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    return { weekly, monthly, total };
  };
  
  // Copy referral link to clipboard
  const copyReferralLink = () => {
    if (!user?.referralCode) return;
    
    const referralLink = `https://t.me/YourBot?start=${user.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    
    toast({
      title: "Kopyalandı!",
      description: "Referans linkiniz panoya kopyalandı.",
    });
  };
  
  // Get referral count and earnings
  const getReferralStats = () => {
    if (!transactions) return { count: 0, earnings: 0 };
    
    const referralTransactions = transactions.filter(tx => tx.type === 'referral');
    const count = referralTransactions.length;
    const earnings = referralTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    return { count, earnings };
  };
  
  const stats = calculateStats();
  const referralStats = getReferralStats();
  
  return (
    <div className="h-full overflow-auto">
      <div className="p-4 bg-gradient-to-r from-secondary to-primary">
        <h2 className="text-lg font-bold text-white mb-2">Kazanç Bilgileri</h2>
        <div className="flex justify-between mb-2">
          <div>
            <p className="text-white/80 text-sm">Bu hafta</p>
            <div className="flex items-center">
              <span className="material-icons text-[#FFD700] mr-1">monetization_on</span>
              <span className="text-xl font-bold text-white">{stats.weekly}</span>
            </div>
          </div>
          <div>
            <p className="text-white/80 text-sm">Bu ay</p>
            <div className="flex items-center">
              <span className="material-icons text-[#FFD700] mr-1">monetization_on</span>
              <span className="text-xl font-bold text-white">{stats.monthly}</span>
            </div>
          </div>
          <div>
            <p className="text-white/80 text-sm">Toplam</p>
            <div className="flex items-center">
              <span className="material-icons text-[#FFD700] mr-1">monetization_on</span>
              <span className="text-xl font-bold text-white">{stats.total}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="bg-card rounded-lg overflow-hidden mb-4">
          <div className="border-b border-border p-4">
            <h3 className="text-lg font-medium text-foreground">İstatistikler</h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <div className="bg-background rounded-lg p-3">
              <p className="text-muted-foreground text-xs mb-1">Mesaj Yanıt Oranı</p>
              <div className="flex items-center">
                <span className="text-xl font-bold text-accent">{user?.responseRate ? `${Math.round(user.responseRate * 100)}%` : "N/A"}</span>
                <span className="text-green-500 text-xs ml-2">+2%</span>
              </div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-muted-foreground text-xs mb-1">Ortalama Yanıt Süresi</p>
              <div className="flex items-center">
                <span className="text-xl font-bold text-accent">{user?.responseTime ? `${user.responseTime}dk` : "N/A"}</span>
                <span className="text-green-500 text-xs ml-2">-2dk</span>
              </div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-muted-foreground text-xs mb-1">Profil Görüntülenme</p>
              <div className="flex items-center">
                <span className="text-xl font-bold text-accent">-</span>
                <span className="text-green-500 text-xs ml-2">+0</span>
              </div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-muted-foreground text-xs mb-1">Aktif Sohbetler</p>
              <div className="flex items-center">
                <span className="text-xl font-bold text-accent">-</span>
                <span className="text-green-500 text-xs ml-2">+0</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg overflow-hidden mb-4">
          <div className="border-b border-border p-4">
            <h3 className="text-lg font-medium text-foreground">Referans Programı</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Referans linkin ile arkadaşlarını davet et, her kaydolduklarında <span className="text-[#FFD700] font-medium">50 coin</span> kazan!
            </p>
            <div className="relative mb-4">
              <input 
                type="text" 
                value={`https://t.me/YourBot?start=${user?.referralCode || ""}`}
                readOnly 
                className="w-full bg-background border border-border rounded-lg text-muted-foreground p-3 pr-10 text-sm"
              />
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary"
                onClick={copyReferralLink}
              >
                <span className="material-icons">content_copy</span>
              </button>
            </div>
            <div className="flex items-center justify-between bg-background/50 rounded-lg p-3 mb-3">
              <div>
                <p className="text-muted-foreground text-sm">Toplam Referans</p>
                <p className="text-foreground font-medium">{referralStats.count} kullanıcı</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Kazanılan Coin</p>
                <div className="flex items-center">
                  <span className="material-icons text-[#FFD700] text-sm mr-1">monetization_on</span>
                  <span className="text-[#FFD700] font-medium">{referralStats.earnings}</span>
                </div>
              </div>
            </div>
            <button 
              className="w-full py-2.5 bg-primary text-white rounded-lg font-medium flex items-center justify-center"
              onClick={copyReferralLink}
            >
              <span className="material-icons mr-2">share</span>
              Referans Linkini Paylaş
            </button>
          </div>
        </div>
        
        <div className="bg-card rounded-lg overflow-hidden mb-6">
          <div className="border-b border-border p-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-foreground">Kazanç Geçmişi</h3>
            <span className="text-sm text-primary">Tümünü Gör</span>
          </div>
          
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="w-20 h-5 bg-muted rounded animate-pulse"></div>
                  <div className="w-16 h-5 bg-muted rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-muted-foreground">İşlem geçmişi yüklenemedi.</p>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="divide-y divide-border">
              {transactions
                .filter(tx => tx.amount > 0)
                .slice(0, 5)
                .map((transaction) => (
                  <div key={transaction.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-foreground font-medium">{transaction.amount} coin</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.createdAt), 'd MMMM yyyy', { locale: tr })}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full">
                      {transaction.type === 'earn' ? 'Mesaj' : 'Referans'}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-muted-foreground">Henüz kazancınız bulunmamaktadır.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
