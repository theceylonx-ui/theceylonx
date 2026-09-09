import { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TipsBoxProps {
  title: string;
  tips: string[];
  className?: string;
  defaultCollapsed?: boolean;
}

export function TipsBox({ title, tips, className = "", defaultCollapsed = true }: TipsBoxProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <Card className={`bg-gradient-to-br from-brand-subtle to-accent-subtle border-2 border-brand/20 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`} data-testid="tips-box">
      <CardHeader
        className="pb-3 cursor-pointer hover:bg-white/40 transition-colors duration-200 rounded-t-lg"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent flex items-center gap-3">
            <div className="relative">
              <Lightbulb className="h-6 w-6 text-brand" />
              <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 rounded-full bg-brand-subtle hover:bg-brand/20 border-2 border-brand/30 hover:scale-110 transition-all duration-200"
            data-testid="tips-toggle"
          >
            {isCollapsed ?
              <ChevronDown className="h-5 w-5 text-brand" /> :
              <ChevronUp className="h-5 w-5 text-brand" />
            }
          </Button>
        </div>
        <p className="text-sm text-text-secondary opacity-80 mt-1">Click to {isCollapsed ? 'reveal' : 'hide'} helpful tips!</p>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm">
            <ul className="space-y-4" data-testid="tips-list">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-brand to-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                  <span className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: tip }} />
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}