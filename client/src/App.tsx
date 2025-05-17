import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import TabNavigation from "@/components/TabNavigation";
import CoinPurchaseModal from "@/components/CoinPurchaseModal";
import Explore from "@/pages/Explore";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Earnings from "@/pages/Earnings";
import PerformerProfile from "@/pages/PerformerProfile";
import Conversation from "@/pages/Conversation";
import { useUser } from "@/contexts/UserContext";
import { USER_TYPES } from "@shared/schema";
import { AppState } from "./types";

function App() {
  // Simplify the App by temporarily removing useUser
  // We'll add it back once we've fixed the UserContext
  const [user, setUser] = useState<any>({
    id: 1,
    telegramId: "123456789",
    firstName: "Test",
    lastName: "User",
    type: 'regular',
    coins: 100,
    profilePhoto: "https://via.placeholder.com/100",
    bio: "Test bio",
    location: "Test City",
    interests: ["Music", "Sports", "Travel"],
    age: 25,
    rating: 4.5,
    referralCode: "TEST123",
    createdAt: new Date(),
    lastActive: new Date()
  });
  const isLoading = false;
  const [appState, setAppState] = useState<AppState>({
    currentTab: 'explore',
    showCoinPurchaseModal: false,
    showPerformerProfile: false,
    showConversation: false,
  });

  // Handle tab switching
  const switchTab = (tab: 'explore' | 'messages' | 'profile' | 'earnings') => {
    setAppState({
      ...appState,
      currentTab: tab,
      showPerformerProfile: false,
      showConversation: false
    });
  };

  // Handle coin purchase modal
  const toggleCoinPurchaseModal = () => {
    setAppState({
      ...appState,
      showCoinPurchaseModal: !appState.showCoinPurchaseModal
    });
  };

  // Show performer profile
  const showPerformer = (performerId: number) => {
    setAppState({
      ...appState,
      showPerformerProfile: true,
      activePerformerId: performerId,
      showConversation: false
    });
  };

  // Go back to explore tab
  const backToExplore = () => {
    setAppState({
      ...appState,
      showPerformerProfile: false,
      activePerformerId: undefined
    });
  };

  // Show conversation
  const showConversation = (conversationId: number) => {
    setAppState({
      ...appState,
      showConversation: true,
      activeConversationId: conversationId,
      showPerformerProfile: false
    });
  };

  // Back to messages tab
  const backToMessages = () => {
    setAppState({
      ...appState,
      showConversation: false,
      activeConversationId: undefined
    });
  };

  // Start conversation with performer
  const startConversation = (performerId: number) => {
    // API call to create conversation will be handled in the component
    // For now just navigate to messages and show conversation
    setAppState({
      ...appState,
      currentTab: 'messages',
      showPerformerProfile: false,
      activePerformerId: undefined
    });
  };

  // Conditionally render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
        <Header 
          onCoinPurchase={toggleCoinPurchaseModal} 
        />
        
        <main className="flex-1 overflow-hidden relative">
          <TabNavigation 
            currentTab={appState.currentTab} 
            onSwitchTab={switchTab} 
            showEarnings={user?.type === USER_TYPES.PERFORMER}
          />

          <div className="tab-content h-full overflow-auto">
            {/* Conditionally render content based on current state */}
            {!appState.showPerformerProfile && !appState.showConversation && appState.currentTab === 'explore' && (
              <Explore onViewProfile={showPerformer} />
            )}
            
            {!appState.showPerformerProfile && !appState.showConversation && appState.currentTab === 'messages' && (
              <Messages onOpenConversation={showConversation} />
            )}
            
            {!appState.showPerformerProfile && !appState.showConversation && appState.currentTab === 'profile' && (
              <Profile />
            )}
            
            {!appState.showPerformerProfile && !appState.showConversation && appState.currentTab === 'earnings' && user?.type === USER_TYPES.PERFORMER && (
              <Earnings />
            )}
            
            {appState.showPerformerProfile && appState.activePerformerId && (
              <PerformerProfile 
                performerId={appState.activePerformerId} 
                onBack={backToExplore} 
                onStartConversation={startConversation}
              />
            )}
            
            {appState.showConversation && appState.activeConversationId && (
              <Conversation 
                conversationId={appState.activeConversationId} 
                onBack={backToMessages}
              />
            )}
          </div>
        </main>
        
        {appState.showCoinPurchaseModal && (
          <CoinPurchaseModal onClose={toggleCoinPurchaseModal} />
        )}
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
