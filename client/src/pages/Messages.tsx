import { useQuery } from '@tanstack/react-query';
import { Conversation } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface MessagesProps {
  onOpenConversation: (conversationId: number) => void;
}

export default function Messages({ onOpenConversation }: MessagesProps) {
  // Fetch conversations
  const { data: conversations, isLoading, error } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      return response.json();
    }
  });
  
  // Handle conversation click
  const handleConversationClick = (conversationId: number) => {
    onOpenConversation(conversationId);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Mesajlar</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-3 border-b border-border flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-muted animate-pulse"></div>
              <div className="flex-1">
                <div className="w-1/3 h-4 bg-muted animate-pulse mb-2 rounded"></div>
                <div className="w-2/3 h-3 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Mesajlar</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <span className="material-icons text-4xl text-muted-foreground mb-3">error_outline</span>
            <p className="text-foreground font-medium mb-2">Mesajlar yüklenemedi</p>
            <p className="text-sm text-muted-foreground">Lütfen daha sonra tekrar deneyin</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render empty state
  if (!conversations || conversations.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Mesajlar</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 h-full text-center">
          <span className="material-icons text-5xl text-muted-foreground mb-3">chat_bubble_outline</span>
          <h3 className="text-lg font-medium text-muted-foreground mb-1">Mesaj kutun boş</h3>
          <p className="text-sm text-muted-foreground mb-4">Şovcularla mesajlaşmaya başla</p>
          <button className="px-6 py-2 bg-primary text-white rounded-full font-medium">
            Keşfet
          </button>
        </div>
      </div>
    );
  }
  
  // Render conversations
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">Mesajlar</h2>
      </div>
      
      <div className="overflow-y-auto flex-1">
        {conversations.map((conversation) => (
          <div 
            key={conversation.id} 
            className="p-3 border-b border-border flex items-center space-x-3 hover:bg-card/80 transition-colors cursor-pointer"
            onClick={() => handleConversationClick(conversation.id)}
          >
            <div className="relative">
              <img 
                src={conversation.otherUser?.profilePhoto || `https://ui-avatars.com/api/?name=${conversation.otherUser?.firstName || 'User'}&background=random&color=fff&size=60`} 
                alt={conversation.otherUser?.firstName || 'User'} 
                className="w-12 h-12 rounded-full object-cover"
              />
              
              {/* Online indicator */}
              {isUserActive(conversation.otherUser?.lastActive) && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-center mb-0.5">
                <h3 className="font-medium text-foreground">
                  {conversation.otherUser?.firstName} {conversation.otherUser?.lastName?.charAt(0) || ""}
                  {conversation.otherUser?.lastName ? "." : ""}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {formatMessageTime(conversation.lastMessageAt)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground truncate pr-4">
                  {conversation.lastMessage?.content || "Yeni bir sohbet başlat..."}
                </p>
                
                {/* Unread indicator */}
                {(conversation.unreadCount || 0) > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 bg-primary rounded-full text-white text-xs flex items-center justify-center">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper to format message time
function formatMessageTime(date: Date | string): string {
  const messageDate = typeof date === 'string' ? new Date(date) : date;
  
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'Şimdi';
  }
  
  if (diffMinutes < 60) {
    return `${diffMinutes} dk`;
  }
  
  if (diffMinutes < 24 * 60) {
    return formatDistanceToNow(messageDate, { locale: tr, addSuffix: false });
  }
  
  if (diffMinutes < 7 * 24 * 60) {
    return formatDistanceToNow(messageDate, { locale: tr, addSuffix: false });
  }
  
  // Format date for older messages
  const day = messageDate.getDate();
  const month = messageDate.getMonth() + 1;
  return `${day < 10 ? '0' + day : day}.${month < 10 ? '0' + month : month}`;
}

// Helper to check if user is active (online)
function isUserActive(lastActive?: Date): boolean {
  if (!lastActive) return false;
  
  // Convert to date object if it's a string
  const lastActiveDate = typeof lastActive === 'string' 
    ? new Date(lastActive) 
    : lastActive;
  
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60));
  
  return diffMinutes < 5;
}
