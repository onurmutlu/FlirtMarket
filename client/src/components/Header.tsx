import { useUser } from "@/contexts/UserContext";
import { Coins, Plus } from "lucide-react";
import { User } from "@/types";

interface HeaderProps {
  onCoinPurchase: () => void;
  // Added user prop so we can pass it directly from App during development
  user?: User;
}

export default function Header({ onCoinPurchase, user: userProp }: HeaderProps) {
  // Try to use the provided user prop first, otherwise fall back to useUser
  let userData;
  let userError = null;
  
  try {
    const userContext = useUser();
    userData = userProp || userContext.user;
  } catch (error) {
    userData = userProp;
    userError = error;
  }
  
  const user = userData;
  
  if (!user) return null;
  
  return (
    <header className="relative z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1a1a1a] to-[#252525] border-b border-border shadow-md">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary overflow-hidden flex-shrink-0 ring-2 ring-primary/30 shadow-lg">
          {user.profilePhoto ? (
            <img 
              src={user.profilePhoto} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-primary text-white font-bold">
              {user.firstName?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-white tracking-tight">
            {user.firstName || "User"}
            {user.lastName ? ` ${user.lastName.charAt(0)}.` : ""}
          </p>
          <p className="text-xs font-medium text-primary/80">
            {getUserStatus(user.lastActive) || "Online now"}
          </p>
        </div>
      </div>
      
      <div className="flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#2d2d2d] to-[#353535] border border-border/50 shadow-inner">
        <Coins className="w-4 h-4 mr-2 text-[#FFD700]" />
        <span className="text-[#FFD700] font-bold tracking-wider">
          {user.coins || 0}
        </span>
        <button 
          className="ml-3 text-xs px-3 py-1.5 bg-gradient-to-r from-primary to-secondary rounded-full text-white font-semibold shadow-md hover:shadow-lg transition-all flex items-center"
          onClick={onCoinPurchase}
        >
          <Plus className="w-3 h-3 mr-1" /> Buy
        </button>
      </div>
    </header>
  );
}

function getUserStatus(lastActive?: string | Date): string {
  if (!lastActive) return "Online";
  
  // Convert to date object if it's a string
  const lastActiveDate = typeof lastActive === 'string' 
    ? new Date(lastActive) 
    : lastActive;
  
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60));
  
  if (diffMinutes < 5) {
    return 'Online';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffMinutes < 24 * 60) {
    return `${Math.floor(diffMinutes / 60)}h ago`;
  } else {
    return `${Math.floor(diffMinutes / (60 * 24))}d ago`;
  }
}
