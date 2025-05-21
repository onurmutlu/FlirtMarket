import { Outlet } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

export default function PerformerDashboard() {
  const { user } = useUser();

  if (!user || user.type !== 'performer') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Outlet />
    </div>
  );
} 