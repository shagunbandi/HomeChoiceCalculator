import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MortgageForm from "@/components/calculator/mortgage-form";
import ResultsDisplay from "@/components/calculator/results-display";
import { useState } from "react";

type CalculationResult = {
  monthlyPayment: number;
  totalInterest: number;
  amortizationSchedule: Array<{
    month: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
};

export default function Dashboard() {
  const [currentCalculation, setCurrentCalculation] = useState<CalculationResult | null>(
    null
  );

  const { data: savedCalculations } = useQuery({
    queryKey: ["/api/calculations"],
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Mortgage Calculator</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Calculate Mortgage</CardTitle>
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

      {savedCalculations?.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Saved Calculations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {savedCalculations.map((calc) => (
                <div key={calc.id} className="p-4 border rounded-lg">
                  <p className="font-medium">{calc.name || "Unnamed Calculation"}</p>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Payment</p>
                      <p className="font-medium">${calc.monthlyPayment.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Interest</p>
                      <p className="font-medium">${calc.totalInterest.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Loan Term</p>
                      <p className="font-medium">{calc.loanTerm} years</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
