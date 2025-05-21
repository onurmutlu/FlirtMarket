import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface TransactionItemProps {
  type: "incoming" | "outgoing";
  amount: number;
  description: string;
  date: Date;
  className?: string;
}

export function TransactionItem({
  type,
  amount,
  description,
  date,
  className,
}: TransactionItemProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-4 rounded-lg p-4",
        "bg-black/20 backdrop-blur-sm backdrop-saturate-150",
        "border border-white/10 hover:border-white/20",
        "transition-all duration-300 ease-in-out",
        className
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          type === "incoming"
            ? "bg-emerald-500/20 text-emerald-500"
            : "bg-rose-500/20 text-rose-500"
        )}
      >
        {type === "incoming" ? (
          <ArrowDownIcon className="h-5 w-5" />
        ) : (
          <ArrowUpIcon className="h-5 w-5" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <p className="text-sm font-medium text-white/90">{description}</p>
        <p className="text-xs text-white/60">
          {format(date, "d MMMM yyyy, HH:mm", { locale: tr })}
        </p>
      </div>

      <div
        className={cn(
          "text-right",
          type === "incoming" ? "text-emerald-500" : "text-rose-500"
        )}
      >
        <p className="text-sm font-medium">
          {type === "incoming" ? "+" : "-"} {amount} ZYRA
        </p>
      </div>
    </div>
  );
}

interface TransactionHistoryProps {
  transactions: Array<{
    id: string;
    type: "incoming" | "outgoing";
    amount: number;
    description: string;
    date: Date;
  }>;
  className?: string;
}

export function TransactionHistory({
  transactions,
  className,
}: TransactionHistoryProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl p-4",
        "bg-black/30 backdrop-blur-md backdrop-saturate-150",
        "border border-white/10",
        className
      )}
    >
      <h2 className="mb-2 text-lg font-semibold text-white/90">
        İşlem Geçmişi
      </h2>
      
      <div className="flex flex-col gap-2">
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            type={transaction.type}
            amount={transaction.amount}
            description={transaction.description}
            date={transaction.date}
          />
        ))}
      </div>
    </div>
  );
} 