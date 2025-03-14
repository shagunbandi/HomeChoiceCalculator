import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MortgageForm from "@/components/calculator/mortgage-form";
import ResultsDisplay from "@/components/calculator/results-display";

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
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Mortgage Details</CardTitle>
        </CardHeader>
        <CardContent>
          <MortgageForm onCalculate={setCurrentCalculation} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          {currentCalculation ? (
            <ResultsDisplay calculation={currentCalculation} />
          ) : (
            <p className="text-muted-foreground">
              Enter mortgage details to see results
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 