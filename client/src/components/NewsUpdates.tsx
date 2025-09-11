import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Info, AlertTriangle, CheckCircle, Shield, MapPin, Newspaper, ExternalLink, Filter } from "lucide-react";
import type { NewsUpdate } from "@shared/schema";

interface NewsUpdatesProps {
  limit?: number;
  showFilters?: boolean;
  selectedState?: string;
}

export default function NewsUpdates({ limit = 10, showFilters = false, selectedState }: NewsUpdatesProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>(selectedState || 'all');
  
  const { data: news = [], isLoading, refetch } = useQuery<NewsUpdate[]>({
    queryKey: ['/api/getNewsUpdates', stateFilter, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (stateFilter !== 'all') {
        params.append('state', stateFilter);
      }
      params.append('limit', limit.toString());
      
      const response = await fetch(`/api/getNewsUpdates?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch news updates');
      }
      return response.json();
    },
    retry: false,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const getIcon = (category: string) => {
    switch (category) {
      case 'emergency':
        return <AlertTriangle className="text-red-600 h-4 w-4" />;
      case 'alert':
        return <AlertTriangle className="text-orange-600 h-4 w-4" />;
      case 'safety':
        return <Shield className="text-green-600 h-4 w-4" />;
      case 'info':
        return <Newspaper className="text-blue-600 h-4 w-4" />;
      default:
        return <Info className="text-gray-600 h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'emergency':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      case 'alert':
        return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
      case 'safety':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  // Filter news based on selected filters
  const filteredNews = news.filter(item => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (stateFilter !== 'all' && item.state !== stateFilter) return false;
    return true;
  });

  const displayNews = filteredNews.slice(0, limit);

  const northeastStates = [
    'Assam', 'Meghalaya', 'Arunachal Pradesh', 'Nagaland',
    'Manipur', 'Mizoram', 'Tripura', 'Sikkim'
  ];

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Safety Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 bg-muted rounded-lg animate-pulse">
                <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
                <div className="h-3 bg-muted-foreground/20 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center space-x-2">
            <Newspaper className="h-4 w-4" />
            <span>Northeast India News</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
              className="text-xs"
              data-testid="button-refresh-news"
            >
              Refresh
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <div className="flex items-center space-x-3 mt-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {northeastStates.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayNews.length > 0 ? (
            displayNews.map((item: NewsUpdate) => (
              <div 
                key={item.id} 
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors hover:shadow-sm ${getCategoryColor(item.category)}`}
                data-testid={`news-item-${item.id}`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white dark:bg-gray-900">
                  {getIcon(item.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground line-clamp-2 mb-1">{item.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.content}</div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <Badge 
                        variant={item.category === 'emergency' ? 'destructive' : item.category === 'alert' ? 'secondary' : 'outline'} 
                        className="text-xs"
                      >
                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                      </Badge>
                      {item.state && (
                        <Badge variant="outline" className="text-xs flex items-center space-x-1">
                          <MapPin className="h-2 w-2" />
                          <span>{item.state}</span>
                        </Badge>
                      )}
                      {item.priority && getPriorityBadge(item.priority)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                      </div>
                      {item.sourceUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => window.open(item.sourceUrl, '_blank')}
                          data-testid={`button-open-source-${item.id}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Newspaper className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <div className="text-sm text-muted-foreground mb-2">
                {news.length === 0 
                  ? "No news updates available" 
                  : categoryFilter !== 'all' || stateFilter !== 'all'
                    ? "No news matches your filters"
                    : "No recent updates available"
                }
              </div>
              {(categoryFilter !== 'all' || stateFilter !== 'all') && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setCategoryFilter('all');
                    setStateFilter('all');
                  }}
                  className="text-xs"
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
