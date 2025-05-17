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
    <header className="relative z-10 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
          {user.profilePhoto ? (
            <img 
              src={user.profilePhoto} 
              alt={`${user.firstName}'s avatar`} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary text-secondary-foreground">
              {user.firstName.charAt(0)}
            </div>
          )}
        </div>
        <div className="text-sm">
          <p className="font-medium text-foreground">
            {user.firstName} {user.lastName?.charAt(0) || ""}
            {user.lastName ? "." : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {getUserStatus(user.lastActive)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center px-3 py-1 rounded-full bg-card border border-border">
        <span className="material-icons text-[#FFD700] text-sm mr-1 coin-icon">
          monetization_on
        </span>
        <span className="text-[#FFD700] font-medium">
          {user.coins || 0}
        </span>
        <button 
          className="ml-2 text-xs px-2 py-1 bg-primary rounded-full text-white font-medium"
          onClick={onCoinPurchase}
        >
          +
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
