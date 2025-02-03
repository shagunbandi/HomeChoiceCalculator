import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const mortgageSchema = z.object({
  buying_cost: z.number().positive("Property value must be positive"),
  down_payment: z.number().positive("Down payment must be positive"),
  sell_price: z.number().positive("Selling price must be positive"),
  one_time_expense: z.number().min(0, "One-time expense cannot be negative"),
  interest_rate: z.number().positive("Interest rate must be positive"),
  term_years: z.number().int().positive("Loan term must be positive").lte(30, "Maximum loan term is 30 years"),
  yearly_maintenance: z.number().min(0, "Yearly maintenance cannot be negative"),
  tax_credit_rate: z.number().min(0, "Tax credit rate cannot be negative").max(100, "Tax credit rate cannot exceed 100%"),
  current_rent: z.number().min(0, "Current rent cannot be negative"),
  rental_increase: z.number().min(0, "Rental increase cannot be negative"),
  name: z.string().optional(),
});

type MortgageFormData = z.infer<typeof mortgageSchema>;

interface MortgageFormProps {
  onCalculate: (result: {
    monthlyPayment: number;
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
    }>;
  }) => void;
}

export default function MortgageForm({ onCalculate }: MortgageFormProps) {
  const form = useForm<MortgageFormData>({
    resolver: zodResolver(mortgageSchema),
    defaultValues: {
      buying_cost: 300000,
      down_payment: 60000,
      sell_price: 350000,
      one_time_expense: 5000,
      interest_rate: 3.5,
      term_years: 30,
      yearly_maintenance: 2400,
      tax_credit_rate: 30,
      current_rent: 1500,
      rental_increase: 2,
      name: "",
    },
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: MortgageFormData & { 
      monthlyPayment: number;
      totalInterest: number;
      breakevenMonth: number;
    }) => {
      const res = await apiRequest("POST", "/api/calculations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
    },
  });

  const onSubmit = (data: MortgageFormData) => {
    const loanAmount = data.buying_cost - data.down_payment;
    const monthlyRate = data.interest_rate / 100 / 12;
    const numberOfPayments = data.term_years * 12;

    const monthlyPayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const totalPayments = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayments - loanAmount;
    const taxCredit = totalInterest * (data.tax_credit_rate / 100);
    const maintenanceTotal = data.yearly_maintenance * data.term_years;
    const capitalGain = data.sell_price - data.buying_cost;

    const totalBuyingCost = 
      data.buying_cost + 
      totalInterest + 
      data.one_time_expense + 
      maintenanceTotal - 
      taxCredit - 
      capitalGain;

    const amortizationSchedule = [];
    let balance = loanAmount;
    let cumulativeCostBuying = data.down_payment + data.one_time_expense;
    let cumulativeCostRenting = 0;
    let breakevenMonth = -1;
    let currentRent = data.current_rent;

    for (let month = 1; month <= numberOfPayments; month++) {
      const interest = balance * monthlyRate;
      const principalPayment = monthlyPayment - interest;
      balance -= principalPayment;

      // Monthly maintenance cost
      const monthlyMaintenance = data.yearly_maintenance / 12;

      // Monthly tax credit
      const monthlyTaxCredit = taxCredit / numberOfPayments;

      // Update cumulative costs
      cumulativeCostBuying += monthlyPayment + monthlyMaintenance - monthlyTaxCredit;

      // Update rent with annual increase
      if (month % 12 === 0) {
        currentRent *= (1 + data.rental_increase / 100);
      }
      cumulativeCostRenting += currentRent;

      // Find breakeven point
      if (breakevenMonth === -1 && cumulativeCostBuying < cumulativeCostRenting) {
        breakevenMonth = month;
      }

      amortizationSchedule.push({
        month,
        principal: principalPayment,
        interest,
        balance: Math.max(0, balance),
        cumulativeCostBuying,
        cumulativeCostRenting,
      });
    }

    onCalculate({
      monthlyPayment,
      totalPayments,
      totalInterest,
      loanAmount,
      taxCredit,
      maintenanceTotal,
      capitalGain,
      totalBuyingCost,
      totalRentalCost: cumulativeCostRenting,
      breakevenMonth,
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
                  <Input {...field} type="number" min="0" step="0.1" 
                    onChange={e => field.onChange(parseFloat(e.target.value))}
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
            name="tax_credit_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Credit Rate (%)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" max="100" step="0.1" 
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
          Calculate
        </Button>
      </form>
    </Form>
  );
}