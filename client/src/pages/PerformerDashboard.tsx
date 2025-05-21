import { useState, useEffect } from "react";
import { UserLevel } from "@/components/ui/user-level";
import { CoinGoal } from "@/components/ui/coin-goal";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Message, Transaction } from "@/types";
import { cn } from "@/lib/utils";
import { CoinsIcon, MessageSquareIcon, ActivityIcon, UsersIcon } from "lucide-react";

interface Stats {
  totalEarnings: number;
  messageCount: number;
  responseRate: number;
  averageResponseTime: number;
  activeConversations: number;
}

interface PerformerDashboardProps {
  user: User;
}

export default function PerformerDashboard({ user }: PerformerDashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalEarnings: 0,
    messageCount: 0,
    responseRate: 0,
    averageResponseTime: 0,
    activeConversations: 0,
  });

  const [dailyGoal, setDailyGoal] = useState({
    target: 1000,
    current: 0,
  });

  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Verileri yükle
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // API çağrıları burada yapılacak
      const response = await fetch("/api/performer/dashboard");
      const data = await response.json();

      setStats(data.stats);
      setRecentMessages(data.recentMessages);
      setTransactions(data.transactions);
      setDailyGoal({
        target: data.dailyGoal.target,
        current: data.dailyGoal.current,
      });
    } catch (error) {
      toast.error("Veriler yüklenirken bir hata oluştu");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Üst Bilgi Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Kazanç
            </CardTitle>
            <CoinsIcon className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEarnings} ZYRA</div>
            <p className="text-xs text-muted-foreground">
              Tüm zamanlar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mesaj Sayısı
            </CardTitle>
            <MessageSquareIcon className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messageCount}</div>
            <p className="text-xs text-muted-foreground">
              Bu ay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cevaplama Oranı
            </CardTitle>
            <ActivityIcon className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{stats.responseRate}</div>
            <p className="text-xs text-muted-foreground">
              Son 7 gün
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktif Sohbetler
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeConversations}</div>
            <p className="text-xs text-muted-foreground">
              Şu anda
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ana İçerik */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sol Kolon */}
        <div className="space-y-6">
          {/* Seviye ve Rozetler */}
          <Card>
            <CardHeader>
              <CardTitle>Seviye & Rozetler</CardTitle>
            </CardHeader>
            <CardContent>
              <UserLevel totalSpent={stats.totalEarnings} />
            </CardContent>
          </Card>

          {/* Günlük Hedef */}
          <Card>
            <CardHeader>
              <CardTitle>Günlük Hedef</CardTitle>
              <CardDescription>
                Hedefinize ulaştığınızda bonus kazanırsınız
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CoinGoal
                targetAmount={dailyGoal.target}
                currentAmount={dailyGoal.current}
                description="Günlük kazanç hedefi"
                onComplete={() => {
                  toast.success("🎉 Günlük hedefinize ulaştınız!");
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sağ Kolon */}
        <div className="space-y-6">
          {/* Mesajlar ve İşlemler */}
          <Tabs defaultValue="messages">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="messages">Son Mesajlar</TabsTrigger>
              <TabsTrigger value="transactions">İşlem Geçmişi</TabsTrigger>
            </TabsList>
            
            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle>Son Mesajlar</CardTitle>
                  <CardDescription>
                    Son 24 saat içinde gelen mesajlar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentMessages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">
                          {message.sender?.name || `Kullanıcı #${message.senderId}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {message.content}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Yanıtla
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>İşlem Geçmişi</CardTitle>
                  <CardDescription>
                    Son kazançlarınız ve ödemeleriniz
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">
                          {tx.type === "earn" ? "Kazanç" : "Ödeme"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tx.description}
                        </p>
                      </div>
                      <span className={cn(
                        "font-bold",
                        tx.type === "earn" ? "text-green-500" : "text-red-500"
                      )}>
                        {tx.type === "earn" ? "+" : "-"}{tx.amount} ZYRA
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Referans Programı */}
          <Card>
            <CardHeader>
              <CardTitle>Referans Programı</CardTitle>
              <CardDescription>
                Arkadaşlarınızı davet edin, bonus kazanın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg bg-secondary p-4">
                  <p className="font-mono text-sm">
                    {user.referralCode}
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `https://t.me/FlirtMarketBot?start=${user.referralCode}`
                    );
                    toast.success("Referans linki kopyalandı!");
                  }}
                >
                  Referans Linkini Kopyala
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Her yeni üye için 50 ZYRA kazanın
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 