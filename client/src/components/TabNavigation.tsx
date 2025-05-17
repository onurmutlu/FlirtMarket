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
    <div className="bg-gradient-to-r from-[#1a1a1a] to-[#252525] border-b border-border/30 relative shadow-sm">
      <div className="flex text-center text-sm font-medium">
        <button 
          className={`flex-1 py-3 menu-item flex flex-col items-center transition-all duration-200 ${
            currentTab === 'explore' 
              ? 'text-primary font-semibold' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => onSwitchTab('explore')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mb-1">
            <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <span className="block">Keşfet</span>
        </button>
        
        <button 
          className={`flex-1 py-3 menu-item flex flex-col items-center transition-all duration-200 ${
            currentTab === 'messages' 
              ? 'text-primary font-semibold' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => onSwitchTab('messages')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mb-1">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
          <span className="block">Mesajlar</span>
        </button>
        
        <button 
          className={`flex-1 py-3 menu-item flex flex-col items-center transition-all duration-200 ${
            currentTab === 'profile' 
              ? 'text-primary font-semibold' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => onSwitchTab('profile')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mb-1">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span className="block">Profil</span>
        </button>
        
        {showEarnings && (
          <button 
            className={`flex-1 py-3 menu-item flex flex-col items-center transition-all duration-200 ${
              currentTab === 'earnings' 
                ? 'text-primary font-semibold' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => onSwitchTab('earnings')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mb-1">
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
            </svg>
            <span className="block">Kazanç</span>
          </button>
        )}
      </div>
      
      <div 
        className="absolute bottom-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-t-full transition-all duration-300 ease-in-out"
        style={{ 
          left: `${indicatorPosition}%`, 
          width: showEarnings ? '25%' : '33.33%',
          opacity: 0.9,
          boxShadow: '0 -2px 8px rgba(255, 0, 128, 0.5)'
        }}
      />
    </div>
  );
}
