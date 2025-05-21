import { useUser } from '@/contexts/UserContext';
import { EarningsChart } from '../components/EarningsChart';
import { BadgeStatus } from '../components/BadgeStatus';

export function StatsPage() {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">İstatistikler</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <EarningsChart userId={user.id} />
        <BadgeStatus userId={user.id} />
      </div>
    </div>
  );
} 