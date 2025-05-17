import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { User } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PerformerProfileProps {
  performerId: number;
  onBack: () => void;
  onStartConversation: (performerId: number) => void;
}

export default function PerformerProfile({ 
  performerId, 
  onBack,
  onStartConversation
}: PerformerProfileProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch performer profile
  const { data: performer, isLoading, error } = useQuery<User>({
    queryKey: [`/api/performers/${performerId}`],
    queryFn: async () => {
      const response = await fetch(`/api/performers/${performerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch performer profile');
      }
      
      return response.json();
    }
  });
  
  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/conversations', {
        regularUserId: user?.id,
        performerId: performerId
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate conversations query to update the list
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      // Navigate to conversation
      onStartConversation(performerId);
    },
    onError: (error) => {
      console.error("Error creating conversation:", error);
      toast({
        title: "Mesajlaşma başlatılamadı",
        description: "Lütfen daha sonra tekrar deneyin.",
        variant: "destructive"
      });
    }
  });
  
  // Handle start conversation
  const handleStartConversation = () => {
    if (!user) {
      toast({
        title: "Lütfen giriş yapın",
        description: "Mesaj göndermek için giriş yapmanız gerekmektedir.",
        variant: "destructive"
      });
      return;
    }
    
    if (user.type === "performer") {
      toast({
        title: "İzin verilmiyor",
        description: "Şovcular diğer şovculara mesaj gönderemez.",
        variant: "destructive"
      });
      return;
    }
    
    const messagePrice = performer?.messagePrice || 35;
    
    if ((user.coins || 0) < messagePrice) {
      toast({
        title: "Yetersiz coin",
        description: `Mesaj göndermek için ${messagePrice} coin gerekmektedir.`,
        variant: "destructive"
      });
      return;
    }
    
    // Create conversation
    createConversationMutation.mutate();
  };
  
  // Toggle favorite
  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    
    // Show toast
    toast({
      title: isFavorited ? "Favorilerden çıkarıldı" : "Favorilere eklendi",
      description: isFavorited 
        ? `${performer?.firstName} favorilerinizden çıkarıldı.` 
        : `${performer?.firstName} favorilerinize eklendi.`
    });
  };
  
  // Format user activity status
  const formatActivityStatus = (lastActive?: Date) => {
    if (!lastActive) return "Son görülme bilinmiyor";
    
    const lastActiveDate = typeof lastActive === 'string' 
      ? new Date(lastActive) 
      : lastActive;
    
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60));
    
    if (diffMinutes < 5) {
      return "Şu anda çevrimiçi";
    } else if (diffMinutes < 60) {
      return `${diffMinutes} dakika önce aktifti`;
    } else if (diffMinutes < 24 * 60) {
      return `${Math.floor(diffMinutes / 60)} saat önce aktifti`;
    } else {
      return `${Math.floor(diffMinutes / (24 * 60))} gün önce aktifti`;
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Error state
  if (error || !performer) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <span className="material-icons text-5xl text-muted-foreground mb-3">error_outline</span>
        <h3 className="text-lg font-bold text-foreground mb-2">Profil yüklenemedi</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Şovcu profili yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </p>
        <button 
          className="px-6 py-2 bg-primary text-white rounded-full font-medium"
          onClick={onBack}
        >
          Geri Dön
        </button>
      </div>
    );
  }
  
  const isPerformerOnline = (date?: Date) => {
    if (!date) return false;
    
    const lastActiveDate = typeof date === 'string' 
      ? new Date(date) 
      : date;
    
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60));
    
    return diffMinutes < 5;
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="relative">
        <img 
          src={performer.profilePhoto || `https://ui-avatars.com/api/?name=${performer.firstName}&background=random&color=fff&size=600`} 
          alt={`${performer.firstName}'s profile`} 
          className="w-full h-72 object-cover"
        />
        
        <button 
          className="absolute top-4 left-4 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center"
          onClick={onBack}
        >
          <span className="material-icons text-white">arrow_back</span>
        </button>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-4">
          <div className="flex items-center mb-1">
            <h2 className="text-2xl font-bold text-white mr-2">
              {performer.firstName} {performer.lastName?.charAt(0) || ""}{performer.lastName ? "." : ""}, {performer.age || "?"}
            </h2>
            <div className="flex items-center bg-black/40 rounded-full px-2 py-0.5">
              <span className="material-icons text-yellow-400 text-xs mr-0.5">star</span>
              <span className="text-white text-xs">{performer.rating.toFixed(1)}</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="inline-flex items-center mr-3 text-white/90 text-sm">
              <span className="material-icons text-sm mr-1">location_on</span>
              {performer.location || "Konum belirtilmemiş"}
            </span>
            <span className="inline-flex items-center text-white/90 text-sm">
              <span className="material-icons text-sm mr-1">schedule</span>
              {performer.responseTime ? `${performer.responseTime} dk içinde yanıt` : "Yanıt süresi bilinmiyor"}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 flex items-center justify-between bg-card border-b border-border">
          <div className="flex items-center">
            {isPerformerOnline(performer.lastActive) ? (
              <>
                <div className="bg-green-500 w-2 h-2 rounded-full mr-2"></div>
                <span className="text-foreground font-medium">Şu anda çevrimiçi</span>
              </>
            ) : (
              <>
                <div className="bg-muted w-2 h-2 rounded-full mr-2"></div>
                <span className="text-foreground font-medium">
                  {formatActivityStatus(performer.lastActive)}
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center">
            <span className="material-icons text-[#FFD700] text-sm mr-1">monetization_on</span>
            <span className="text-[#FFD700] font-medium">{performer.messagePrice || 35} coin/msg</span>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-bold text-foreground mb-2">Hakkımda</h3>
          <p className="text-muted-foreground mb-4">
            {performer.bio || "Bu kullanıcı henüz bir hakkında bilgisi eklememiş."}
          </p>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-card rounded-lg p-2.5 text-center">
              <p className="text-muted-foreground text-xs mb-1">Mesaj</p>
              <p className="text-foreground font-medium">-</p>
            </div>
            <div className="bg-card rounded-lg p-2.5 text-center">
              <p className="text-muted-foreground text-xs mb-1">Beğeni</p>
              <p className="text-foreground font-medium">-</p>
            </div>
            <div className="bg-card rounded-lg p-2.5 text-center">
              <p className="text-muted-foreground text-xs mb-1">Favori</p>
              <p className="text-foreground font-medium">-</p>
            </div>
          </div>
          
          {performer.interests && performer.interests.length > 0 && (
            <>
              <h3 className="text-lg font-bold text-foreground mb-2">İlgi Alanları</h3>
              <div className="flex flex-wrap gap-2 mb-8">
                {performer.interests.map((interest, index) => (
                  <span key={index} className="px-3 py-1.5 bg-card text-muted-foreground rounded-full text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t border-border bg-card flex items-center justify-between">
        <button 
          className={`w-12 h-12 rounded-full border ${isFavorited ? 'border-red-500' : 'border-border'} flex items-center justify-center`}
          onClick={toggleFavorite}
        >
          <span className={`material-icons ${isFavorited ? 'text-red-500' : 'text-muted-foreground'}`}>
            {isFavorited ? 'favorite' : 'favorite_border'}
          </span>
        </button>
        
        <button 
          className="flex-1 ml-3 py-3 bg-primary text-white rounded-full font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          onClick={handleStartConversation}
          disabled={createConversationMutation.isPending}
        >
          {createConversationMutation.isPending ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              İşleniyor...
            </span>
          ) : (
            `Mesaj Gönder (${performer.messagePrice || 35} coin)`
          )}
        </button>
      </div>
    </div>
  );
}
