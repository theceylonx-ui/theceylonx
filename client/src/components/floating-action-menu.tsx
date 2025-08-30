import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Plus, MapPin, User, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: string;
}

const actionItems: ActionItem[] = [
  {
    icon: <Plus className="h-4 w-4" />,
    label: "Post Trip",
    href: "/post",
    color: "bg-ceylon-orange hover:bg-ceylon-orange/90"
  },
  {
    icon: <Search className="h-4 w-4" />,
    label: "Browse Trips",
    href: "/browse-trips",
    color: "bg-ceylon-green hover:bg-ceylon-green/90"
  },
  {
    icon: <User className="h-4 w-4" />,
    label: "Dashboard",
    href: "/dashboard",
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    icon: <MapPin className="h-4 w-4" />,
    label: "Community",
    href: "/community",
    color: "bg-purple-500 hover:bg-purple-600"
  }
];

export function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuVariants = {
    closed: {
      scale: 0,
      opacity: 0,
      transition: {
        delay: 0.15,
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    },
    open: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    }
  };

  const itemVariants = {
    closed: {
      x: 50,
      opacity: 0,
      scale: 0.5,
    },
    open: (index: number) => ({
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        delay: index * 0.1,
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    })
  };

  const buttonVariants = {
    closed: {
      rotate: 0,
      backgroundColor: "hsl(var(--ceylon-orange))"
    },
    open: {
      rotate: 45,
      backgroundColor: "hsl(var(--destructive))"
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="floating-action-menu">
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={toggleMenu}
          />
        )}
      </AnimatePresence>

      {/* Action Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="absolute bottom-16 right-0 flex flex-col-reverse gap-3"
          >
            {actionItems.map((item, index) => (
              <motion.div
                key={item.href}
                custom={index}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.1,
                  x: -8,
                  transition: { type: "spring", stiffness: 400, damping: 25 }
                }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3"
              >
                {/* Label */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                  className="bg-white shadow-lg rounded-lg px-3 py-2 text-sm font-medium text-gray-700 whitespace-nowrap border"
                >
                  {item.label}
                </motion.div>

                {/* Action Button */}
                <Link href={item.href}>
                  <Button
                    size="lg"
                    className={`${item.color} text-white shadow-lg w-12 h-12 rounded-full hover:shadow-xl transition-all duration-200`}
                    onClick={() => setIsOpen(false)}
                    data-testid={`action-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    {item.icon}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        variants={buttonVariants}
        animate={isOpen ? "open" : "closed"}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative"
      >
        <Button
          size="lg"
          onClick={toggleMenu}
          className="w-14 h-14 rounded-full bg-ceylon-orange hover:bg-ceylon-orange/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          data-testid="fab-toggle"
        >
          <motion.div
            variants={{
              closed: { rotate: 0 },
              open: { rotate: 45 }
            }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </motion.div>
        </Button>

        {/* Ripple effect */}
        <motion.div
          initial={{ scale: 0, opacity: 0.5 }}
          animate={isOpen ? { 
            scale: [1, 2.5], 
            opacity: [0.5, 0] 
          } : { 
            scale: 0, 
            opacity: 0.5 
          }}
          transition={{ 
            duration: 0.6,
            ease: "easeOut"
          }}
          className="absolute inset-0 bg-ceylon-orange rounded-full -z-10"
        />
      </motion.div>

      {/* Tooltip for main button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="absolute top-1/2 -translate-y-1/2 right-16 bg-white shadow-lg rounded-lg px-3 py-2 text-sm font-medium text-gray-700 whitespace-nowrap border pointer-events-none"
            style={{ display: 'none' }}
          >
            Quick Actions
            <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-white border-r border-b rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}