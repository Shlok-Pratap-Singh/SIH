import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SafetyMapProps {
  preview?: boolean;
}

export default function SafetyMap({ preview = false }: SafetyMapProps) {
  const height = preview ? "h-48" : "h-96";

  return (
    <Card className="shadow-sm">
      <CardHeader className={preview ? "pb-3" : undefined}>
        <CardTitle className={preview ? "text-base" : "text-lg"}>
          {preview ? "Area Safety Overview" : "Northeast India Safety Map"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Map placeholder with color-coded zones */}
          <div className={`w-full ${height} bg-gradient-to-b from-green-100 to-green-200 rounded-lg relative overflow-hidden`}>
            {/* Safe zones (green) */}
            <div className="absolute top-4 left-4 w-16 h-16 bg-green-400 rounded-full opacity-75"></div>
            <div className="absolute top-8 right-6 w-12 h-12 bg-green-500 rounded-full opacity-75"></div>
            
            {/* Moderate zones (yellow) */}
            <div className="absolute bottom-8 left-8 w-20 h-10 bg-yellow-400 rounded-full opacity-75"></div>
            
            {/* Current location marker */}
            <div className="absolute top-12 left-20 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            
            {/* Forest zones (dark green) */}
            <div className="absolute bottom-4 right-4 w-14 h-14 bg-green-700 rounded-lg opacity-75"></div>
            
            {/* Restricted zones (grey) */}
            {!preview && (
              <div className="absolute top-16 right-8 w-18 h-12 bg-gray-400 rounded-lg opacity-75"></div>
            )}
          </div>
          
          {/* Legend */}
          <div className="flex justify-center mt-3 space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Safe</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Moderate</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Risk</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-800 rounded-full"></div>
              <span>Forest</span>
            </div>
            {!preview && (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span>Restricted</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
