import { TransactionHistory } from "@/components/ui/transaction-history";

const sampleTransactions = [
  {
    id: "1",
    type: "outgoing" as const,
    amount: 20,
    description: "Mesaj: @AgentZyra",
    date: new Date("2024-05-17T14:30:00"),
  },
  {
    id: "2",
    type: "incoming" as const,
    amount: 50,
    description: "Referans Ödülü: @newuser123",
    date: new Date("2024-05-17T12:15:00"),
  },
  {
    id: "3",
    type: "outgoing" as const,
    amount: 15,
    description: "Mesaj: @StarPerformer",
    date: new Date("2024-05-16T18:45:00"),
  },
  {
    id: "4",
    type: "incoming" as const,
    amount: 100,
    description: "Coin Satın Alma",
    date: new Date("2024-05-16T10:20:00"),
  },
];

export default function TransactionsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-white/90">
          Coin İşlemleri
        </h1>
        
        <TransactionHistory
          transactions={sampleTransactions}
          className="min-h-[calc(100vh-8rem)]"
        />
      </div>
    </div>
  );
} 