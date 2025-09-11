import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/useWebSocket";
import { 
  Users, 
  AlertTriangle, 
  Shield, 
  Clock, 
  MapPin,
  Phone,
  Download,
  BarChart3,
  Radio
} from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: userProfile, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: tourists = [] } = useQuery({
    queryKey: ["/api/dashboard/tourists"],
    retry: false,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/dashboard/alerts"],
    retry: false,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/dashboard/locations"],
    retry: false,
  });

  // WebSocket for real-time updates
  useWebSocket((message) => {
    if (message.type === 'emergencyAlert') {
      toast({
        title: "Emergency Alert",
        description: `Panic button pressed by ${message.data.tourist.fullName}`,
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/alerts"] });
    } else if (message.type === 'locationUpdate') {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/locations"] });
    }
  });

  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PUT", `/api/dashboard/alerts/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/alerts"] });
      toast({
        title: "Alert Updated",
        description: "Alert status has been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Update Failed",
        description: "Failed to update alert status.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect non-police users
  if (userProfile?.user?.role !== 'police' && userProfile?.user?.role !== 'admin') {
    window.location.href = '/';
    return null;
  }

  const activeAlerts = alerts.filter((alert: any) => alert.status === 'active').length;
  const avgSafetyScore = tourists.length > 0 ? 
    Math.round(tourists.reduce((sum: number, t: any) => sum + (t.safetyScore || 85), 0) / tourists.length) : 0;

  const handleRespond = (alertId: string) => {
    updateAlertMutation.mutate({ id: alertId, status: 'responded' });
  };

  const handleResolve = (alertId: string) => {
    updateAlertMutation.mutate({ id: alertId, status: 'resolved' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Dashboard Header */}
        <Card className="shadow-sm mb-6" data-testid="card-dashboard-header">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Police & Tourism Dashboard</h1>
                <p className="text-muted-foreground">Northeast India Smart Tourist Safety System</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Logged in as</div>
                  <div className="font-semibold text-foreground">
                    {userProfile?.user?.firstName} {userProfile?.user?.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {userProfile?.user?.role} Officer
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Shield className="text-primary-foreground h-6 w-6" />
                </div>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/api/logout'}
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          
          <Card className="shadow-sm" data-testid="stat-active-tourists">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Tourists</p>
                  <p className="text-3xl font-bold text-foreground">{tourists.length}</p>
                  <p className="text-xs text-green-600">↑ Currently tracked</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="text-blue-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="stat-active-alerts">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                  <p className="text-3xl font-bold text-foreground">{activeAlerts}</p>
                  <p className="text-xs text-orange-600">
                    {alerts.filter((a: any) => a.priority === 'high').length} high priority
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="text-orange-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="stat-safety-score">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Safety Score</p>
                  <p className="text-3xl font-bold text-foreground">{avgSafetyScore}%</p>
                  <p className="text-xs text-green-600">Above regional avg</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="text-green-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="stat-response-time">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                  <p className="text-3xl font-bold text-foreground">4.2min</p>
                  <p className="text-xs text-green-600">↓ 15% improvement</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="text-purple-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Map */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm" data-testid="card-main-map">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tourist Activity Map</CardTitle>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="default">Live View</Button>
                    <Button size="sm" variant="secondary">Heatmap</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-96 bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 rounded-xl overflow-hidden border border-border">
                  
                  {/* Northeast states representation */}
                  <div className="absolute top-16 left-12 w-32 h-24 bg-green-200 rounded-2xl opacity-80 flex items-center justify-center">
                    <span className="text-xs font-medium text-green-800">Assam</span>
                  </div>
                  <div className="absolute top-32 left-20 w-20 h-16 bg-green-300 rounded-xl opacity-80 flex items-center justify-center">
                    <span className="text-xs font-medium text-green-800">Meghalaya</span>
                  </div>
                  <div className="absolute top-8 right-16 w-24 h-20 bg-yellow-200 rounded-2xl opacity-80 flex items-center justify-center">
                    <span className="text-xs font-medium text-yellow-800">Arunachal</span>
                  </div>
                  
                  {/* Tourist markers */}
                  {locations.slice(0, 10).map((location: any, index: number) => (
                    <div 
                      key={index}
                      className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-lg ${
                        location.safetyZone === 'safe' ? 'bg-green-500' :
                        location.safetyZone === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{
                        top: `${20 + Math.random() * 60}%`,
                        left: `${10 + Math.random() * 80}%`
                      }}
                      title={`Tourist: ${location.tourist?.fullName}`}
                    />
                  ))}
                </div>
                
                <div className="flex flex-wrap justify-center mt-4 space-x-6 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Safe Zone ({locations.filter((l: any) => l.safetyZone === 'safe').length} tourists)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Moderate Risk ({locations.filter((l: any) => l.safetyZone === 'moderate').length} tourists)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>High Risk ({locations.filter((l: any) => l.safetyZone === 'unsafe').length} tourists)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            
            {/* Active Alerts */}
            <Card className="shadow-sm" data-testid="card-active-alerts">
              <CardHeader>
                <CardTitle className="text-lg">Active Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.filter((alert: any) => alert.status === 'active').slice(0, 3).map((alert: any) => (
                  <div key={alert.id} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-red-900">Panic Alert</div>
                        <div className="text-xs text-red-700">Tourist: {alert.tourist.fullName}</div>
                        <div className="text-xs text-red-600">{alert.address || 'Location updating...'}</div>
                        <div className="text-xs text-red-500 mt-1">
                          {new Date(alert.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRespond(alert.id)}
                          disabled={updateAlertMutation.isPending}
                          data-testid={`button-respond-${alert.id}`}
                        >
                          Respond
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleResolve(alert.id)}
                          disabled={updateAlertMutation.isPending}
                          data-testid={`button-resolve-${alert.id}`}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {alerts.filter((alert: any) => alert.status === 'active').length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No active alerts
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Tourist Activity */}
            <Card className="shadow-sm" data-testid="card-recent-activity">
              <CardHeader>
                <CardTitle className="text-lg">Recent Tourist Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {locations.slice(0, 5).map((location: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      location.safetyZone === 'safe' ? 'bg-green-500' :
                      location.safetyZone === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      <MapPin className="text-white h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {location.tourist?.fullName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {location.address || 'Location updating...'}
                      </div>
                      <div className={`text-xs ${
                        location.safetyZone === 'safe' ? 'text-green-600' :
                        location.safetyZone === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {location.safetyZone} zone • {new Date(location.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm" data-testid="card-quick-actions">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  data-testid="button-send-advisory"
                >
                  <Radio className="h-4 w-4 mr-2" />
                  Send Safety Advisory
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  data-testid="button-export-data"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Tourist Data
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  data-testid="button-view-analytics"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tourist Management Table */}
        <Card className="shadow-sm mt-6" data-testid="card-tourist-table">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tourist Management</CardTitle>
              <div className="flex space-x-2">
                <Input 
                  placeholder="Search tourists..." 
                  className="w-64"
                  data-testid="input-search-tourists"
                />
                <Button variant="outline" data-testid="button-filter">
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Tourist ID</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Location</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Safety Score</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tourists.slice(0, 10).map((tourist: any) => {
                    const latestLocation = locations.find((l: any) => l.touristId === tourist.id);
                    return (
                      <tr key={tourist.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-tourist-${tourist.id}`}>
                        <td className="py-3 px-2 text-sm font-mono">{tourist.digitalId}</td>
                        <td className="py-3 px-2 text-sm font-medium">{tourist.fullName}</td>
                        <td className="py-3 px-2 text-sm">{latestLocation?.address || 'No recent location'}</td>
                        <td className="py-3 px-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              (latestLocation?.safetyScore || 85) >= 80 ? 'bg-green-500' :
                              (latestLocation?.safetyScore || 85) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <span>{latestLocation?.safetyScore || 85}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={
                            latestLocation?.safetyZone === 'safe' ? 'default' :
                            latestLocation?.safetyZone === 'moderate' ? 'secondary' : 'destructive'
                          }>
                            {latestLocation?.safetyZone || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Button variant="ghost" size="sm" className="mr-2" data-testid={`button-view-${tourist.id}`}>
                            View
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-contact-${tourist.id}`}>
                            <Phone className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
