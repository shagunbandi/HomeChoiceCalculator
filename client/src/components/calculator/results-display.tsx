import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ResultsDisplayProps {
  calculation: {
    monthlyPayment: number;
    totalInterest: number;
    amortizationSchedule: Array<{
      month: number;
      principal: number;
      interest: number;
      balance: number;
    }>;
  };
}

export default function ResultsDisplay({ calculation }: ResultsDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${calculation.monthlyPayment.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Monthly Payment</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${calculation.totalInterest.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Interest</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="amortization">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="amortization">Amortization</TabsTrigger>
          <TabsTrigger value="breakdown">Payment Breakdown</TabsTrigger>
        </TabsList>
        <TabsContent value="amortization" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={calculation.amortizationSchedule}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--primary))"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
        <TabsContent value="breakdown" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={calculation.amortizationSchedule}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="principal"
                stroke="hsl(var(--primary))"
                name="Principal"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="interest"
                stroke="hsl(var(--destructive))"
                name="Interest"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
