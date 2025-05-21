import { useUser } from '@/contexts/UserContext';
import { MissionBox } from '../components/MissionBox';

export function MissionsPage() {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Günlük Görevler</h1>
      <MissionBox userId={user.id} />
    </div>
  );
} 