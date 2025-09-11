import { Card } from "@/components/ui/card";

interface DigitalIDCardProps {
  tourist: any;
}

export default function DigitalIDCard({ tourist }: DigitalIDCardProps) {
  return (
    <Card className="rounded-2xl p-4 shadow-sm border border-green-200">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
          {/* QR Code placeholder */}
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <div className="grid grid-cols-4 gap-px">
              {[...Array(16)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-1 h-1 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">{tourist.fullName}</div>
          <div className="text-xs text-muted-foreground">ID: {tourist.digitalId}</div>
          <div className="text-xs text-green-600 font-medium mt-1">✓ Verified Tourist</div>
          <div className="text-xs text-muted-foreground">
            Valid until {new Date(tourist.validUntil).toLocaleDateString()}
          </div>
        </div>
      </div>
    </Card>
  );
}
