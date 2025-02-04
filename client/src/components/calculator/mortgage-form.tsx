import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from 'react';

const mortgageSchema = z.object({
  buying_cost: z.number().positive("Property value must be positive"),
  down_payment: z.number().min(0, "Down payment cannot be negative"),
  sell_price: z.number().positive("Selling price must be positive"),
  one_time_expense: z.number().min(0, "One-time expense cannot be negative"),
  interest_rate: z.string()
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Interest rate must be a positive number")
    .refine(val => {
      return /^\d+\.\d{2}$/.test(val);
    }, "Interest rate must have exactly 2 decimal places"),
  mortgage_tax_scheme: z.string()
    .refine(val => {
      if (val.endsWith('.')) return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, "Tax scheme must be between 0 and 100")
    .transform(val => {
      if (val.endsWith('.')) {
        return parseFloat(val + '0');
      }
      return parseFloat(val);
    }),
  term_years: z.number().int().positive("Loan term must be positive").lte(30, "Maximum loan term is 30 years"),
  yearly_maintenance: z.number().min(0, "Yearly maintenance cannot be negative"),
  current_rent: z.number().min(0, "Current rent cannot be negative"),
  rental_increase: z.number().min(0, "Rental increase cannot be negative").step(0.01),
  name: z.string().optional(),
});

type MortgageFormData = z.infer<typeof mortgageSchema>;

interface MortgageFormProps {
  onCalculate: (result: {
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
      monthlyGrossMortgage: number;
      monthlyTaxCredit: number;
    }>;
  }) => void;
}

