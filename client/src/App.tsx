import { Toaster } from "@/components/ui/toaster";
import { ThemeToggle } from "@/components/theme-toggle";
import MortgageCalculator from "@/components/calculator/MortgageCalculator";
import { Home } from "lucide-react";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 pt-6 sm:px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <Home className="h-8 w-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Home Choice Calculator</h1>
          </div>
          <div className="flex flex-1 justify-end">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <MortgageCalculator />
      </main>
      <Toaster />
    </div>
  );
}

export default App;
