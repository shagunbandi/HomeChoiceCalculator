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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    oneTimeExpense: number; // Added oneTimeExpense
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
  const [selectedMonth, setSelectedMonth] = useState(1);
  const selectedMonthData = calculation.amortizationSchedule[selectedMonth - 1];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="flex justify-between">
              <span>Gross Mortgage (Principal + Interest)</span>
              <span className="font-medium">€{selectedMonthData.monthlyGrossMortgage.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Tax Benefit (Mortgage Scheme)</span>
              <span>-€{selectedMonthData.monthlyTaxCredit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Net Mortgage</span>
              <span>€{selectedMonthData.monthlyPaymentNet.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Maintenance</span>
              <span>+€{(calculation.maintenanceTotal / (calculation.amortizationSchedule.length)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total Monthly Expense</span>
              <span>€{calculation.monthlyPaymentGross.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Breakeven Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-2 flex justify-between">
              <span className="text-sm text-muted-foreground">Month: {selectedMonth}</span>
              <span className="text-sm text-muted-foreground">Breakeven at month {calculation.breakevenMonth}</span>
            </div>
            <Slider
              value={[selectedMonth]}
              min={1}
              max={calculation.amortizationSchedule.length}
              step={1}
              onValueChange={(value) => setSelectedMonth(value[0])}
            />
          </div>

          <div className="grid gap-4">
            <div>
              <h4 className="font-medium mb-2">Buying Cost till Month {selectedMonth}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Interest Paid</span>
                  <span>€{calculation.amortizationSchedule.slice(0, selectedMonth).reduce((sum, month) => sum + month.interest, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Total Tax Credit (Mortgage Scheme)</span>
                  <span>-€{calculation.amortizationSchedule.slice(0, selectedMonth).reduce((sum, month) => sum + month.monthlyTaxCredit, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Maintenance Paid</span>
                  <span>€{selectedMonthData.cumulativeMaintenance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>One-time Expenses</span>
                  <span>€{calculation.oneTimeExpense.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Property Value Change</span>
                  <span>€{(calculation.capitalGain).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total Cost of Buying</span>
                  <span>€{(
                    calculation.amortizationSchedule.slice(0, selectedMonth).reduce((sum, month) => sum + month.interest, 0) - 
                    calculation.amortizationSchedule.slice(0, selectedMonth).reduce((sum, month) => sum + month.monthlyTaxCredit, 0) + 
                    selectedMonthData.cumulativeMaintenance + 
                    calculation.oneTimeExpense + 
                    calculation.capitalGain
                  ).toFixed(2)}</span>
                </div>
                
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Analysis Conclusion</h4>
                  <p className="text-sm">
                    {selectedMonthData.cumulativeCostRenting - (selectedMonthData.cumulativeCostBuying + calculation.oneTimeExpense) > 0 
                      ? `At month ${selectedMonth}, buying is cheaper than renting by €${(selectedMonthData.cumulativeCostRenting - (selectedMonthData.cumulativeCostBuying + calculation.oneTimeExpense)).toFixed(2)}`
                      : `At month ${selectedMonth}, renting is cheaper than buying by €${((selectedMonthData.cumulativeCostBuying + calculation.oneTimeExpense) - selectedMonthData.cumulativeCostRenting).toFixed(2)}`
                    }
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Rent Cost till Month {selectedMonth}</h4>
              <div className="flex justify-between font-bold">
                <span>Total Cost of Renting</span>
                <span>€{selectedMonthData.cumulativeCostRenting.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Difference (Rent - Buy)</span>
                <span className={selectedMonthData.cumulativeCostRenting - (selectedMonthData.cumulativeCostBuying + calculation.oneTimeExpense) > 0 ? "text-green-600" : "text-red-600"}>
                  €{(selectedMonthData.cumulativeCostRenting - (selectedMonthData.cumulativeCostBuying + calculation.oneTimeExpense)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="comparison">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comparison">Cost Comparison</TabsTrigger>
          <TabsTrigger value="balance">Loan Balance</TabsTrigger>
        </TabsList>
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
        <TabsContent value="balance" className="h-[300px]">
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
      </Tabs>
    </div>
  );
}