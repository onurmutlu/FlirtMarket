import { useUser } from '@/contexts/UserContext';
import { ReferralStats } from '../components/ReferralStats';

export function ReferralsPage() {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Referans Programı</h1>
      <ReferralStats userId={user.id} />
    </div>
  );
} 