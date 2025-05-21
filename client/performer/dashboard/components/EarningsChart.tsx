import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedNumber } from './AnimatedNumber';
import type { EarningData, EarningsChartProps } from '../types/earnings';

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card p-2 shadow-sm">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-primary">
          {payload[0].value.toLocaleString()} ZYRA
        </p>
      </div>
    );
  }
  return null;
}

export function EarningsChart({ userId }: EarningsChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['performerEarnings', userId],
    queryFn: async () => {
      const response = await fetch('/api/performer/earnings');
      if (!response.ok) {
        throw new Error('Kazanç verileri yüklenirken bir hata oluştu');
      }
      return response.json() as Promise<EarningData[]>;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kazanç Grafiği</CardTitle>
          <CardDescription>Son 7 günlük kazanç detayı</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEarnings = earnings?.reduce((sum, day) => sum + day.amount, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:space-y-0">
          <div>
            <CardTitle>Kazanç Grafiği</CardTitle>
            <CardDescription>Son 7 günlük kazanç detayı</CardDescription>
          </div>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-right"
          >
            <div className="text-2xl font-bold text-primary">
              <AnimatedNumber value={totalEarnings} suffix="ZYRA" />
            </div>
            <p className="text-sm text-muted-foreground">Toplam Kazanç</p>
          </motion.div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={earnings}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="currentColor"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => new Date(value).toLocaleDateString('tr-TR', { weekday: 'short' })}
              />
              <YAxis
                stroke="currentColor"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} ZYRA`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: 'hsl(var(--primary))',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: 'hsl(var(--primary))',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 