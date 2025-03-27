
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-materna-500">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800">Page not found</h2>
          <p className="text-gray-600 mt-4">
            We couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
          </p>
        </div>
        
        <div className="pt-4">
          <Link to="/">
            <Button className="materna-button inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
