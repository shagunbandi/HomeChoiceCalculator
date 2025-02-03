import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { CalculatorIcon, ChartBarIcon, ShieldCheckIcon } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 mb-16">
          <div className="flex-1 space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Make Smarter Mortgage Decisions
            </h1>
            <p className="text-lg text-muted-foreground">
              Our mortgage benefit analyzer helps you understand the true cost of your mortgage and make informed decisions about your home financing.
            </p>
            <div className="flex gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg">Go to Dashboard</Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button size="lg">Get Started</Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex-1">
            <img
              src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914"
              alt="Modern House"
              className="rounded-lg shadow-xl"
              width="600"
              height="400"
            />
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardContent className="pt-6">
              <CalculatorIcon className="h-12 w-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Advanced Calculator</h3>
              <p className="text-muted-foreground">
                Calculate monthly payments, total interest, and compare different mortgage scenarios.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <ChartBarIcon className="h-12 w-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Visual Analytics</h3>
              <p className="text-muted-foreground">
                See your mortgage breakdown with interactive charts and graphs.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <ShieldCheckIcon className="h-12 w-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your financial information is always protected and private.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Ready to analyze your mortgage?</h2>
              <p className="text-primary-foreground/80">
                Join thousands of homeowners making smarter financial decisions.
              </p>
              {!user && (
                <Link href="/auth">
                  <Button variant="secondary" size="lg">
                    Create Free Account
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
