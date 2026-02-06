import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MortgageForm from "@/components/calculator/mortgage-form";
import ResultsDisplay from "@/components/calculator/results-display";
import { Calculator, BarChart3 } from "lucide-react";

type CalculationResult = {
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

export default function MortgageCalculator() {
  const [currentCalculation, setCurrentCalculation] = useState<CalculationResult | null>(null);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Mortgage Details</CardTitle>
          </div>
          <CardDescription>Enter your property and loan details to compare buying vs. renting.</CardDescription>
        </CardHeader>
        <CardContent>
          <MortgageForm onCalculate={setCurrentCalculation} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Results</CardTitle>
          </div>
          <CardDescription>Analysis and comparison of buying vs. renting costs.</CardDescription>
        </CardHeader>
        <CardContent>
          {currentCalculation ? (
            <ResultsDisplay calculation={currentCalculation} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground text-sm">
                Enter mortgage details and click Calculate to see results.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
