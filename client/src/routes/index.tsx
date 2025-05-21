import { createBrowserRouter, Navigate, Outlet, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import Conversation from "@/pages/Conversation";
import Explore from "@/pages/Explore";
import Earnings from "@/pages/Earnings";
import Login from "@/pages/Login";
import ErrorBoundary from "@/components/ErrorBoundary";
import AdminDashboard from "@/pages/Admin/Dashboard";
import PerformerDashboard from "../../performer/dashboard/pages/Dashboard";
import { SettingsPage } from "../../performer/dashboard/pages/SettingsPage";
import { MissionsPage } from "../../performer/dashboard/pages/MissionsPage";
import { ReferralsPage } from "../../performer/dashboard/pages/ReferralsPage";
import { InboxPage } from "../../performer/dashboard/pages/InboxPage";
import AdminLogin from "@/pages/Admin/Login";
import { lazy, Suspense } from "react";
import NotFound from "@/pages/NotFound";

// Tip kontrolleri
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const hasToken = !!localStorage.getItem('auth_token');
  
  // Yükleme durumunda bekle
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
  }
  
  // Kullanıcı ve token yoksa login'e yönlendir
  if (!user || !hasToken) {
    // Tüm oturum verilerini temizle
    localStorage.removeItem('auth_token');
    localStorage.removeItem('lastFreeSpin');
    localStorage.removeItem('admin_token');
    sessionStorage.clear();
    
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function RequirePerformer({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  
  if (!user || user.type !== "performer") {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const hasAdminToken = !!localStorage.getItem('admin_token');
  
  // If still loading, show loading indicator
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
  }
  
  // Check if user exists, has admin type, and admin token exists
  if (!user || user.type !== "admin" || !hasAdminToken) {
    console.log("Admin access denied:", { user, hasAdminToken });
    // Clear admin token if it exists but user is not admin
    if (hasAdminToken) {
      localStorage.removeItem('admin_token');
    }
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
}

// Admin ana sayfası yönlendirmesi
function AdminRoute() {
  const { user } = useUser();
  
  if (user && user.type === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return <Navigate to="/admin/login" replace />;
}

// Performer ana sayfası yönlendirmesi
function PerformerRoute() {
  const { user } = useUser();
  
  if (user && user.type === 'performer') {
    return <Navigate to="/performer/dashboard" replace />;
  }
  
  return <Navigate to="/login" replace />;
}

// Ana layout
function AppLayout() {
  return (
    <RequireAuth>
      <Layout>
        <Outlet />
      </Layout>
    </RequireAuth>
  );
}

// Route komponentleri
function ExploreWithProps() {
  const navigate = useNavigate();
  return <Explore onViewProfile={(id) => navigate(`/performer/${id}`)} />;
}

function MessagesWithProps() {
  const navigate = useNavigate();
  return <Messages onOpenConversation={(id) => navigate(`/messages/${id}`)} />;
}

function ConversationWithProps() {
  const navigate = useNavigate();
  const { id } = useParams();
  return <Conversation conversationId={id || ""} onBack={() => navigate(-1)} />;
}

function PerformerProfileWithProps() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <PerformerProfile 
        performerId={"1"}
        onBack={() => window.history.back()}
        onStartConversation={() => {}}
      />
    </Suspense>
  );
}

// Lazy loaded components
const PerformerProfile = lazy(() => import("@/pages/PerformerProfile"));
const BuyCoins = lazy(() => import("@/pages/BuyCoins"));
const Transactions = lazy(() => import("@/pages/Transactions"));

// Router'ı bir fonksiyon içinde tanımla
const createAppRouter = () => createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<div>Yükleniyor...</div>}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: "explore",
        element: <ExploreWithProps />,
      },
      {
        path: "messages",
        element: <MessagesWithProps />,
      },
      {
        path: "messages/:id",
        element: <ConversationWithProps />,
      },
      {
        path: "profile",
        element: (
          <Suspense fallback={<div>Yükleniyor...</div>}>
            <Profile />
          </Suspense>
        ),
      },
      {
        path: "buy-coins",
        element: (
          <Suspense fallback={<div>Yükleniyor...</div>}>
            <BuyCoins />
          </Suspense>
        ),
      },
      {
        path: "performer/dashboard",
        element: (
          <RequirePerformer>
            <Suspense fallback={<div>Yükleniyor...</div>}>
              <PerformerDashboard />
            </Suspense>
          </RequirePerformer>
        ),
      },
      {
        path: "performer/profile",
        element: <PerformerProfileWithProps />,
      },
      {
        path: "performer/earnings",
        element: (
          <RequirePerformer>
            <Suspense fallback={<div>Yükleniyor...</div>}>
              <Earnings />
            </Suspense>
          </RequirePerformer>
        ),
      },
      {
        path: "admin/dashboard",
        element: (
          <RequireAdmin>
            <Suspense fallback={<div>Yükleniyor...</div>}>
              <AdminDashboard />
            </Suspense>
          </RequireAdmin>
        ),
      },
      {
        path: "transactions",
        element: (
          <Suspense fallback={<div>Yükleniyor...</div>}>
            <Transactions />
          </Suspense>
        ),
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/admin",
    element: <AdminRoute />,
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },
  {
    path: "/performer",
    element: <PerformerRoute />,
  },
]);

// Sabit bir değişken olarak tanımla
export const router = createAppRouter(); 