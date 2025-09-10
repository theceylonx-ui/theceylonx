import { cn } from "@/lib/utils";

interface NeonBadgeProps {
  className?: string;
  text?: string;
}

export function NeonBadge({ className, text = "SAMPLE" }: NeonBadgeProps) {
  return (
    <div className={cn("inline-flex items-center", className)}>
      <div className="relative">
        {/* Animated neon glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full blur-sm opacity-70 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 rounded-full blur-xs opacity-50 animate-pulse delay-75"></div>
        
        {/* Main badge */}
        <div className="relative px-3 py-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-full border border-purple-400/50 shadow-lg">
          <span className="text-xs font-bold text-white tracking-wider drop-shadow-lg animate-pulse">
            {text}
          </span>
        </div>
      </div>
      
      <style>
        {`
          @keyframes neon-flicker {
            0%, 100% {
              text-shadow: 
                0 0 5px #fff,
                0 0 10px #fff,
                0 0 15px #fff,
                0 0 20px #ff00de,
                0 0 35px #ff00de,
                0 0 40px #ff00de;
            }
            50% {
              text-shadow: 
                0 0 2px #fff,
                0 0 5px #fff,
                0 0 8px #fff,
                0 0 12px #ff00de,
                0 0 18px #ff00de,
                0 0 25px #ff00de;
            }
          }
        `}
      </style>
    </div>
  );
}