import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, MapPin, Bell, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
                <Shield className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Smart Tourist Safety System
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Northeast India Edition - Your comprehensive safety companion for exploring the beautiful Northeast states with confidence and security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-login"
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Comprehensive Safety Features
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need for safe travel in Northeast India
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Digital Tourist ID</CardTitle>
                <CardDescription>
                  Secure QR-based identification for Northeast travel verification
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Safety Mapping</CardTitle>
                <CardDescription>
                  Color-coded zones showing safe areas, forests, and restricted regions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Emergency Alerts</CardTitle>
                <CardDescription>
                  Instant panic button connecting to nearest police stations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Police Dashboard</CardTitle>
                <CardDescription>
                  Real-time monitoring and response system for authorities
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Northeast States Coverage */}
      <div className="py-24 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Complete Northeast Coverage
            </h2>
            <p className="text-xl text-muted-foreground">
              Protecting tourists across all eight Northeast Indian states
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              'Assam', 'Meghalaya', 'Arunachal Pradesh', 'Nagaland',
              'Manipur', 'Mizoram', 'Tripura', 'Sikkim'
            ].map((state) => (
              <div key={state} className="bg-white rounded-lg p-6 text-center shadow-sm border border-border">
                <h3 className="font-semibold text-foreground">{state}</h3>
                <p className="text-sm text-green-600 mt-2">✓ Protected</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Travel Safely?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Join thousands of tourists exploring Northeast India with confidence
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-4"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-get-started"
          >
            Get Your Digital Tourist ID
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <h3 className="font-bold text-foreground mb-2">Smart Tourist Safety System</h3>
            <p className="text-sm text-muted-foreground">
              Ensuring safe and secure travel experiences across Northeast India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