export default function MortgageForm({ onCalculate }: MortgageFormProps) {
  const [selectedCalculationId, setSelectedCalculationId] = useState<number | null>(null);

  const form = useForm<MortgageFormData>({
    resolver: zodResolver(mortgageSchema),
    defaultValues: {
      buying_cost: 300000,
      down_payment: 60000,
      sell_price: 350000,
      one_time_expense: 5000,
      interest_rate: "3.50",
      mortgage_tax_scheme: "37.00",
      term_years: 30,
      yearly_maintenance: 2400,
      current_rent: 1500,
      rental_increase: 2,
      name: "",
    },
  });

  const { data: savedCalculations } = useQuery<Array<{
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
    name?: string;
  }>>({
    queryKey: ["/api/calculations"],
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: MortgageFormData & {
      monthlyPayment: number;
      totalInterest: number;
      breakevenMonth: number;
    }) => {
      const endpoint = selectedCalculationId
        ? `/api/calculations/${selectedCalculationId}`
        : "/api/calculations";

      const method = selectedCalculationId ? "PATCH" : "POST";

      const res = await apiRequest(method, endpoint, {
        buyingCost: data.buying_cost,
        downPayment: data.down_payment,
        sellPrice: data.sell_price,
        oneTimeExpense: data.one_time_expense,
        interestRate: data.interest_rate,
        mortgageTaxScheme: data.mortgage_tax_scheme,
        loanTerm: data.term_years,
        yearlyMaintenance: data.yearly_maintenance,
        currentRent: data.current_rent,
        rentalIncrease: data.rental_increase,
        monthlyPayment: data.monthlyPayment,
        totalInterest: data.totalInterest,
        breakevenMonth: data.breakevenMonth,
        name: data.name
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
    },
  });

  const onSubmit = (data: MortgageFormData) => {
    const loanAmount = data.buying_cost - data.down_payment;
    const monthlyRate = parseFloat(data.interest_rate) / 100 / 12;
    const numberOfPayments = data.term_years * 12;

    const monthlyPayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const totalPayments = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayments - loanAmount;

    // Monthly calculations
    const monthlyMaintenance = data.yearly_maintenance / 12;
    const monthlyInterest = monthlyRate * loanAmount;
    const monthlyTaxCredit = monthlyInterest * (data.mortgage_tax_scheme / 100);

    // Monthly payment breakdown
    const monthlyGrossMortgage = monthlyPayment; // Principal + Interest
    const monthlyPaymentNet = monthlyGrossMortgage - monthlyTaxCredit;
    const monthlyPaymentGross = monthlyPaymentNet + monthlyMaintenance;

    const amortizationSchedule = [];
    let balance = loanAmount;
    let cumulativeInterest = 0;
    let cumulativeTaxCredit = 0;
    let cumulativeMaintenance = 0;
    let cumulativeCostRenting = 0;
    let breakevenMonth = -1;
    let currentRent = data.current_rent;

    for (let month = 1; month <= numberOfPayments; month++) {
      const interest = balance * monthlyRate;
      const principalPayment = monthlyPayment - interest;
      balance -= principalPayment;

      cumulativeInterest += interest;
      cumulativeTaxCredit += monthlyTaxCredit;
      cumulativeMaintenance += monthlyMaintenance;

      // Cost of buying calculation for this month
      const costOfBuying = cumulativeInterest - cumulativeTaxCredit +
        cumulativeMaintenance + data.one_time_expense + (data.buying_cost - data.sell_price);

      // Update rent with annual increase
      if (month % 12 === 0) {
        currentRent *= (1 + data.rental_increase / 100);
      }
      cumulativeCostRenting += currentRent;

      // Find breakeven point
      if (breakevenMonth === -1 && costOfBuying < cumulativeCostRenting) {
        breakevenMonth = month;
      }

      amortizationSchedule.push({
        month,
        principal: principalPayment,
        interest,
        balance: Math.max(0, balance),
        cumulativeCostBuying: costOfBuying,
        cumulativeCostRenting,
        monthlyPaymentNet,
        cumulativeMaintenance,
        monthlyGrossMortgage,
        monthlyTaxCredit
      });
    }

    const totalBuyingCost = cumulativeInterest - cumulativeTaxCredit +
      cumulativeMaintenance + (data.buying_cost - data.sell_price);

    const taxCredit = cumulativeInterest * (data.mortgage_tax_scheme / 100);
    const maintenanceTotal = data.yearly_maintenance * data.term_years;
    const capitalGain = data.sell_price - data.buying_cost;

    onCalculate({
      monthlyPayment,
      monthlyPaymentGross,
      monthlyPaymentNet,
      totalPayments,
      totalInterest,
      loanAmount,
      taxCredit,
      maintenanceTotal,
      capitalGain,
      totalBuyingCost,
      totalRentalCost: cumulativeCostRenting,
      breakevenMonth,
      oneTimeExpense: data.one_time_expense,
      amortizationSchedule,
    });

    calculateMutation.mutate({
      ...data,
      monthlyPayment,
      totalInterest,
      breakevenMonth,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {savedCalculations?.length > 0 && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Load Saved Calculation</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const savedCalc = savedCalculations.find(calc => calc.id.toString() === value);
                    if (savedCalc) {
                      setSelectedCalculationId(savedCalc.id);
                      form.reset({
                        buying_cost: parseFloat(savedCalc.buyingCost),
                        down_payment: parseFloat(savedCalc.downPayment),
                        sell_price: parseFloat(savedCalc.sellPrice),
                        one_time_expense: parseFloat(savedCalc.oneTimeExpense),
                        interest_rate: savedCalc.interestRate,
                        mortgage_tax_scheme: savedCalc.mortgageTaxScheme.toString(),
                        term_years: savedCalc.loanTerm,
                        yearly_maintenance: parseFloat(savedCalc.yearlyMaintenance),
                        current_rent: parseFloat(savedCalc.currentRent),
                        rental_increase: parseFloat(savedCalc.rentalIncrease),
                        name: savedCalc.name || "",
                      });
                    } else {
                      setSelectedCalculationId(null);
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a saved calculation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {savedCalculations.map((calc) => (
                      <SelectItem key={calc.id} value={calc.id.toString()}>
                        {calc.name || `Calculation ${calc.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="buying_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Purchase Price (€)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" step="1000"
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="down_payment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Down Payment (€)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" step="1000"
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sell_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Selling Price (€)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" step="1000"
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="one_time_expense"
            render={({ field }) => (
              <FormItem>
                <FormLabel>One-time Expenses (€)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" step="100"
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interest_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Rate (%)</FormLabel>
                <FormControl>
                  <Input {...field}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mortgage_tax_scheme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mortgage Tax Scheme (%)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="term_years"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loan Term (years)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="1" max="30"
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="yearly_maintenance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Yearly Maintenance (€)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" step="100"
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="current_rent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Monthly Rent (€)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" step="50"
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rental_increase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Rental Increase (%)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" step="0.1"
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calculation Name (optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={calculateMutation.isPending}>
          {selectedCalculationId ? 'Update Calculation' : 'Calculate'}
        </Button>
      </form>
    </Form>
  );
}