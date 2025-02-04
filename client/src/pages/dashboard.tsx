import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MortgageForm from "@/components/calculator/mortgage-form";
import ResultsDisplay from "@/components/calculator/results-display";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  taxCreditRate: string;
  loanTerm: number;
  yearlyMaintenance: string;
  currentRent: string;
  rentalIncrease: string;
  monthlyPayment: string;
  totalInterest: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  const [currentCalculation, setCurrentCalculation] = useState<CalculationResult | null>(null);
  const [selectedCalculationId, setSelectedCalculationId] = useState<number | null>(null);

  const { data: savedCalculations = [] } = useQuery<SavedCalculation[]>({
    queryKey: ["/api/calculations"],
  });

  const deleteCalculation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/calculations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
      if (selectedCalculationId) {
        setSelectedCalculationId(null);
      }
      toast({
        title: "Calculation Deleted",
        description: "The calculation has been deleted successfully.",
      });
    },
  });

  const handleLoadCalculation = (calc: SavedCalculation | undefined) => {
    if (calc) {
      return {
        buying_cost: parseFloat(calc.buyingCost),
        down_payment: parseFloat(calc.downPayment),
        sell_price: parseFloat(calc.sellPrice),
        one_time_expense: parseFloat(calc.oneTimeExpense),
        interest_rate: calc.interestRate,
        mortgage_tax_scheme: parseFloat(calc.taxCreditRate || "37.00").toFixed(2),
        term_years: calc.loanTerm,
        yearly_maintenance: parseFloat(calc.yearlyMaintenance),
        current_rent: parseFloat(calc.currentRent),
        rental_increase: parseFloat(calc.rentalIncrease),
        name: calc.name || "",
      };
    }
    return undefined;
  };

  const handleCardClick = (calc: SavedCalculation) => {
    setSelectedCalculationId(calc.id);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    toast({
      title: "Calculation Loaded",
      description: `Loaded ${calc.name || "Unnamed Calculation"}`,
    });
  };

  const handleCalculationCreated = (id: number) => {
    setSelectedCalculationId(id);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = (e: React.MouseEvent, calc: SavedCalculation) => {
    e.stopPropagation();
    deleteCalculation.mutate(calc.id);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Mortgage Calculator</h1>

      <div className="grid lg:grid-cols-2 gap-8" ref={formRef}>
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCalculationId ? 'Edit Calculation' : 'New Calculation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MortgageForm 
              onCalculate={setCurrentCalculation} 
              selectedCalculationId={selectedCalculationId}
              onLoadCalculation={handleLoadCalculation}
              onCalculationCreated={handleCalculationCreated}
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

      {savedCalculations.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Saved Calculations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {savedCalculations.map((calc) => (
                <div
                  key={calc.id}
                  className="relative"
                >
                  <Button
                    variant="outline"
                    className="w-full text-left h-auto p-4"
                    onClick={() => handleCardClick(calc)}
                  >
                    <div className="w-full">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{calc.name || "Unnamed Calculation"}</p>
                        <div className="text-sm text-muted-foreground">
                          Created {formatDistanceToNow(new Date(calc.createdAt))} ago
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Monthly Payment</p>
                          <p className="font-medium">
                            €{parseFloat(calc.monthlyPayment).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Interest</p>
                          <p className="font-medium">
                            €{parseFloat(calc.totalInterest).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Loan Term</p>
                          <p className="font-medium">{calc.loanTerm} years</p>
                        </div>
                      </div>
                      {calc.updatedAt !== calc.createdAt && (
                        <div className="text-sm text-muted-foreground mt-2">
                          Last modified {formatDistanceToNow(new Date(calc.updatedAt))} ago
                        </div>
                      )}
                    </div>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                    onClick={(e) => handleDelete(e, calc)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}