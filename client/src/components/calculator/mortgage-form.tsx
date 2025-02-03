import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const mortgageSchema = z.object({
  propertyValue: z.number().positive("Property value must be positive"),
  downPayment: z.number().positive("Down payment must be positive"),
  interestRate: z.number().positive("Interest rate must be positive"),
  loanTerm: z.number().int().positive("Loan term must be positive").lte(30, "Maximum loan term is 30 years"),
  name: z.string().optional(),
});

type MortgageFormData = z.infer<typeof mortgageSchema>;

interface MortgageFormProps {
  onCalculate: (result: {
    monthlyPayment: number;
    totalInterest: number;
    amortizationSchedule: Array<{
      month: number;
      principal: number;
      interest: number;
      balance: number;
    }>;
  }) => void;
}

export default function MortgageForm({ onCalculate }: MortgageFormProps) {
  const form = useForm<MortgageFormData>({
    resolver: zodResolver(mortgageSchema),
    defaultValues: {
      propertyValue: 300000,
      downPayment: 60000,
      interestRate: 3.5,
      loanTerm: 30,
      name: "",
    },
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: MortgageFormData & { monthlyPayment: number; totalInterest: number }) => {
      const res = await apiRequest("POST", "/api/calculations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
    },
  });

  const onSubmit = (data: MortgageFormData) => {
    const principal = data.propertyValue - data.downPayment;
    const monthlyRate = data.interestRate / 100 / 12;
    const numberOfPayments = data.loanTerm * 12;

    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const totalPayments = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayments - principal;

    const amortizationSchedule = [];
    let balance = principal;

    for (let month = 1; month <= numberOfPayments; month++) {
      const interest = balance * monthlyRate;
      const principalPayment = monthlyPayment - interest;
      balance -= principalPayment;

      amortizationSchedule.push({
        month,
        principal: principalPayment,
        interest,
        balance: Math.max(0, balance),
      });
    }

    onCalculate({
      monthlyPayment,
      totalInterest,
      amortizationSchedule,
    });

    calculateMutation.mutate({
      ...data,
      monthlyPayment,
      totalInterest,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="propertyValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Value ($)</FormLabel>
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
          name="downPayment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Down Payment ($)</FormLabel>
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
          name="interestRate"
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
          name="loanTerm"
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