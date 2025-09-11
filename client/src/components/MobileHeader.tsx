import LanguageSwitcher from "./LanguageSwitcher";

interface MobileHeaderProps {
  user: any;
  safetyScore: number;
}

export default function MobileHeader({ user, safetyScore }: MobileHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <i className="fas fa-shield-alt text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold">Tourist Safety</h1>
            <p className="text-xs opacity-90">Northeast India</p>
          </div>
        </div>
        <LanguageSwitcher />
      </div>
      
      {/* Safety Status Banner */}
      <div className="bg-white bg-opacity-10 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Status: Safe Zone</span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">{safetyScore}%</div>
            <div className="text-xs opacity-75">Safety Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}
