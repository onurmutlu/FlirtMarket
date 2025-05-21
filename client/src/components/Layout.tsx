import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import TabNavigation from '@/components/TabNavigation';
import CoinPurchaseModal from '@/components/CoinPurchaseModal';
import { useUser } from '@/contexts/UserContext';

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [showCoinPurchaseModal, setShowCoinPurchaseModal] = useState(false);
  const { user } = useUser();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header 
        onCoinPurchase={() => setShowCoinPurchaseModal(true)} 
        user={user || undefined}
      />
      
      <main className="flex-1 overflow-auto">
        {children || <Outlet />}
      </main>

      <TabNavigation className="sticky bottom-0 z-10 border-t" />
      
      {showCoinPurchaseModal && (
        <CoinPurchaseModal onClose={() => setShowCoinPurchaseModal(false)} />
      )}
    </div>
  );
} 