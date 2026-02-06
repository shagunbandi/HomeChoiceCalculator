import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ChevronDown } from "lucide-react";

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
  mortgage_tax_scheme: z.coerce.number().min(0, "Tax scheme must be at least 0").max(100, "Tax scheme must be at most 100"),
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
  const [isExpanded, setIsExpanded] = useState(false);

  const form = useForm<MortgageFormData>({
    resolver: zodResolver(mortgageSchema),
    defaultValues: {
      buying_cost: 400000,
      down_payment: 40000,
      sell_price: 500000,
      one_time_expense: 15000,
      interest_rate: "3.5",
      mortgage_tax_scheme: 37,
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

      const monthlyMaintenance = data.yearly_maintenance / 12;
      const monthlyInterest = monthlyRate * loanAmount;
      const monthlyTaxCredit = monthlyInterest * (data.mortgage_tax_scheme / 100);

      const monthlyGrossMortgage = monthlyPayment;
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

        const costOfBuying = cumulativeInterest - cumulativeTaxCredit +
          cumulativeMaintenance + data.one_time_expense + (data.buying_cost - data.sell_price);

        if (month % 12 === 0) {
          currentRent *= (1 + data.rental_increase / 100);
        }
        cumulativeCostRenting += currentRent;

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

      if (breakevenMonth === -1) {
        breakevenMonth = numberOfPayments;
      }

      const totalBuyingCost = cumulativeInterest - cumulativeTaxCredit +
        cumulativeMaintenance + data.one_time_expense + (data.buying_cost - data.sell_price);

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
      toast({
        title: "Calculation Complete",
        description: "Your mortgage calculation has been completed successfully.",
      });
    } catch {
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Property</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="buying_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Value</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                      <Input type="number" placeholder="400000" className="pl-7" {...field} />
                    </div>
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
                  <FormLabel>Down Payment</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                      <Input type="number" placeholder="40000" className="pl-7" {...field} />
                    </div>
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
                  <FormLabel>Est. Selling Price</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                      <Input type="number" placeholder="500000" className="pl-7" {...field} />
                    </div>
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
                  <FormLabel>One-time Expenses</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                      <Input type="number" placeholder="15000" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Loan</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="interest_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Rate</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="3.5" className="pr-7" {...field} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
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
                  <FormLabel>Tax Scheme</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="37.00" className="pr-7" {...field} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
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
                  <FormLabel>Loan Term</FormLabel>
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
                  <FormLabel>Yearly Maintenance</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                      <Input type="number" placeholder="2400" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Rental Comparison</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="current_rent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Rent</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                      <Input type="number" placeholder="1200" className="pl-7" {...field} />
                    </div>
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
                  <FormLabel>Annual Increase</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="number" placeholder="2" className="pr-7" {...field} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Calculate"}
        </Button>

        <div className="rounded-md border">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between p-3 text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Calculation Logic
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {isExpanded && (
            <div className="border-t p-3 space-y-3 text-sm">
              <div>
                <h4 className="font-semibold text-foreground">Loan Amount</h4>
                <p className="text-muted-foreground">Property Value - Down Payment</p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground">Monthly Mortgage Payment</h4>
                <p className="text-muted-foreground mb-1">Standard mortgage amortization formula:</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  Payment = P x [r(1+r)^n] / [(1+r)^n - 1]
                  <br /><br />
                  P = Property Value - Down Payment
                  <br />
                  r = Annual Interest Rate / 12
                  <br />
                  n = Loan Term x 12
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground">Tax Benefits</h4>
                <p className="text-muted-foreground">
                  Monthly Tax Credit = Monthly Interest x Tax Scheme %
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground">Monthly Costs</h4>
                <div className="pl-3 border-l-2 border-primary/20 space-y-1">
                  <p className="text-muted-foreground">Gross Mortgage = Payment (Principal + Interest)</p>
                  <p className="text-muted-foreground">Net Mortgage = Gross Mortgage - Tax Credit</p>
                  <p className="text-muted-foreground">Total Monthly = Net Mortgage + Maintenance / 12</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground">Buying vs. Renting</h4>
                <div className="pl-3 border-l-2 border-primary/20 space-y-1">
                  <p className="text-muted-foreground">+ Total Interest Paid</p>
                  <p className="text-muted-foreground">- Total Tax Credits</p>
                  <p className="text-muted-foreground">+ Cumulative Maintenance</p>
                  <p className="text-muted-foreground">+ One-time Expenses</p>
                  <p className="text-muted-foreground">+/- Property Value Change</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground">Breakeven</h4>
                <p className="text-muted-foreground">
                  The month when cumulative buying cost becomes less than cumulative renting cost.
                </p>
              </div>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
