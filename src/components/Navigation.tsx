
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { Home, ArrowLeft, User, Upload, FileText, Clipboard, LayoutDashboard } from "lucide-react";

interface NavigationProps {
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const location = useLocation();
  const { isRegistered, questionnaireCompleted } = useApp();

  const navItems = [
    { 
      name: "Registration", 
      path: "/register", 
      enabled: true, 
      icon: <User size={16} className="mr-2" /> 
    },
    { 
      name: "Upload Reports", 
      path: "/upload-reports", 
      enabled: isRegistered,
      icon: <Upload size={16} className="mr-2" /> 
    },
    { 
      name: "Health Questionnaire", 
      path: "/questionnaire", 
      enabled: isRegistered,
      icon: <Clipboard size={16} className="mr-2" /> 
    },
    { 
      name: "View Reports", 
      path: "/view-reports", 
      enabled: isRegistered, 
      icon: <FileText size={16} className="mr-2" /> 
    },
    { 
      name: "Summary Dashboard", 
      path: "/dashboard", 
      enabled: isRegistered,
      icon: <LayoutDashboard size={16} className="mr-2" /> 
    }
  ];

  return (
    <div className={cn("bg-gray-50 border-r border-gray-200 p-5 flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-4">
        <Link 
          to="/" 
          className="flex items-center gap-2 hover:text-materna-700 transition-colors"
        >
          <div className="w-10 h-10 bg-materna-600 rounded-full flex items-center justify-center">
            <Home className="text-white" size={20} />
          </div>
          <span className="font-medium text-lg">Back to Home</span>
        </Link>
        
        <div className="flex items-center">
          <Link 
            to={isRegistered ? "/dashboard" : "/register"} 
            className="flex items-center gap-2 hover:text-materna-700 transition-colors"
          >
            <div className="w-10 h-10 bg-materna-100 rounded-full flex items-center justify-center">
              {isRegistered ? (
                <LayoutDashboard className="text-materna-700" size={20} />
              ) : (
                <User className="text-materna-700" size={20} />
              )}
            </div>
            <span className="font-semibold text-lg">
              {isRegistered ? "Dashboard" : "Register"}
            </span>
          </Link>
        </div>
      </div>
      
      <h2 className="text-xl font-semibold mb-2">Navigation</h2>
      {!isRegistered ? (
        <div className="text-sm bg-yellow-50 p-4 rounded-md">
          <p className="text-yellow-700 mb-2">Please register to access all features.</p>
          <Link to="/register" className="text-materna-600 font-medium hover:underline">
            Go to Registration
          </Link>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-500 mb-2">Go to</div>
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.enabled ? item.path : "#"}
                className={cn(
                  "flex items-center gap-2 rounded-md p-2 transition-colors",
                  item.path === location.pathname
                    ? "bg-materna-100 text-materna-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100",
                  !item.enabled && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
                onClick={(e) => !item.enabled && e.preventDefault()}
              >
                {item.icon}
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full border",
                      item.path === location.pathname
                        ? "bg-materna-500 border-materna-300"
                        : "bg-white border-gray-300"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 border-t border-gray-200 pt-5">
        <h3 className="text-lg font-medium mb-4">Report Analysis</h3>
        <div className="bg-blue-50 p-4 rounded-md text-sm">
          <p className="text-blue-700 mb-3">
            When you upload medical reports, the system can now:
          </p>
          <ul className="space-y-2 text-blue-600">
            <li className="flex gap-2">
              <span className="text-blue-500">•</span> 
              <span>Extract test results and reference ranges</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500">•</span> 
              <span>Compare your results to normal ranges</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500">•</span> 
              <span>Identify potential health risks</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500">•</span> 
              <span>Display recommendations based on findings</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
