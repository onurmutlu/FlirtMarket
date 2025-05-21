import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { User } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Users, UserCheck, MessageSquare, Coins, Search, Edit, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalPerformers: 0,
    totalMessages: 0,
    recentUsers: [],
    recentPerformers: []
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [coinAmount, setCoinAmount] = useState<string>("");
  const [coinReason, setCoinReason] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAdjustingCoins, setIsAdjustingCoins] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/dashboard");
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Dashboard verileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kullanıcılar yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserType = async (userId: number, type: "user" | "performer") => {
    try {
      await apiRequest("PATCH", `/api/admin/users/${userId}`, { type });
      toast({
        title: "Başarılı",
        description: "Kullanıcı tipi güncellendi.",
      });
      fetchUsers(); // Listeyi yenile
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kullanıcı tipi güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const adjustCoins = async () => {
    if (!selectedUser) return;

    const amount = parseInt(coinAmount);
    if (isNaN(amount)) {
      toast({
        title: "Hata",
        description: "Geçerli bir miktar girin.",
        variant: "destructive",
      });
      return;
    }

    setIsAdjustingCoins(true);

    try {
      const response = await apiRequest(
        "POST", 
        `/api/admin/users/${selectedUser.id}/adjust-coins`, 
        { 
          amount, 
          reason: coinReason || (amount >= 0 ? "Admin tarafından eklendi" : "Admin tarafından çıkarıldı") 
        }
      );
      
      const updatedUser = await response.json();
      
      // Kullanıcı listesini güncelle
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      
      // Seçili kullanıcıyı güncelle
      setSelectedUser(updatedUser);
      
      // Formu sıfırla
      setCoinAmount("");
      setCoinReason("");
      
      toast({
        title: "Başarılı",
        description: `${Math.abs(amount)} coin ${amount >= 0 ? "eklendi" : "çıkarıldı"}.`,
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Coin bakiyesi güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsAdjustingCoins(false);
    }
  };

  const filteredUsers = searchQuery
    ? users.filter(user => 
        user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.telegramId?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  if (!user || user.type !== "admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Erişim Engellendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Bu sayfaya erişim yetkiniz yok. Yalnızca admin hesapları bu sayfaya erişebilir.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container p-6 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Yönetici Paneli</h1>
      
      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Normal kullanıcı hesapları
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Showcu</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalPerformers}</div>
            <p className="text-xs text-muted-foreground">
              Showcu hesapları
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Mesaj</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              Tüm mesajlaşmalar
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="stats">İstatistikler</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kullanıcı Listesi */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Kullanıcılar</CardTitle>
                <CardDescription>Tüm kayıtlı kullanıcılar</CardDescription>
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Kullanıcı ara..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Kullanıcı bulunamadı</p>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className={`flex items-center justify-between p-3 bg-background rounded-lg hover:bg-muted/50 cursor-pointer border ${
                            selectedUser?.id === user.id ? "border-primary" : "border-transparent"
                          }`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                              {user.firstName?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-muted-foreground">@{user.username || user.telegramId}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.type === "performer" 
                              ? "bg-primary/20 text-primary" 
                              : user.type === "admin"
                                ? "bg-destructive/20 text-destructive"
                                : "bg-muted text-muted-foreground"
                          }`}>
                            {user.type === "performer" ? "Showcu" : user.type === "admin" ? "Admin" : "Normal"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Kullanıcı Detayları */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Kullanıcı Detayları</CardTitle>
                <CardDescription>Seçili kullanıcının bilgileri</CardDescription>
              </CardHeader>
              
              <CardContent>
                {selectedUser ? (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold">
                        {selectedUser.profilePhoto ? (
                          <img
                            src={selectedUser.profilePhoto}
                            alt={selectedUser.firstName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          selectedUser.firstName?.[0]?.toUpperCase() || "U"
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-medium">{selectedUser.firstName} {selectedUser.lastName}</h3>
                        <p className="text-sm text-muted-foreground">@{selectedUser.username || selectedUser.telegramId}</p>
                        <p className="text-sm text-muted-foreground">ID: {selectedUser.id} • Telegram: {selectedUser.telegramId}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                          <CardTitle className="text-sm font-medium">Coin Bakiyesi</CardTitle>
                          <Coins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-2xl font-bold">{selectedUser.coins}</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                          <CardTitle className="text-sm font-medium">Hesap Tipi</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-lg font-medium capitalize">
                            {selectedUser.type === "performer" ? "Showcu" : 
                             selectedUser.type === "admin" ? "Admin" : "Normal Kullanıcı"}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                          <CardTitle className="text-sm font-medium">Son Aktivite</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm">
                            {selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleString("tr-TR") : "Bilinmiyor"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Hesap Tipi Değiştir</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex space-x-2">
                            <Button 
                              variant={selectedUser.type === "user" ? "default" : "outline"}
                              className="flex-1"
                              onClick={() => updateUserType(selectedUser.id, "user")}
                            >
                              Normal Kullanıcı
                            </Button>
                            <Button 
                              variant={selectedUser.type === "performer" ? "default" : "outline"}
                              className="flex-1"
                              onClick={() => updateUserType(selectedUser.id, "performer")}
                            >
                              Showcu
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Coin Bakiyesini Düzenle</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="coinAmount">Miktar</Label>
                                <Input
                                  id="coinAmount"
                                  type="number"
                                  placeholder="+ ekle, - çıkar"
                                  value={coinAmount}
                                  onChange={(e) => setCoinAmount(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="coinReason">Açıklama (Opsiyonel)</Label>
                                <Input
                                  id="coinReason"
                                  placeholder="İşlem açıklaması"
                                  value={coinReason}
                                  onChange={(e) => setCoinReason(e.target.value)}
                                />
                              </div>
                            </div>
                            
                            <Button 
                              onClick={adjustCoins} 
                              disabled={isAdjustingCoins || !coinAmount} 
                              className="w-full"
                            >
                              {isAdjustingCoins ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  İşlem Yapılıyor...
                                </>
                              ) : (
                                <>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Coin Bakiyesini Güncelle
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <Users className="h-16 w-16 mb-4 opacity-20" />
                    <p>Detayları görüntülemek için bir kullanıcı seçin</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>İstatistikler</CardTitle>
              <CardDescription>
                Platform istatistikleri ve analizler burada gösterilecek
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-20 text-muted-foreground">
                İstatistik özellikleri geliştirme aşamasında...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 