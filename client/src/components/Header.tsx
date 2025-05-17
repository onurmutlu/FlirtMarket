import { useUser } from "@/contexts/UserContext";

interface HeaderProps {
  onCoinPurchase: () => void;
  // Added user prop so we can pass it directly from App during development
  user?: any;
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFD700" className="w-4 h-4 mr-2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
        </svg>
        <span className="text-[#FFD700] font-bold tracking-wider">
          {user.coins || 0}
        </span>
        <button 
          className="ml-3 text-xs px-3 py-1.5 bg-gradient-to-r from-primary to-secondary rounded-full text-white font-semibold shadow-md hover:shadow-lg transition-all"
          onClick={onCoinPurchase}
        >
          + Buy
        </button>
      </div>
    </header>
  );
}

function getUserStatus(lastActive: Date): string {
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
