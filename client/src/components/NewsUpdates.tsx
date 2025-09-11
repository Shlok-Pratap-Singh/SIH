import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Info, AlertTriangle, CheckCircle } from "lucide-react";

interface NewsUpdatesProps {
  limit?: number;
}

export default function NewsUpdates({ limit = 10 }: NewsUpdatesProps) {
  const { data: news = [], isLoading } = useQuery({
    queryKey: ["/api/getNewsUpdates"],
    retry: false,
  });

  const getIcon = (category: string) => {
    switch (category) {
      case 'alert':
        return <AlertTriangle className="text-orange-600 h-4 w-4" />;
      case 'safety':
        return <CheckCircle className="text-green-600 h-4 w-4" />;
      default:
        return <Info className="text-blue-600 h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'alert':
        return 'bg-orange-50 border-orange-200';
      case 'safety':
        return 'bg-green-50 border-green-200';
      case 'emergency':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

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

  const displayNews = news.slice(0, limit);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Safety Updates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayNews.length > 0 ? (
            displayNews.map((item: any) => (
              <div 
                key={item.id} 
                className={`flex items-start space-x-3 p-3 rounded-lg border ${getCategoryColor(item.category)}`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white">
                  {getIcon(item.category)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{item.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{item.content}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      {item.state && (
                        <Badge variant="outline" className="text-xs">
                          {item.state}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No recent updates available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
