import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import { Lock, User } from "lucide-react";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/login", {
        username,
        password,
      });
      const { access_token } = response.data;
      localStorage.setItem("token", access_token);

      // Check if the user has registered patient data
      try {
        await axios.get("http://localhost:5000/patient-data", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        navigate("/dashboard");
      } catch (error) {
        navigate("/register");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.response?.data.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupRedirect = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-materna-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full space-y-8"
      >
        <Card className="glass-panel shadow-xl">
          <CardHeader className="text-center">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-3xl font-bold text-materna-600">
                Welcome to Materna
              </CardTitle>
              <p className="mt-2 text-sm text-gray-500">
                Sign in to access your pregnancy health profile
              </p>
            </motion.div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <motion.div variants={itemVariants}>
                <Label htmlFor="username" className="text-materna-700">
                  Username
                </Label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-materna-400" />
                  </div>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-10 border-materna-200 focus:ring-materna-500 focus:border-materna-500"
                    placeholder="Enter your username"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Label htmlFor="password" className="text-materna-700">
                  Password
                </Label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-materna-400" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 border-materna-200 focus:ring-materna-500 focus:border-materna-500"
                    placeholder="Enter your password"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex justify-between items-center">
                <Button
                  type="submit"
                  className="materna-button w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  ) : null}
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  onClick={handleSignupRedirect}
                  className="text-materna-600 hover:text-materna-700 font-medium"
                >
                  Sign up here
                </button>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;