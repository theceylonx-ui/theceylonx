// 🚀 PERFORMANCE: Optimized icon imports to reduce bundle size
// Instead of importing individual icons throughout the app, we centralize and tree-shake
import { useState, useEffect } from 'react';

// Core UI icons used frequently
export {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  X,
  Plus,
  Minus,
  Edit,
  Trash2,
  Search,
  Filter,
  Settings,
  MoreHorizontal,
  MoreVertical,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Download,
  Upload,
  Share2,
  Bell,
  Menu,
  User,
  Users,
  Home,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  RefreshCw,
  Loader2,
  Heart,
  Star,
  Bookmark,
  Send,
  MessageSquare,
  Image as ImageIcon,
  Camera,
  Video,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  StopCircle as Stop,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Zap,
  Shield,
  Globe,
  Link,
  Link2Off as LinkOff
} from 'lucide-react';

// Admin-specific icons (lazy loaded)
export const AdminIcons = {
  // Only load these when admin pages are accessed
  async Brain() { return (await import('lucide-react')).Brain; },
  async TrendingUp() { return (await import('lucide-react')).TrendingUp; },
  async BarChart3() { return (await import('lucide-react')).BarChart3; },
  async Target() { return (await import('lucide-react')).Target; },
  async Flag() { return (await import('lucide-react')).Flag; },
  async Crown() { return (await import('lucide-react')).Crown; },
  async UserCheck() { return (await import('lucide-react')).UserCheck; },
  async UserX() { return (await import('lucide-react')).UserX; },
  async Ban() { return (await import('lucide-react')).Ban; },
  async Activity() { return (await import('lucide-react')).Activity; },
  async Book() { return (await import('lucide-react')).Book; },
  async Code() { return (await import('lucide-react')).Code; },
  async Database() { return (await import('lucide-react')).Database; }
};

// Travel-specific icons (lazy loaded)
export const TravelIcons = {
  async Mountain() { return (await import('lucide-react')).Mountain; },
  async Waves() { return (await import('lucide-react')).Waves; },
  async Sun() { return (await import('lucide-react')).Sun; },
  async TreePine() { return (await import('lucide-react')).TreePine; },
  async Compass() { return (await import('lucide-react')).Compass; },
  async Plane() { return (await import('lucide-react')).Plane; },
  async Car() { return (await import('lucide-react')).Car; },
  async Coffee() { return (await import('lucide-react')).Coffee; },
  async Sparkles() { return (await import('lucide-react')).Sparkles; },
  async Snowflake() { return (await import('lucide-react')).Snowflake; }
};

// Icon component factory for better performance
export function createLazyIcon(iconLoader: () => Promise<any>) {
  return function LazyIcon(props: any) {
    const [IconComponent, setIconComponent] = useState<any>(null);
    
    useEffect(() => {
      iconLoader().then(setIconComponent);
    }, []);
    
    if (!IconComponent) {
      // Return a placeholder while loading
      return <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" {...props} />;
    }
    
    return <IconComponent {...props} />;
  };
}

// Performance: Icon size variants for consistent usage
export const iconSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4", 
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
  "2xl": "w-10 h-10"
} as const;

// Common icon props for consistency
export const iconProps = {
  small: { className: iconSizes.sm },
  medium: { className: iconSizes.md },
  large: { className: iconSizes.lg }
} as const;