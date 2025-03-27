
import React from "react";
import Navigation from "./Navigation";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showNavigation = true,
  className
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {showNavigation && (
        <Navigation className="w-64 min-w-64 h-screen overflow-y-auto fixed left-0 top-0" />
      )}
      <main 
        className={cn(
          "flex-1 transition-all",
          showNavigation ? "ml-64" : "ml-0",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
