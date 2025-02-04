import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MortgageForm from "@/components/calculator/mortgage-form";
import ResultsDisplay from "@/components/calculator/results-display";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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

interface SavedCalculation {
  id: number;
  userId: number;
  buyingCost: string;
  downPayment: string;
  sellPrice: string;
  oneTimeExpense: string;
  interestRate: string;
  mortgageTaxScheme: number;
  loanTerm: number;
  yearlyMaintenance: string;
  currentRent: string;
  rentalIncrease: string;
  monthlyPayment: string;
  totalInterest: string;
  name?: string;
  createdAt: string;
}

export default function Dashboard() {
  const [currentCalculation, setCurrentCalculation] = useState<CalculationResult | null>(
    null
  );
  const [selectedCalculationId, setSelectedCalculationId] = useState<number | null>(null);

  const { data: savedCalculations } = useQuery<SavedCalculation[]>({
    queryKey: ["/api/calculations"],
  });

  const handleLoadCalculation = (calc: SavedCalculation) => {
    if (calc) {
      setSelectedCalculationId(calc.id);
      const values = {
        buying_cost: parseFloat(calc.buyingCost),
        down_payment: parseFloat(calc.downPayment),
        sell_price: parseFloat(calc.sellPrice),
        one_time_expense: parseFloat(calc.oneTimeExpense),
        interest_rate: calc.interestRate,
        mortgage_tax_scheme: calc.mortgageTaxScheme.toString(),
        term_years: calc.loanTerm,
        yearly_maintenance: parseFloat(calc.yearlyMaintenance),
        current_rent: parseFloat(calc.currentRent),
        rental_increase: parseFloat(calc.rentalIncrease),
        name: calc.name || "",
      };
      return values;
    }
    return null;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Mortgage Calculator</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Calculate Mortgage</CardTitle>
          </CardHeader>
          <CardContent>
            <MortgageForm 
              onCalculate={setCurrentCalculation} 
              selectedCalculationId={selectedCalculationId}
              onLoadCalculation={handleLoadCalculation}
            />
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
                <Button
                  key={calc.id}
                  variant="outline"
                  className="w-full text-left h-auto p-4"
                  onClick={() => setSelectedCalculationId(calc.id)}
                >
                  <div>
                    <p className="font-medium">{calc.name || "Unnamed Calculation"}</p>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Payment</p>
                        <p className="font-medium">
                          ${parseFloat(calc.monthlyPayment).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Interest</p>
                        <p className="font-medium">
                          ${parseFloat(calc.totalInterest).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Loan Term</p>
                        <p className="font-medium">{calc.loanTerm} years</p>
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}