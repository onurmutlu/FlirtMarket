import { useUser } from '@/contexts/UserContext';
import { MonetizationPanel } from '../components/MonetizationPanel';

export function MonetizationPage() {
  const { user } = useUser();
  const userId = user?.id || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kazanç Yönetimi</h1>
      <p className="text-muted-foreground">
        Aboneliklerinizi, hediyelerinizi ve para çekme işlemlerinizi bu sayfadan yönetebilirsiniz.
      </p>
      <MonetizationPanel userId={userId} />
    </div>
  );
}
