import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TipsBoxProps {
  title: string;
  tips: string[];
  className?: string;
  defaultCollapsed?: boolean;
}

export function TipsBox({ title, tips, className = "", defaultCollapsed = false }: TipsBoxProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <Card className={`bg-brand-subtle border-brand/20 ${className}`} data-testid="tips-box">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="caption font-semibold text-brand flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0 text-brand hover:bg-brand/10 rounded-lg"
            data-testid="tips-toggle"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="pt-0">
          <ul className="space-y-3" data-testid="tips-list">
            {tips.map((tip, index) => (
              <li key={index} className="caption text-text-secondary flex items-start gap-3">
                <span className="text-brand font-medium text-sm">•</span>
                <span dangerouslySetInnerHTML={{ __html: tip }} />
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}