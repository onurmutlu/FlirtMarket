import { useState, useEffect, useRef } from "react";
import { useConversation } from "@/hooks/useConversation";
import { Message } from "@/types";
import { useUser } from "@/contexts/UserContext";
import { format } from "date-fns";

interface ConversationProps {
  conversationId: string;
  onBack: () => void;
}

export default function Conversation({ conversationId, onBack }: ConversationProps) {
  const [messageText, setMessageText] = useState("");
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    otherUser,
    messages,
    isLoading,
    error,
    sendMessage,
    isSending
  } = useConversation(conversationId);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Handle send message
  const handleSendMessage = () => {
    if (messageText.trim() === "") return;
    
    sendMessage(messageText);
    setMessageText("");
  };
  
  // Handle message input keypress (send on Enter key)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle textarea auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };
  
  // Check if user is active/online
  const isUserActive = (lastActive?: Date) => {
    if (!lastActive) return false;
    
    const lastActiveDate = typeof lastActive === 'string' 
      ? new Date(lastActive) 
      : lastActive;
    
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60));
    
    return diffMinutes < 5;
  };
  
  // Group messages by day
  const groupMessagesByDay = (messages: Message[]) => {
    if (!messages || messages.length === 0) return [];
    
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    let currentGroup: Message[] = [];
    
    messages.forEach(message => {
      const messageDate = new Date(message.createdAt);
      const dateStr = format(messageDate, 'yyyy-MM-dd');
      
      if (dateStr !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: [...currentGroup] });
        }
        currentDate = dateStr;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }
    
    return groups;
  };
  
  // Format date for display
  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Bugün";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Dün";
    } else {
      return format(date, 'dd.MM.yyyy');
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-card border-b border-border p-3 flex items-center">
          <button className="mr-3" onClick={onBack}>
            <span className="material-icons text-muted-foreground">arrow_back</span>
          </button>
          <div className="flex-1">
            <div className="h-5 bg-muted rounded w-32 animate-pulse"></div>
            <div className="h-3 bg-muted rounded w-20 mt-1 animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className={`h-12 rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-primary/30 w-3/4' : 'bg-card w-1/2'}`}></div>
            </div>
          ))}
        </div>
        
        <div className="p-3 border-t border-border bg-card">
          <div className="flex items-end">
            <div className="flex-1 bg-background rounded-2xl px-4 py-3 h-12 animate-pulse"></div>
            <div className="ml-2 w-12 h-12 bg-primary/30 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !otherUser) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-card border-b border-border p-3 flex items-center">
          <button className="mr-3" onClick={onBack}>
            <span className="material-icons text-muted-foreground">arrow_back</span>
          </button>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Hata</h3>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <span className="material-icons text-5xl text-muted-foreground mb-3">error_outline</span>
          <h3 className="text-lg font-bold text-foreground mb-2">Mesajlar yüklenemedi</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Mesajlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
          </p>
          <button 
            className="px-6 py-2 bg-primary text-white rounded-full font-medium"
            onClick={onBack}
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }
  
  const messagePrice = otherUser.messagePrice || 35;
  const messageGroups = groupMessagesByDay(messages || []);
  
  return (
    <div className="h-full flex flex-col">
      <div className="bg-card border-b border-border p-3 flex items-center">
        <button className="mr-3" onClick={onBack}>
          <span className="material-icons text-muted-foreground">arrow_back</span>
        </button>
        
        <div className="flex items-center flex-1">
          <img 
            src={otherUser.profilePhoto || `https://ui-avatars.com/api/?name=${otherUser.firstName}&background=random&color=fff&size=60`}
            alt={otherUser.firstName} 
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
          
          <div>
            <h3 className="font-medium text-foreground">
              {otherUser.firstName} {otherUser.lastName?.charAt(0) || ""}
              {otherUser.lastName ? "." : ""}
            </h3>
            
            <div className="flex items-center">
              {isUserActive(otherUser.lastActive ? new Date(otherUser.lastActive) : undefined) ? (
                <span className="text-xs text-green-500">Online</span>
              ) : (
                <span className="text-xs text-muted-foreground">Son görülme: {formatLastSeen(otherUser.lastActive ? new Date(otherUser.lastActive) : undefined)}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <span className="material-icons text-[#FFD700] text-sm mr-1">monetization_on</span>
          <span className="text-[#FFD700] font-medium text-sm">{messagePrice}/msg</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background" id="message-container">
        {/* System message for pricing */}
        <div className="flex justify-center">
          <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-1.5 rounded-full max-w-xs text-center">
            Her mesaj gönderimi {messagePrice} coin'dir. Keyifli sohbetler!
          </div>
        </div>
        
        {/* Messages grouped by day */}
        {messageGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-4">
            {/* Date separator */}
            <div className="flex justify-center">
              <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-1.5 rounded-full">
                {formatMessageDate(group.date)}
              </div>
            </div>
            
            {/* Messages */}
            {group.messages.map((message) => {
              const isOutgoing = message.senderId === user?.id;
              const messageTime = format(new Date(message.createdAt), 'HH:mm');
              
              return (
                <div key={message.id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                  <div className={`message-bubble ${
                    isOutgoing 
                      ? 'bg-primary text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-card text-foreground rounded-2xl rounded-tl-sm'
                  } p-3`}>
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-end mt-1 space-x-1">
                      <span className={isOutgoing ? 'text-white/70 text-xs' : 'text-muted-foreground text-xs'}>
                        {messageTime}
                      </span>
                      {isOutgoing && (
                        <span className="material-icons text-white/70 text-xs">
                          {message.read ? 'done_all' : 'done'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef}></div>
      </div>
      
      <div className="p-3 border-t border-border bg-card">
        <div className="flex items-end">
          <div className="flex-1 bg-background rounded-2xl px-4 py-3">
            <textarea 
              placeholder="Mesajınızı yazın..." 
              className="w-full bg-transparent text-foreground resize-none outline-none text-sm max-h-32"
              rows={1}
              value={messageText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyPress}
              disabled={isSending}
            ></textarea>
          </div>
          
          <button 
            className="ml-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleSendMessage}
            disabled={messageText.trim() === "" || isSending}
          >
            {isSending ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span className="material-icons text-white">send</span>
            )}
          </button>
        </div>
        
        <div className="mt-2 flex justify-between items-center px-1">
          <div className="flex items-center text-muted-foreground text-xs">
            <span className="material-icons text-xs mr-1">timer</span>
            <span>Ortalama yanıt süresi: {otherUser.responseTime || '?'} dk</span>
          </div>
          <div className="flex items-center">
            <span className="material-icons text-[#FFD700] text-sm mr-1">monetization_on</span>
            <span className="text-[#FFD700] text-xs font-medium">{messagePrice} coin/mesaj</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to format last seen time
function formatLastSeen(lastActive?: Date): string {
  if (!lastActive) return "Bilinmiyor";
  
  const lastActiveDate = typeof lastActive === 'string' 
    ? new Date(lastActive) 
    : lastActive;
  
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `${diffMinutes} dk önce`;
  } else if (diffMinutes < 24 * 60) {
    return `${Math.floor(diffMinutes / 60)} saat önce`;
  } else {
    return `${Math.floor(diffMinutes / (24 * 60))} gün önce`;
  }
}
