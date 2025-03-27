import React, { createContext, useContext, useState, useEffect } from "react";

// Test result types
interface TestResult {
  test_name: string;
  result_value: string;
  result_unit?: string;
  ref_range_low?: string;
  ref_range_high?: string;
  ref_range_text?: string;
  risk_level: "normal" | "borderline" | "high_risk" | "unknown";
  direction: "high" | "low" | "normal" | "positive" | "indeterminate" | "abnormal" | "unknown";
}

// Risk factor type
interface RiskFactor {
  test_name: string;
  result_value: string;
  result_unit?: string;
  reference_range: string;
  risk_level: "borderline" | "high_risk";
  direction: string;
}

// Analysis summary type
export interface ReportAnalysisSummary {
  status: "success" | "error";
  message?: string;
  report_type?: string;
  total_tests?: number;
  normal_results?: number;
  borderline_results?: number;
  high_risk_results?: number;
  unknown_results?: number;
  risk_factors?: RiskFactor[];
  all_results?: TestResult[];
}

interface PatientData {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  dob?: string;
  lmp?: string;
  dueDate?: string;
  bloodGroup?: string;
  weight?: number;
  height?: number;
  preexistingConditions?: string[];
  gravida?: number;
  para?: number;
  preferredHospital?: string;
  primaryProvider?: string;
  preWeight?: number;
  currentWeight?: number;
  otherCondition?: string;
}

interface QuestionnaireData {
  [key: string]: any;
}

export interface MedicalReport {
  id: string;
  type: string;
  category: string;
  date: string;
  fileUrl: string;
  notes?: string;
  analysisResults?: ReportAnalysisSummary;
}

interface CategoryReportLimits {
  [category: string]: number;
  blood: number;
  ultrasound: number;
  infectious: number;
  thyroid: number;
  other: number;
}

interface AppContextType {
  isRegistered: boolean;
  setIsRegistered: (value: boolean) => void;
  patientData: PatientData;
  setPatientData: (data: PatientData) => void;
  questionnaireCompleted: boolean;
  setQuestionnaireCompleted: (value: boolean) => void;
  questionnaireData: QuestionnaireData;
  setQuestionnaireData: (data: QuestionnaireData) => void;
  medicalReports: MedicalReport[];
  setMedicalReports: (reports: MedicalReport[]) => void;
  addMedicalReport: (report: MedicalReport) => boolean;
  getCategoryReportCount: (category: string) => number;
  resetApp: () => void;
}

const initialPatientData: PatientData = {};
const initialQuestionnaireData: QuestionnaireData = {};
const REPORT_LIMITS: CategoryReportLimits = {
  blood: 3,
  ultrasound: 3,
  infectious: 3,
  thyroid: 3,
  other: 3
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [patientData, setPatientData] = useState<PatientData>(initialPatientData);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState<boolean>(false);
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData>(initialQuestionnaireData);
  const [medicalReports, setMedicalReports] = useState<MedicalReport[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedRegistration = localStorage.getItem('isRegistered');
    const storedPatientData = localStorage.getItem('patientData');
    const storedQuestionnaireCompleted = localStorage.getItem('questionnaireCompleted');
    const storedQuestionnaireData = localStorage.getItem('questionnaireData');
    const storedMedicalReports = localStorage.getItem('medicalReports');

    if (storedRegistration) setIsRegistered(JSON.parse(storedRegistration));
    if (storedPatientData) setPatientData(JSON.parse(storedPatientData));
    if (storedQuestionnaireCompleted) setQuestionnaireCompleted(JSON.parse(storedQuestionnaireCompleted));
    if (storedQuestionnaireData) setQuestionnaireData(JSON.parse(storedQuestionnaireData));
    if (storedMedicalReports) setMedicalReports(JSON.parse(storedMedicalReports));
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('isRegistered', JSON.stringify(isRegistered));
    localStorage.setItem('patientData', JSON.stringify(patientData));
    localStorage.setItem('questionnaireCompleted', JSON.stringify(questionnaireCompleted));
    localStorage.setItem('questionnaireData', JSON.stringify(questionnaireData));
    localStorage.setItem('medicalReports', JSON.stringify(medicalReports));
  }, [isRegistered, patientData, questionnaireCompleted, questionnaireData, medicalReports]);

  const addMedicalReport = (report: MedicalReport): boolean => {
    const { category } = report;
    const categoryCount = getCategoryReportCount(category);
    
    if (categoryCount >= REPORT_LIMITS[category]) {
      return false; // Limit reached
    }
    
    setMedicalReports(prev => [...prev, report]);
    return true;
  };
  
  const getCategoryReportCount = (category: string): number => {
    return medicalReports.filter(report => report.category === category).length;
  };

  const resetApp = () => {
    setIsRegistered(false);
    setPatientData(initialPatientData);
    setQuestionnaireCompleted(false);
    setQuestionnaireData(initialQuestionnaireData);
    setMedicalReports([]);
    localStorage.clear();
  };

  const value = {
    isRegistered,
    setIsRegistered,
    patientData,
    setPatientData,
    questionnaireCompleted,
    setQuestionnaireCompleted,
    questionnaireData,
    setQuestionnaireData,
    medicalReports,
    setMedicalReports,
    addMedicalReport,
    getCategoryReportCount,
    resetApp
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
