import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { apiRequest } from "@/lib/queryClient";
import { Message, Conversation, User } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useConversation(conversationId: number) {
  const { user, spendCoins } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get conversation details
  const {
    data: conversationData,
    isLoading: isConversationLoading,
    error: conversationError
  } = useQuery<{ conversation: Conversation; otherUser: User }>({
    queryKey: [`/api/conversations/${conversationId}`],
    queryFn: async () => {
      // First get all conversations
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const conversations = await response.json();
      const conversation = conversations.find((c: Conversation) => c.id === conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      return {
        conversation,
        otherUser: conversation.otherUser
      };
    }
  });
  
  // Get messages
  const {
    data: messages,
    isLoading: isMessagesLoading,
    error: messagesError,
    refetch: refetchMessages
  } = useQuery<Message[]>({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      return response.json();
    }
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, {
        content
      });
      
      if (!response.ok) {
        // Check if it's a coin issue
        const errorData = await response.json();
        if (errorData.message === "Insufficient coins") {
          throw new Error(`Yetersiz coin. Bu mesaj için ${errorData.required} coin gerekiyor.`);
        }
        throw new Error('Message could not be sent');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update messages list
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
      
      // If regular user, update coin count in context (already updated in DB by backend)
      if (user?.type === 'regular' && data.updatedCoins !== undefined) {
        // The coin balance is already updated in backend and will be reflected in the user context
        // We don't need to manually update it here
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Mesaj gönderilemedi",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Send message
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    try {
      await sendMessageMutation.mutateAsync(content);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  return {
    conversation: conversationData?.conversation,
    otherUser: conversationData?.otherUser,
    messages,
    isLoading: isConversationLoading || isMessagesLoading,
    error: conversationError || messagesError,
    sendMessage,
    isSending: sendMessageMutation.isPending,
    refetchMessages
  };
}
