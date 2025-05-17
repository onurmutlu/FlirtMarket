import { useState, useEffect } from 'react';

interface TabNavigationProps {
  currentTab: 'explore' | 'messages' | 'profile' | 'earnings';
  onSwitchTab: (tab: 'explore' | 'messages' | 'profile' | 'earnings') => void;
  showEarnings?: boolean;
}

export default function TabNavigation({ 
  currentTab, 
  onSwitchTab,
  showEarnings = false 
}: TabNavigationProps) {
  const [indicatorPosition, setIndicatorPosition] = useState(0);
  
  // Update indicator position whenever currentTab changes
  useEffect(() => {
    const tabIndex = ['explore', 'messages', 'profile', 'earnings'].indexOf(currentTab);
    const width = showEarnings ? 25 : 33.33;
    setIndicatorPosition(tabIndex * width);
  }, [currentTab, showEarnings]);
  
  return (
    <div className="bg-card border-b border-border relative">
      <div className="flex text-center text-sm font-medium">
        <button 
          className={`flex-1 py-3 menu-item flex flex-col items-center ${currentTab === 'explore' ? 'active' : 'text-muted-foreground'}`}
          onClick={() => onSwitchTab('explore')}
        >
          <span className="material-icons text-base mb-1">explore</span>
          <span className="block">Keşfet</span>
        </button>
        
        <button 
          className={`flex-1 py-3 menu-item flex flex-col items-center ${currentTab === 'messages' ? 'active' : 'text-muted-foreground'}`}
          onClick={() => onSwitchTab('messages')}
        >
          <span className="material-icons text-base mb-1">chat</span>
          <span className="block">Mesajlar</span>
        </button>
        
        <button 
          className={`flex-1 py-3 menu-item flex flex-col items-center ${currentTab === 'profile' ? 'active' : 'text-muted-foreground'}`}
          onClick={() => onSwitchTab('profile')}
        >
          <span className="material-icons text-base mb-1">person</span>
          <span className="block">Profil</span>
        </button>
        
        {showEarnings && (
          <button 
            className={`flex-1 py-3 menu-item flex flex-col items-center ${currentTab === 'earnings' ? 'active' : 'text-muted-foreground'}`}
            onClick={() => onSwitchTab('earnings')}
          >
            <span className="material-icons text-base mb-1">payments</span>
            <span className="block">Kazanç</span>
          </button>
        )}
      </div>
      <div 
        className="tab-indicator absolute bottom-0 h-0.5 bg-primary" 
        style={{ 
          left: `${indicatorPosition}%`,
          width: showEarnings ? '25%' : '33.33%'
        }}
      ></div>
    </div>
  );
}
