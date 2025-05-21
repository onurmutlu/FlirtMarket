import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types";
import { closeWebApp } from "@/lib/telegram";
import { 
  User as UserIcon, 
  Calendar, 
  Edit, 
  LogOut, 
  Save,
  Clock, 
  Star, 
  Gift, 
  DollarSign,
  ChevronRight,
  Globe,
  Bell,
  CreditCard,
  HelpCircle,
  Shield,
  Camera
} from "lucide-react";

interface ProfileProps {
  user?: User;
}

interface FormData {
  bio: string;
  location: string;
  age: string;
  interests: string;
  messagePrice: number;
}

export default function Profile({ user: userProp }: ProfileProps) {
  let userData;
  let logoutFn = () => {};
  
  // Try to use the provided user prop first, otherwise fall back to useUser
  try {
    const userContext = useUser();
    userData = userProp || userContext.user;
    logoutFn = userContext.logout;
  } catch (error) {
    userData = userProp;
  }
  
  const user = userData;
  const logout = logoutFn;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingProfile, setEditingProfile] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    bio: user?.bio || "",
    location: user?.location || "",
    age: user?.age?.toString() || "",
    interests: user?.interests?.join(", ") || "",
    messagePrice: user?.messagePrice || 35,
  });
  
  // Update user profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await apiRequest('PATCH', '/api/users/me', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      setEditingProfile(false);
      toast({
        title: "Profil güncellendi",
        description: "Profil bilgileriniz başarıyla güncellendi.",
      });
    },
    onError: () => {
      toast({
        title: "Güncelleme başarısız",
        description: "Profil bilgileriniz güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = () => {
    const interestsArray = formData.interests.split(",")
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    updateProfileMutation.mutate({
      bio: formData.bio,
      location: formData.location,
      age: formData.age ? parseInt(formData.age) : null,
      interests: interestsArray,
      messagePrice: formData.messagePrice,
    });
  };
  
  const handleLogout = () => {
    logout();
  };
  
  if (!user) return null;
  
  return (
    <div className="h-full overflow-auto">
      <div className="p-4 flex flex-col items-center">
        <div className="relative mb-4">
          <img 
            src={user.profilePhoto || `https://ui-avatars.com/api/?name=${user.firstName}&background=random&color=fff&size=120`} 
            alt="User avatar" 
            className="w-24 h-24 rounded-full object-cover border-2 border-primary"
          />
          {editingProfile && (
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-card rounded-full border border-border flex items-center justify-center">
              <div className="i-material-symbols:edit text-muted-foreground text-sm"></div>
            </button>
          )}
        </div>
        
        <h2 className="text-xl font-bold text-foreground mb-1">
          {user.firstName} {user.lastName || ""}
        </h2>
        
        <p className="text-sm text-muted-foreground mb-4">
          {user.location || "Konum belirtilmemiş"}
        </p>
        
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-lg p-3 text-center">
            <p className="text-muted-foreground text-sm mb-1">Coin Bakiyesi</p>
            <div className="flex items-center justify-center">
              <div className="i-material-symbols:monetization-on text-[#FFD700] mr-1"></div>
              <span className="text-xl font-bold text-[#FFD700]">{user.coins || 0}</span>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-3 text-center">
            <p className="text-muted-foreground text-sm mb-1">Toplam Mesaj</p>
            <div className="flex items-center justify-center">
              <div className="i-material-symbols:chat-bubble text-muted-foreground mr-1"></div>
              <span className="text-xl font-bold text-foreground">-</span>
            </div>
          </div>
        </div>
        
        {editingProfile ? (
          // Edit mode
          <div className="w-full bg-card rounded-lg overflow-hidden mb-4">
            <div className="border-b border-border p-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-foreground">Profil Düzenle</h3>
              <button 
                className="text-primary"
                onClick={() => setEditingProfile(false)}
              >
                İptal
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Hakkımda</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full bg-background border border-border rounded-lg p-3 text-foreground resize-none focus:outline-none focus:border-primary"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Konum</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Yaş</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">İlgi Alanları (virgülle ayırın)</label>
                <input
                  type="text"
                  name="interests"
                  value={formData.interests}
                  onChange={handleInputChange}
                  className="w-full bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              
              {user.type === "performer" && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Mesaj Fiyatı (coin)</label>
                  <input
                    type="number"
                    name="messagePrice"
                    value={formData.messagePrice}
                    onChange={handleInputChange}
                    min={5}
                    className="w-full bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              )}
              
              <button 
                className="w-full py-3 bg-primary text-white rounded-lg font-medium"
                onClick={handleSubmit}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </button>
            </div>
          </div>
        ) : (
          // View mode
          <>
            <div className="w-full bg-card rounded-lg overflow-hidden mb-4">
              <div className="border-b border-border p-4 flex justify-between items-center">
                <h3 className="text-lg font-medium text-foreground">Hesap Ayarları</h3>
                <button 
                  className="text-primary"
                  onClick={() => setEditingProfile(true)}
                >
                  Düzenle
                </button>
              </div>
              
              <div className="divide-y divide-border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <UserIcon className="w-5 h-5 mr-3 text-muted-foreground" />
                    <span className="text-foreground">Profil Bilgileri</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 mr-3 text-muted-foreground" />
                    <span className="text-foreground">Dil</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground mr-2">Türkçe</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 mr-3 text-muted-foreground" />
                    <span className="text-foreground">Bildirimler</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-3 text-muted-foreground" />
                    <span className="text-foreground">Ödeme Yöntemleri</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>
            
            <div className="w-full bg-card rounded-lg overflow-hidden mb-6">
              <div className="border-b border-border p-4">
                <h3 className="text-lg font-medium text-foreground">Destek</h3>
              </div>
              
              <div className="divide-y divide-border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <HelpCircle className="w-5 h-5 mr-3 text-muted-foreground" />
                    <span className="text-foreground">Yardım Merkezi</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 mr-3 text-muted-foreground" />
                    <span className="text-foreground">Gizlilik Politikası</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>
            
            <button 
              className="w-full py-3 text-red-400 border border-red-400/30 rounded-lg mb-8 flex items-center justify-center"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </button>
          </>
        )}
      </div>
    </div>
  );
}
