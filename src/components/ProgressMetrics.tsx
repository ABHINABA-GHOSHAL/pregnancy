
import React from "react";
import { useApp } from "@/contexts/AppContext";
import { calculateGestationalAge, getTrimester, daysUntilDueDate } from "@/lib/utils";

interface ProgressMetricsProps {
  showTitle?: boolean;
}

const ProgressMetrics: React.FC<ProgressMetricsProps> = ({ showTitle = false }) => {
  const { patientData } = useApp();
  
  if (!patientData.lmp || !patientData.dueDate) return null;
  
  const lmpDate = new Date(patientData.lmp);
  const dueDate = new Date(patientData.dueDate);
  
  const { weeks, days } = calculateGestationalAge(lmpDate);
  const trimester = getTrimester(lmpDate);
  const daysRemaining = daysUntilDueDate(dueDate);
  
  return (
    <div className="w-full">
      {showTitle && (
        <h2 className="text-xl font-semibold mb-4">Pregnancy Progress</h2>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-5 rounded-xl shadow-sm">
          <h3 className="text-center text-lg font-medium text-materna-400 mb-3">
            Current Gestational Age
          </h3>
          <p className="text-center text-xl font-semibold text-gray-700">
            {weeks} weeks, {days} days
          </p>
        </div>
        
        <div className="bg-green-50 p-5 rounded-xl shadow-sm">
          <h3 className="text-center text-lg font-medium text-materna-400 mb-3">
            Trimester
          </h3>
          <p className="text-center text-xl font-semibold text-gray-700">
            {trimester}
          </p>
        </div>
        
        <div className="bg-red-50 p-5 rounded-xl shadow-sm">
          <h3 className="text-center text-lg font-medium text-materna-400 mb-3">
            Days Until Due Date
          </h3>
          <p className="text-center text-xl font-semibold text-gray-700">
            {daysRemaining}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgressMetrics;
