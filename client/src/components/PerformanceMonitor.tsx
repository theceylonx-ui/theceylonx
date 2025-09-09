import { useState } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Clock, Database, Zap } from 'lucide-react';

// 🚀 PHASE 3 PERFORMANCE: Performance monitoring dashboard component
export const PerformanceMonitor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { metrics, cacheStats, getPerformanceScore } = usePerformanceMonitor();
  const scores = getPerformanceScore();

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  if (!isVisible) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-white/80 backdrop-blur-sm"
        data-testid="perf-monitor-toggle"
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Performance
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 bg-white/95 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm">Performance Monitor</CardTitle>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
        <CardDescription className="text-xs">
          Real-time performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3 text-blue-500" />
            <span>Load Time</span>
            <Badge className={`text-xs ${getScoreColor(scores.loadTime)}`}>
              {(metrics.loadTime / 1000).toFixed(1)}s
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Database className="h-3 w-3 text-green-500" />
            <span>Cache Hit</span>
            <Badge className={`text-xs ${getScoreColor(scores.cache)}`}>
              {metrics.cacheHitRate.toFixed(0)}%
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Zap className="h-3 w-3 text-purple-500" />
            <span>Memory</span>
            <Badge className={`text-xs ${getScoreColor(scores.memory)}`}>
              {metrics.memoryUsage}MB
            </Badge>
          </div>
          
          {cacheStats ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs">Server Cache</span>
              <Badge variant="outline" className="text-xs">
                {(cacheStats as any).size || 0} items
              </Badge>
            </div>
          ) : null}
        </div>
        
        {cacheStats ? (
          <div className="pt-2 border-t text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Cache Performance:</span>
              <span className="font-medium text-green-600">{(cacheStats as any).performance || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Hits/Misses:</span>
              <span>{(cacheStats as any).hits || 0}/{(cacheStats as any).misses || 0}</span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};