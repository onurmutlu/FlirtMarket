import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUser } from '../../../src/contexts/UserContext';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';

export function DashboardLayout() {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || user.type !== 'performer')) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobil Navigasyon */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <MobileNav />
      </div>

      <div className="flex h-screen">
        {/* Masaüstü Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Ana İçerik */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 pb-20 lg:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
} 