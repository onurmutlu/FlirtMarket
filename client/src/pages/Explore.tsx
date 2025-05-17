import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PerformerCard from '@/components/PerformerCard';
import { User } from '@/types';

interface ExploreProps {
  onViewProfile: (performerId: number) => void;
}

type CategoryType = 'all' | 'new' | 'trending' | 'online' | 'premium';

export default function Explore({ onViewProfile }: ExploreProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  
  // Fetch performers
  const { data: performers, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/performers', searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/performers?q=${encodeURIComponent(searchQuery)}` 
        : '/api/performers';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch performers');
      }
      
      return response.json();
    }
  });
  
  // Filter performers based on selected category
  const filteredPerformers = performers ? filterPerformers(performers, activeCategory) : [];
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <div className="p-3 h-full">
      {/* Search and Filter Bar */}
      <div className="mb-4 flex items-center">
        <div className="relative flex-1">
          <span className="material-icons absolute left-3 top-2.5 text-muted-foreground text-lg">search</span>
          <input 
            type="text" 
            placeholder="Şovcu ara..." 
            className="w-full bg-card border border-border rounded-full pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <button className="ml-2 p-2 bg-card rounded-full border border-border">
          <span className="material-icons text-muted-foreground">tune</span>
        </button>
      </div>
      
      {/* Performer Categories */}
      <div className="mb-4 overflow-x-auto whitespace-nowrap py-2 hide-scrollbar">
        <CategoryButton 
          label="Tümü" 
          active={activeCategory === 'all'} 
          onClick={() => setActiveCategory('all')} 
        />
        <CategoryButton 
          label="Yeni" 
          active={activeCategory === 'new'} 
          onClick={() => setActiveCategory('new')} 
        />
        <CategoryButton 
          label="Trend" 
          active={activeCategory === 'trending'} 
          onClick={() => setActiveCategory('trending')} 
        />
        <CategoryButton 
          label="Online" 
          active={activeCategory === 'online'} 
          onClick={() => setActiveCategory('online')} 
        />
        <CategoryButton 
          label="Premium" 
          active={activeCategory === 'premium'} 
          onClick={() => setActiveCategory('premium')} 
        />
      </div>
      
      {/* Performer Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg h-72 animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <span className="material-icons text-4xl text-muted-foreground mb-3">error_outline</span>
          <p className="text-foreground font-medium mb-2">Şovcular yüklenemedi</p>
          <p className="text-sm text-muted-foreground">Lütfen daha sonra tekrar deneyin</p>
        </div>
      ) : filteredPerformers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <span className="material-icons text-4xl text-muted-foreground mb-3">search_off</span>
          <p className="text-foreground font-medium mb-2">Şovcu bulunamadı</p>
          <p className="text-sm text-muted-foreground">Lütfen farklı bir arama terimi deneyin veya filtrelerinizi değiştirin</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredPerformers.map((performer) => (
            <PerformerCard
              key={performer.id}
              performer={performer}
              onClick={onViewProfile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function CategoryButton({ label, active, onClick }: CategoryButtonProps) {
  return (
    <button 
      className={`mr-2 px-4 py-1.5 rounded-full text-sm font-medium ${
        active 
          ? 'bg-primary text-white' 
          : 'bg-card text-muted-foreground'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function filterPerformers(performers: User[], category: CategoryType): User[] {
  switch (category) {
    case 'new':
      return performers.filter(performer => {
        const createdAt = new Date(performer.createdAt);
        const daysSinceCreation = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCreation < 7; // Less than 7 days old
      });
    
    case 'trending':
      // Sort by rating for trending
      return [...performers].sort((a, b) => b.rating - a.rating);
    
    case 'online':
      return performers.filter(performer => {
        const lastActive = new Date(performer.lastActive);
        const minutesSinceActive = Math.floor((new Date().getTime() - lastActive.getTime()) / (1000 * 60));
        return minutesSinceActive < 5; // Active in the last 5 minutes
      });
    
    case 'premium':
      return performers.filter(performer => performer.rating >= 4.8);
    
    case 'all':
    default:
      return performers;
  }
}
