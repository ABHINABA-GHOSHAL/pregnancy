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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showNavigation && (
        <Navigation className="w-full h-16 fixed top-0 left-0 z-10" />
      )}
      <main 
        className={cn(
          "flex-1 transition-all",
          showNavigation ? "mt-16" : "mt-0",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;