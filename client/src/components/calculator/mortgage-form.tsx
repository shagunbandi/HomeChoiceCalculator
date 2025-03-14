import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

const mortgageSchema = z.object({
  buying_cost: z.coerce.number().positive("Property value must be positive"),
  down_payment: z.coerce.number().min(0, "Down payment cannot be negative"),
  sell_price: z.coerce.number().positive("Selling price must be positive"),
  one_time_expense: z.coerce.number().min(0, "One-time expense cannot be negative"),
  interest_rate: z.string()
    .refine(val => {
      if (val === '') return false;
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Interest rate must be a positive number")
    .refine(val => {
      return /^\d+(\.\d{1,2})?$/.test(val);
    }, "Interest rate must have at most 2 decimal places"),
  mortgage_tax_scheme: z.string()
    .refine(val => {
      if (val === '') return false;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, "Tax scheme must be between 0 and 100")
    .transform(val => parseFloat(val)),
  term_years: z.coerce.number().positive("Loan term must be positive").lte(30, "Maximum loan term is 30 years"),
  yearly_maintenance: z.coerce.number().min(0, "Yearly maintenance cannot be negative"),
  current_rent: z.coerce.number().min(0, "Current rent cannot be negative"),
  rental_increase: z.coerce.number().min(0, "Rental increase cannot be negative"),
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
  }) => void;
}

export default function MortgageForm({ onCalculate }: MortgageFormProps) {
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<MortgageFormData>({
    resolver: zodResolver(mortgageSchema),
    defaultValues: {
      buying_cost: 400000,
      down_payment: 40000,
      sell_price: 500000,
      one_time_expense: 15000,
      interest_rate: "3.5",
      mortgage_tax_scheme: "37.00",
      term_years: 30,
      yearly_maintenance: 2400,
      current_rent: 1200,
      rental_increase: 2,
      name: "",
    },
  });

  const onSubmit = (data: MortgageFormData) => {
    setIsCalculating(true);
    
    try {
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

      const calculationResult = {
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
      };

      onCalculate(calculationResult);
      toast({
        title: "Calculation Complete",
        description: "Your mortgage calculation has been completed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to calculate mortgage. Please check your inputs and try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="buying_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Value (€)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="400000" {...field} />
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
                  <Input type="number" placeholder="40000" {...field} />
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
                <FormLabel>Estimated Selling Price (€)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="500000" {...field} />
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
                  <Input type="number" placeholder="15000" {...field} />
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
                  <Input placeholder="3.5" {...field} />
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
                  <Input placeholder="37.00" {...field} />
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
                <FormLabel>Loan Term (Years)</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[10, 15, 20, 25, 30].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year} years
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Input type="number" placeholder="2400" {...field} />
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
                  <Input type="number" placeholder="1200" {...field} />
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
                  <Input type="number" placeholder="2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Calculate"}
        </Button>
      </form>
    </Form>
  );
}