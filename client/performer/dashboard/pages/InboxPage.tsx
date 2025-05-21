import { useUser } from '@/contexts/UserContext';
import { InboxPanel } from '../components/InboxPanel';

export function InboxPage() {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Gelen Mesajlar</h1>
      <InboxPanel userId={user.id} />
    </div>
  );
} 