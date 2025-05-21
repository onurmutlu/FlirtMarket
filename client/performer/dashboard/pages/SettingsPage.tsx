import { useUser } from '@/contexts/UserContext';
import { SettingsPanel } from '../components/SettingsPanel';

export function SettingsPage() {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ayarlar</h1>
      <SettingsPanel userId={user.id} />
    </div>
  );
} 