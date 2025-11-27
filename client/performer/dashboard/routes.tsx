import { createBrowserRouter } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import { InboxPage } from './pages/InboxPage';
import { StatsPage } from './pages/StatsPage';
import { MissionsPage } from './pages/MissionsPage';
import { ReferralsPage } from './pages/ReferralsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MonetizationPage } from './pages/MonetizationPage';

export const performerRoutes = createBrowserRouter([
  {
    path: '/performer',
    element: <DashboardLayout />,
    children: [
      {
        path: '',
        element: <Dashboard />,
      },
      {
        path: 'inbox',
        element: <InboxPage />,
      },
      {
        path: 'stats',
        element: <StatsPage />,
      },
      {
        path: 'missions',
        element: <MissionsPage />,
      },
      {
        path: 'referrals',
        element: <ReferralsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'monetization',
        element: <MonetizationPage />,
      },
    ],
  },
]); 