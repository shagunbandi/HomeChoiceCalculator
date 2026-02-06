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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

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
    oneTimeExpense: number;
    amortizationSchedule: Array<{
      month: number;
      principal: number;
      interest: number;
      balance: number;
      cumulativeCostBuying: number;
      cumulativeCostRenting: number;
      monthlyPaymentNet: number;
      cumulativeMaintenance: number;
      monthlyGrossMortgage: number;
      monthlyTaxCredit: number;
    }>;
  };
}

export default function ResultsDisplay({ calculation }: ResultsDisplayProps) {
  const [selectedMonth, setSelectedMonth] = useState(calculation.breakevenMonth);

  const selectedMonthIndex = Math.min(Math.max(0, selectedMonth - 1), calculation.amortizationSchedule.length - 1);
  const selectedMonthData = calculation.amortizationSchedule[selectedMonthIndex];

  if (!selectedMonthData) {
    return <div>No data available for the selected month.</div>;
  }

  const totalInterestPaid = calculation.amortizationSchedule.slice(0, selectedMonth).reduce((sum, month) => sum + month.interest, 0);
  const totalTaxCredit = calculation.amortizationSchedule.slice(0, selectedMonth).reduce((sum, month) => sum + month.monthlyTaxCredit, 0);
  const totalBuyingCost = totalInterestPaid - totalTaxCredit +
    selectedMonthData.cumulativeMaintenance +
    calculation.oneTimeExpense +
    (calculation.capitalGain > 0 ? -calculation.capitalGain : Math.abs(calculation.capitalGain));
  const difference = selectedMonthData.cumulativeCostRenting - totalBuyingCost;
  const buyingIsCheaper = difference > 0;

  return (
    <div className="space-y-6">
      {/* Monthly Payment Summary */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Monthly Payment</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gross Mortgage (P + I)</span>
            <span className="font-medium tabular-nums">{formatCurrency(selectedMonthData.monthlyGrossMortgage)}</span>
          </div>
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Tax Benefit</span>
            <span className="font-medium tabular-nums">-{formatCurrency(selectedMonthData.monthlyTaxCredit)}</span>
          </div>
          <div className="flex justify-between font-medium border-t border-border pt-2">
            <span>Net Mortgage</span>
            <span className="tabular-nums">{formatCurrency(selectedMonthData.monthlyPaymentNet)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Maintenance</span>
            <span className="tabular-nums">+{formatCurrency(calculation.maintenanceTotal / calculation.amortizationSchedule.length)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t border-border pt-2 text-base">
            <span>Total Monthly</span>
            <span className="tabular-nums">{formatCurrency(calculation.monthlyPaymentGross)}</span>
          </div>
        </div>
      </div>

      {/* Breakeven Analysis */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Breakeven Analysis</h4>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Month {selectedMonth}</span>
              <span>Breakeven: month {calculation.breakevenMonth}</span>
            </div>
            <Slider
              value={[selectedMonth]}
              min={1}
              max={calculation.amortizationSchedule.length}
              step={1}
              onValueChange={(value) => setSelectedMonth(value[0])}
            />
          </div>

          <div className="rounded-lg border p-4 space-y-3 text-sm">
            <h5 className="font-medium">Buying Cost &mdash; Month {selectedMonth}</h5>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Paid</span>
                <span className="tabular-nums">{formatCurrency(totalInterestPaid)}</span>
              </div>
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Tax Credit</span>
                <span className="tabular-nums">-{formatCurrency(totalTaxCredit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maintenance</span>
                <span className="tabular-nums">{formatCurrency(selectedMonthData.cumulativeMaintenance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">One-time Expenses</span>
                <span className="tabular-nums">{formatCurrency(calculation.oneTimeExpense)}</span>
              </div>
              <div className={`flex justify-between ${calculation.capitalGain > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                <span>Property Value Change</span>
                <span className="tabular-nums">{calculation.capitalGain > 0 ? '-' : '+'}{formatCurrency(Math.abs(calculation.capitalGain))}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-border pt-2">
                <span>Total Buying Cost</span>
                <span className="tabular-nums">{formatCurrency(totalBuyingCost)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 text-sm">
            <div className="flex justify-between font-semibold">
              <span>Total Renting Cost</span>
              <span className="tabular-nums">{formatCurrency(selectedMonthData.cumulativeCostRenting)}</span>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex justify-between text-base font-semibold">
              <span>Difference (Rent - Buy)</span>
              <span className={`tabular-nums ${buyingIsCheaper ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatCurrency(difference)}
              </span>
            </div>
            <div className="mt-3 rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                {buyingIsCheaper
                  ? `At month ${selectedMonth}, buying is cheaper than renting by ${formatCurrency(difference)}.`
                  : `At month ${selectedMonth}, renting is cheaper than buying by ${formatCurrency(Math.abs(difference))}.`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="comparison">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comparison">Cost Comparison</TabsTrigger>
          <TabsTrigger value="balance">Loan Balance</TabsTrigger>
        </TabsList>
        <TabsContent value="comparison" className="h-[300px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={calculation.amortizationSchedule}
              margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.375rem',
                  color: 'hsl(var(--card-foreground))',
                  fontSize: '0.75rem',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Line
                type="monotone"
                dataKey="cumulativeCostBuying"
                stroke="hsl(var(--primary))"
                name="Cost of Buying"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="cumulativeCostRenting"
                stroke="hsl(var(--destructive))"
                name="Cost of Renting"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
        <TabsContent value="balance" className="h-[300px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={calculation.amortizationSchedule}
              margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.375rem',
                  color: 'hsl(var(--card-foreground))',
                  fontSize: '0.75rem',
                }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--primary))"
                name="Loan Balance"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatCurrency(value: number): string {
  return `\u20AC${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}
