import { User } from '@/types';

interface PerformerCardProps {
  performer: User;
  onClick: (performerId: number) => void;
}

export default function PerformerCard({ performer, onClick }: PerformerCardProps) {
  const handleClick = () => {
    onClick(performer.id);
  };

  // Format response time
  const formatResponseTime = (minutes?: number | null) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes} dk`;
    return `${Math.floor(minutes / 60)} saat`;
  };

  return (
    <div 
      className="profile-card bg-card rounded-lg overflow-hidden shadow-lg transition-transform"
      onClick={handleClick}
    >
      <div className="relative">
        <img 
          src={performer.profilePhoto || `https://ui-avatars.com/api/?name=${performer.firstName}&background=random&color=fff&size=400`} 
          alt={`${performer.firstName}'s profile`} 
          className="w-full h-48 object-cover"
        />
        
        {/* Online status or badge */}
        {isUserActive(performer.lastActive) ? (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full mr-1"></span>
            Online
          </div>
        ) : performer.rating >= 4.8 ? (
          <div className="absolute top-2 right-2 bg-secondary text-white text-xs px-2 py-0.5 rounded-full flex items-center">
            Premium
          </div>
        ) : isNewUser(performer.createdAt) ? (
          <div className="absolute top-2 right-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
            Yeni
          </div>
        ) : null}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <div className="flex justify-between items-center">
            <span className="text-white font-bold text-sm">
              {performer.firstName} {performer.lastName?.charAt(0) || ""}{performer.lastName ? "." : ""}, {performer.age || "?"}
            </span>
            <div className="flex items-center bg-black/40 rounded-full px-2 py-0.5">
              <span className="material-icons text-yellow-400 text-xs mr-0.5">star</span>
              <span className="text-white text-xs">{performer.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-2">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <span className="material-icons text-[#FFD700] text-sm mr-1">monetization_on</span>
            <span className="text-[#FFD700] text-xs font-medium">{performer.messagePrice || 35} coin/msg</span>
          </div>
          <div className="flex items-center">
            <span className="material-icons text-muted-foreground text-sm mr-1">chat_bubble</span>
            <span className="text-muted-foreground text-xs">
              {formatResponseTime(performer.responseTime)}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {performer.bio || (performer.interests && performer.interests.length > 0
            ? `${performer.interests.slice(0, 3).join(', ')} ${performer.interests.length > 3 ? '...' : ''}`
            : `${performer.firstName} ile sohbet et`)}
        </p>
      </div>
    </div>
  );
}

// Helper function to check if user is active (online)
function isUserActive(lastActive: Date): boolean {
  // Convert to date object if it's a string
  const lastActiveDate = typeof lastActive === 'string' 
    ? new Date(lastActive) 
    : lastActive;
  
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60));
  
  return diffMinutes < 5;
}

// Helper function to check if user is new (less than 3 days)
function isNewUser(createdAt: Date): boolean {
  // Convert to date object if it's a string
  const createdAtDate = typeof createdAt === 'string' 
    ? new Date(createdAt) 
    : createdAt;
  
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return diffDays < 3;
}
