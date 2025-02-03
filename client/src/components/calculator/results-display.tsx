import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ResultsDisplayProps {
  calculation: {
    monthlyPayment: number;
    monthlyPaymentGross: number;
    monthlyPaymentNet: number;
    totalPayments: number;
    totalInterest: number;
    loanAmount: number;
    taxCredit: number;
    maintenanceTotal: number;
    capitalGain: number;
    totalBuyingCost: number;
    totalRentalCost: number;
    breakevenMonth: number;
    amortizationSchedule: Array<{
      month: number;
      principal: number;
      interest: number;
      balance: number;
      cumulativeCostBuying: number;
      cumulativeCostRenting: number;
      monthlyPaymentNet: number;
      cumulativeMaintenance: number;
    }>;
  };
}

export default function ResultsDisplay({ calculation }: ResultsDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">€{calculation.monthlyPayment.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Base Monthly Payment</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">€{calculation.monthlyPaymentGross.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Gross Monthly Payment</div>
            <div className="text-xs text-muted-foreground">(incl. maintenance)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">€{calculation.monthlyPaymentNet.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Net Monthly Payment</div>
            <div className="text-xs text-muted-foreground">(after tax benefit)</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Buying Costs</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Loan Amount:</span>
                <span>€{calculation.loanAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Interest:</span>
                <span>€{calculation.totalInterest.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Maintenance:</span>
                <span>€{calculation.maintenanceTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Tax Credit:</span>
                <span>€{calculation.taxCredit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Capital Gain:</span>
                <span>€{calculation.capitalGain.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Net Cost of Buying:</span>
                <span>€{calculation.totalBuyingCost.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Renting Costs</h3>
            <div className="space-y-2">
              <div className="flex justify-between font-bold pt-2">
                <span>Total Cost of Renting:</span>
                <span>€{calculation.totalRentalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Breakeven Point:</span>
                <span>{calculation.breakevenMonth} months</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Cost Difference (Rent - Buy):</span>
                <span>€{(calculation.totalRentalCost - calculation.totalBuyingCost).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="amortization">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="amortization">Loan Balance</TabsTrigger>
          <TabsTrigger value="comparison">Buy vs Rent</TabsTrigger>
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
                name="Loan Balance"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
        <TabsContent value="comparison" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={calculation.amortizationSchedule}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="cumulativeCostBuying"
                stroke="hsl(var(--primary))"
                name="Cost of Buying"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cumulativeCostRenting"
                stroke="hsl(var(--destructive))"
                name="Cost of Renting"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}