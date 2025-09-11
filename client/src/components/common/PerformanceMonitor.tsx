// 🚀 PERFORMANCE: Performance monitoring dashboard component
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Info, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { usePerformanceMonitoring, useResourceMonitoring, useComponentPerformance } from '@/hooks/usePerformanceMonitoring';

interface PerformanceMonitorProps {
  showDetails?: boolean;
  onlyViolations?: boolean;
  className?: string;
}

export function PerformanceMonitor({ 
  showDetails = false, 
  onlyViolations = false,
  className 
}: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(!onlyViolations);
  const { 
    metrics, 
    violations, 
    performanceScore, 
    collectMetrics 
  } = usePerformanceMonitoring();
  const { resourceMetrics } = useResourceMonitoring();
  const componentPerf = useComponentPerformance('PerformanceMonitor');

  // Only show if there are violations when onlyViolations is true
  if (onlyViolations && violations.length === 0) {
    return null;
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Eye className="w-4 h-4 mr-2" />
        Show Performance
      </Button>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatBytes = (bytes: number) => {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)}MB` : `${kb.toFixed(1)}KB`;
  };

  const formatTime = (ms: number) => {
    return ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms.toFixed(0)}ms`;
  };

  return (
    <Card className={`fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Performance Monitor</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getScoreColor(performanceScore)}>
              Score: {performanceScore}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => collectMetrics()}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 p-0"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {violations.length > 0 && (
          <CardDescription className="text-red-600">
            {violations.length} performance budget violation{violations.length > 1 ? 's' : ''}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Performance Violations */}
        {violations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Budget Violations
            </h4>
            {violations.map((violation, index) => (
              <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {violation}
              </div>
            ))}
          </div>
        )}

        {/* Core Web Vitals */}
        {metrics && showDetails && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Core Web Vitals</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs">Load Time</span>
                <span className="text-xs font-mono">{formatTime(metrics.loadTime)}</span>
              </div>
              <Progress value={(3000 - metrics.loadTime) / 30} className="h-1" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs">First Contentful Paint</span>
                <span className="text-xs font-mono">{formatTime(metrics.firstContentfulPaint)}</span>
              </div>
              <Progress value={(1500 - metrics.firstContentfulPaint) / 15} className="h-1" />
            </div>

            {metrics.largestContentfulPaint && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Largest Contentful Paint</span>
                  <span className="text-xs font-mono">{formatTime(metrics.largestContentfulPaint)}</span>
                </div>
                <Progress value={(2500 - metrics.largestContentfulPaint) / 25} className="h-1" />
              </div>
            )}

            {metrics.cumulativeLayoutShift && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Cumulative Layout Shift</span>
                  <span className="text-xs font-mono">{metrics.cumulativeLayoutShift.toFixed(3)}</span>
                </div>
                <Progress value={(0.1 - metrics.cumulativeLayoutShift) * 1000} className="h-1" />
              </div>
            )}
          </div>
        )}

        {/* Resource Metrics */}
        {resourceMetrics && showDetails && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Resource Usage</h4>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">JavaScript:</span>
                <span className="font-mono ml-1">{formatBytes(resourceMetrics.jsSize)}</span>
              </div>
              <div>
                <span className="text-gray-600">CSS:</span>
                <span className="font-mono ml-1">{formatBytes(resourceMetrics.cssSize)}</span>
              </div>
              <div>
                <span className="text-gray-600">Images:</span>
                <span className="font-mono ml-1">{formatBytes(resourceMetrics.imageSize)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>
                <span className="font-mono ml-1">{formatBytes(resourceMetrics.totalSize)}</span>
              </div>
            </div>

            <div className="text-xs text-gray-600">
              {resourceMetrics.resourceCount} resources loaded
            </div>
          </div>
        )}

        {/* Network Information */}
        {metrics?.connectionType && showDetails && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Network</h4>
            <div className="text-xs space-y-1">
              <div>Type: {metrics.connectionType}</div>
              {metrics.effectiveType && <div>Speed: {metrics.effectiveType}</div>}
              {metrics.downlink && <div>Downlink: {metrics.downlink} Mbps</div>}
              {metrics.rtt && <div>RTT: {metrics.rtt}ms</div>}
            </div>
          </div>
        )}

        {/* Memory Usage */}
        {metrics?.memoryUsage && showDetails && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Memory Usage</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Used:</span>
                <span className="font-mono">{formatBytes(metrics.memoryUsage.usedJSHeapSize)}</span>
              </div>
              <Progress 
                value={(metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.totalJSHeapSize) * 100} 
                className="h-1" 
              />
            </div>
          </div>
        )}

        {/* Success State */}
        {violations.length === 0 && metrics && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            All performance budgets met
          </div>
        )}

        {/* Component Performance */}
        {process.env.NODE_ENV === 'development' && showDetails && (
          <div className="border-t pt-2">
            <h5 className="text-xs font-medium text-gray-600">Component Stats</h5>
            <div className="text-xs text-gray-500">
              Renders: {componentPerf.renderCount} | 
              Avg: {componentPerf.averageRenderTime.toFixed(1)}ms
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Lightweight performance indicator for production
export function PerformanceIndicator() {
  const { performanceScore, violations } = usePerformanceMonitoring();
  
  if (process.env.NODE_ENV !== 'development' && violations.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Badge 
        variant={violations.length > 0 ? "destructive" : "default"}
        className="text-xs"
      >
        {violations.length > 0 ? (
          <>
            <AlertTriangle className="w-3 h-3 mr-1" />
            {violations.length} issues
          </>
        ) : (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Score: {performanceScore}
          </>
        )}
      </Badge>
    </div>
  );
}