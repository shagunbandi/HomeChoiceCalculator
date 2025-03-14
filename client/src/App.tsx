import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import MortgageCalculator from "@/components/calculator/MortgageCalculator";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Home Choice Calculator</h1>
        <MortgageCalculator />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
