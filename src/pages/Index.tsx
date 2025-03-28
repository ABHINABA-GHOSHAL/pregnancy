import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import FeatureCard from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileText, Stethoscope } from "lucide-react";

const HomePage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center space-y-4"
            >
              <div className="space-y-2">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-materna-700 to-materna-400"
                >
                  Materna
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400"
                >
                  Advanced pregnancy health monitoring with intelligent risk assessment and personalized guidance
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col gap-2 min-[400px]:flex-row"
              >
                <Link to="/login">
                  <Button className="materna-button">
                    Login
                  </Button>
                </Link>
                <Link to="/book-appointment">
                  <Button variant="outline" className="border-2 border-materna-200 hover:bg-materna-50">
                    Book Appointment
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center justify-center"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-materna-100 to-materna-50 p-6 shadow-lg">
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                </div>
                <div className="relative z-10 h-full w-full rounded-lg bg-white/95 p-6 shadow-md">
                  <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">Smart Pregnancy Monitoring</h2>
                      <p className="text-sm text-gray-500">
                        Providing you with intelligent health insights and personalized care recommendations throughout your pregnancy journey
                      </p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="text-materna-500">15+</div>
                        <div className="text-xs text-gray-500">Risk parameters analyzed</div>
                      </div>
                      <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="text-materna-500">24/7</div>
                        <div className="text-xs text-gray-500">Offline access</div>
                      </div>
                      <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="text-materna-500">100%</div>
                        <div className="text-xs text-gray-500">Privacy focused</div>
                      </div>
                      <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="text-materna-500">Local</div>
                        <div className="text-xs text-gray-500">Data storage & syncing</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center space-y-4 text-center"
          >
            <motion.h2 
              variants={itemVariants} 
              className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
            >
              Advanced Features for Your Pregnancy Journey
            </motion.h2>
            <motion.p 
              variants={itemVariants} 
              className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400"
            >
              Our comprehensive system delivers personalized guidance and risk assessment to ensure a healthy pregnancy
            </motion.p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <motion.div variants={itemVariants}>
              <FeatureCard
                title="Risk Stratification Engine"
                description="Analyzes 15+ parameters and flags high-risk pregnancies for proactive care"
                icon={<AlertTriangle className="w-8 h-8" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <FeatureCard
                title="Actionable Guidance System"
                description="Generates localized advice and provides step-by-step protocols for identified risks"
                icon={<Stethoscope className="w-8 h-8" />}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <FeatureCard
                title="Offline-First Design"
                description="Functions with limited internet connectivity using local data storage and syncing"
                icon={<FileText className="w-8 h-8" />}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-materna-50 to-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="space-y-2"
            >
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Begin Your Prenatal Care Journey
              </h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Login to access personalized care guidance and track your pregnancy health.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col gap-2 min-[400px]:flex-row"
            >
              <Link to="/login">
                <Button className="materna-button">
                  Login Now
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="text-gray-500">
              <p className="text-sm">© 2023 Materna. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;