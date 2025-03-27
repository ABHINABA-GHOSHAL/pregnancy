import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { toast } from "@/hooks/use-toast";
import { uploadFile, calculatePregnancyProgress } from "@/lib/utils";
import { analyzeReport } from "@/utils/reportAnalysis";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProgressMetrics from "@/components/ProgressMetrics";
import { FileUp, Upload, AlertTriangle, Check, Info } from "lucide-react";
import MultiFileUploader, { ReportFile } from "@/components/MultiFileUploader";

// Component to display analysis results with specific handling for blood type, HIV, and hepatitis
const AnalysisDisplay = ({ result }) => {
  if (!result) return null;

  // Helper function to display a specific test result
  const displaySpecificResult = (testName, label) => {
    const testResult = result.all_results.find((r) => r.test_name === testName);
    if (testResult) {
      return (
        <p>
          {label}: {testResult.result_value}{" "}
          {testResult.ref_range_text && `(Reference: ${testResult.ref_range_text}, Risk Level: ${testResult.risk_level})`}
        </p>
      );
    }
    return null;
  };

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded">
      <h4 className="font-semibold">Analysis Results</h4>
      {/* Display specific results for blood type */}
      {result.report_type === "blood-type" && (
        <div>
          {displaySpecificResult("Blood Group", "Blood Group")}
          {displaySpecificResult("Rh Factor", "Rh Factor")}
        </div>
      )}
      {/* Display specific result for HIV */}
      {result.report_type === "hiv" && displaySpecificResult("HIV Result", "HIV Result")}
      {/* Display specific result for Hepatitis B */}
      {result.report_type === "hepb" && displaySpecificResult("Hepatitis B Result", "Hepatitis B Result")}
      {/* General summary for all reports */}
      <p>Total Tests: {result.total_tests}</p>
      <p>Normal Results: {result.normal_results}</p>
      <p>Borderline Results: {result.borderline_results}</p>
      <p>High Risk Results: {result.high_risk_results}</p>
      {result.risk_factors.length > 0 && (
        <div>
          <h5 className="font-medium mt-2">Risk Factors:</h5>
          <ul className="list-disc pl-5">
            {result.risk_factors.map((factor, index) => (
              <li key={index}>
                {factor.test_name}: {factor.result_value} {factor.result_unit}{" "}
                (Reference: {factor.reference_range}, Risk Level: {factor.risk_level})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Component for individual report upload and analysis
const ReportUploadSection = ({ reportType, title, category, reportTypeOptions }) => {
  const { patientData, addMedicalReport } = useApp();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(reportType || "");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to analyze.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedReportType && reportTypeOptions) {
      toast({
        title: "No report type selected",
        description: "Please select a report type.",
        variant: "destructive",
      });
      return;
    }
    setAnalyzing(true);
    try {
      const fileUrl = await uploadFile(file);
      const analysis = await analyzeReport(
        file,
        selectedReportType || reportType,
        patientData.id,
        date
      );
      if (analysis.status === "success") {
        const newReport = {
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: selectedReportType || reportType,
          category,
          date,
          fileUrl,
          notes,
          analysisResults: analysis,
        };
        addMedicalReport(newReport);
        setAnalysisResult(analysis);
        toast({
          title: "Analysis complete",
          description: "Report has been analyzed successfully.",
        });
      } else {
        toast({
          title: "Analysis failed",
          description: analysis.message || "Failed to analyze the report.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while analyzing the report.",
        variant: "destructive",
      });
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {reportTypeOptions && (
        <div className="mb-4">
          <Label htmlFor="report-type">Report Type</Label>
          <Select value={selectedReportType} onValueChange={setSelectedReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select Report Type" />
            </SelectTrigger>
            <SelectContent>
              {reportTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="mb-4">
        <Label htmlFor={`${title}-date`}>Report Date</Label>
        <Input
          id={`${title}-date`}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <Label htmlFor={`${title}-file`}>Upload File</Label>
        <Input
          id={`${title}-file`}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
        />
      </div>
      <div className="mb-4">
        <Label htmlFor={`${title}-notes`}>Notes</Label>
        <Textarea
          id={`${title}-notes`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes..."
        />
      </div>
      <Button
        onClick={handleAnalyze}
        disabled={analyzing || !file}
        className="w-full"
      >
        {analyzing ? "Analyzing..." : "Analyze Report"}
      </Button>
      {analysisResult && <AnalysisDisplay result={analysisResult} />}
    </div>
  );
};

const UploadReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isRegistered,
    patientData,
    medicalReports,
    addMedicalReport,
    getCategoryReportCount,
  } = useApp();

  const [activeTab, setActiveTab] = useState("blood");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [reportType, setReportType] = useState("cbc");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<ReportFile[]>([]);

  // Map tab name to category
  const categoryMap: Record<string, string> = {
    blood: "blood",
    ultrasound: "ultrasound",
    infectious: "infectious",
    thyroid: "thyroid",
    other: "other",
  };

  useEffect(() => {
    if (!isRegistered) {
      navigate("/register");
    }
  }, [isRegistered, navigate]);

  // Clear selected files and set default report type when changing tabs
  useEffect(() => {
    setSelectedFiles([]);
    const defaultReportTypes: Record<string, string> = {
      blood: "cbc",
      ultrasound: "dating",
      infectious: "hiv",
      thyroid: "tsh",
      other: "custom",
    };
    setReportType(defaultReportTypes[activeTab] || "custom");
  }, [activeTab]);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const currentCategory = categoryMap[activeTab];
      const promises = selectedFiles.map(async (selectedFile) => {
        const fileUrl = await uploadFile(selectedFile.file);

        const newReport = {
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: reportType,
          category: currentCategory,
          date: reportDate,
          fileUrl,
          notes,
        };

        return addMedicalReport(newReport);
      });

      const results = await Promise.all(promises);
      const successCount = results.filter((result) => result).length;

      if (successCount > 0) {
        toast({
          title: "Upload successful",
          description: `${successCount} report(s) have been uploaded successfully.`,
        });
      }

      if (successCount < selectedFiles.length) {
        toast({
          title: "Some uploads skipped",
          description: "Some reports were not uploaded due to category limits.",
          variant: "destructive",
        });
      }

      setSelectedFiles([]);
      setNotes("");
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your reports. Please try again.",
        variant: "destructive",
      });
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0 || !patientData.id) {
      toast({
        title: "Cannot analyze report",
        description: "Please select at least one file and ensure your patient information is complete.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);

    try {
      const currentCategory = categoryMap[activeTab];
      let successCount = 0;
      let highRiskCount = 0;
      let borderlineCount = 0;

      for (const selectedFile of selectedFiles) {
        const analysisResults = await analyzeReport(
          selectedFile.file,
          reportType,
          patientData.id || "unknown",
          reportDate
        );

        if (analysisResults.status === "error") {
          toast({
            title: "Analysis failed",
            description: analysisResults.message || `Failed to analyze ${selectedFile.file.name}`,
            variant: "destructive",
          });
          continue;
        }

        highRiskCount += analysisResults.high_risk_results || 0;
        borderlineCount += analysisResults.borderline_results || 0;

        const fileUrl = await uploadFile(selectedFile.file);

        const newReport = {
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: reportType,
          category: currentCategory,
          date: reportDate,
          fileUrl,
          notes,
          analysisResults,
        };

        const added = addMedicalReport(newReport);
        if (added) successCount++;
      }

      if (successCount > 0) {
        if (highRiskCount > 0) {
          toast({
            title: "High Risk Factors Detected",
            description: `Found ${highRiskCount} high risk factors in your reports.`,
            variant: "destructive",
          });
        } else if (borderlineCount > 0) {
          toast({
            title: "Borderline Results Detected",
            description: `Found ${borderlineCount} borderline results in your reports.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Analysis Complete",
            description: "No risk factors detected in your reports. Everything looks normal.",
            variant: "default",
          });
        }

        setSelectedFiles([]);
        setNotes("");
        navigate("/view-reports");
      } else {
        toast({
          title: "No reports processed",
          description: "No reports could be processed. Please check category limits.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your reports. Please try again.",
        variant: "destructive",
      });
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getUsedSlots = () => {
    return getCategoryReportCount(categoryMap[activeTab]);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-6">Upload Medical Reports</h1>

        <Card className="mb-8">
          <CardHeader className="bg-blue-50 rounded-t-lg">
            <CardTitle className="text-xl">
              Patient: {patientData.firstName} {patientData.lastName}
            </CardTitle>
            <CardDescription>ID: {patientData.id}</CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <ProgressMetrics />
          </CardContent>
        </Card>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Pregnancy Timeline</h2>
          <Progress
            progress={
              patientData.lmp
                ? calculatePregnancyProgress(new Date(patientData.lmp))
                : 0
            }
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="blood">Blood Tests</TabsTrigger>
            <TabsTrigger value="ultrasound">Ultrasound Reports</TabsTrigger>
            <TabsTrigger value="infectious">Infectious Disease Screening</TabsTrigger>
            <TabsTrigger value="thyroid">Thyroid & Genetic Tests</TabsTrigger>
            <TabsTrigger value="other">Other Reports</TabsTrigger>
          </TabsList>

          {/* Blood Tests Tab */}
          <TabsContent value="blood">
            <h2 className="text-lg font-semibold mb-6">Blood Test Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ReportUploadSection
                reportType="cbc"
                title="Blood CBC Report"
                category="blood"
                reportTypeOptions={[
                  { value: "cbc", label: "Complete Blood Count (CBC)" },
                  { value: "hemoglobin", label: "Hemoglobin Test" },
                  { value: "platelet", label: "Platelet Count" },
                ]}
              />
              <ReportUploadSection
                reportType="blood-type"
                title="Blood Typing Report"
                category="blood"
                reportTypeOptions={[{ value: "blood-type", label: "Blood Typing" }]}
              />
              <ReportUploadSection
                reportType="glucose"
                title="Glucose Fasting Report"
                category="blood"
                reportTypeOptions={[{ value: "glucose", label: "Glucose Fasting Test" }]}
              />
            </div>
          </TabsContent>

          {/* Ultrasound Reports Tab */}
          <TabsContent value="ultrasound">
            <h2 className="text-lg font-semibold mb-6">Ultrasound Reports</h2>
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label htmlFor="ultrasound-type">Ultrasound Type</Label>
                <Select
                  value={reportType}
                  onValueChange={(value) => setReportType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Ultrasound Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dating">Dating Scan</SelectItem>
                    <SelectItem value="anatomy">Anatomy Scan</SelectItem>
                    <SelectItem value="growth">Growth Scan</SelectItem>
                    <SelectItem value="doppler">Doppler Ultrasound</SelectItem>
                    <SelectItem value="3d-4d">3D/4D Ultrasound</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <MultiFileUploader
                selectedFiles={selectedFiles}
                onFilesChange={setSelectedFiles}
                maxFiles={3}
                category="ultrasound"
                usedSlots={getUsedSlots()}
              />

              <div className="space-y-3">
                <Label htmlFor="test-date">Scan Date</Label>
                <Input
                  id="test-date"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="gestational-age">Gestational Age at Scan (weeks)</Label>
                <Input
                  id="gestational-age"
                  type="number"
                  placeholder="e.g., 20"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this scan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || uploading || analyzing}
                  className="materna-button w-full"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <FileUp className="animate-pulse" size={18} />
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload size={18} />
                      Upload Reports
                    </span>
                  )}
                </Button>

                <Button
                  onClick={handleAnalyze}
                  disabled={selectedFiles.length === 0 || uploading || analyzing}
                  variant="outline"
                  className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  {analyzing ? (
                    <span className="flex items-center gap-2">
                      <FileUp className="animate-pulse" size={18} />
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <AlertTriangle size={18} />
                      Analyze for Risks
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Infectious Disease Screening Tab */}
          <TabsContent value="infectious">
            <h2 className="text-lg font-semibold mb-6">Infectious Disease Screening</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ReportUploadSection
                reportType="hiv"
                title="HIV/AIDS Report"
                category="infectious"
                reportTypeOptions={[
                  { value: "hiv", label: "HIV/AIDS Test" },
                  { value: "hep-c", label: "Hepatitis C Test" },
                  { value: "hepb", label: "Hepatitis B Test" },
                ]}
              />
              <ReportUploadSection
                reportType="hepb"
                title="Hepatitis B Report"
                category="infectious"
                reportTypeOptions={[
                  { value: "hiv", label: "HIV/AIDS Test" },
                  { value: "hep-c", label: "Hepatitis C Test" },
                  { value: "hepb", label: "Hepatitis B Test" },
                ]}
              />
            </div>
          </TabsContent>

          {/* Thyroid & Genetic Tests Tab */}
          <TabsContent value="thyroid">
            <h2 className="text-lg font-semibold mb-6">Thyroid & Genetic Tests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ReportUploadSection
                reportType="tsh"
                title="TSH Report"
                category="thyroid"
                reportTypeOptions={[
                  { value: "tsh", label: "Thyroid-Stimulating Hormone (TSH)" },
                  { value: "t4", label: "Thyroxine (T4)" },
                  { value: "t3", label: "Triiodothyronine (T3)" },
                ]}
              />
              <ReportUploadSection
                reportType="nips"
                title="Genetic Test Report (Optional)"
                category="thyroid"
                reportTypeOptions={[
                  { value: "nips", label: "Non-Invasive Prenatal Screening (NIPS)" },
                  { value: "nipt", label: "Non-Invasive Prenatal Testing (NIPT)" },
                  { value: "cfdna", label: "Cell-Free DNA Screening" },
                  { value: "carrier", label: "Carrier Screening" },
                  { value: "amnio", label: "Amniocentesis Results" },
                  { value: "cvs", label: "Chorionic Villus Sampling (CVS) Results" },
                ]}
              />
            </div>
          </TabsContent>

          {/* Other Reports Tab */}
          <TabsContent value="other">
            <h2 className="text-lg font-semibold mb-6">Other Reports</h2>
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label htmlFor="other-report-type">Report Type</Label>
                <Input
                  id="other-report-type"
                  placeholder="Enter report type..."
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                />
              </div>

              <MultiFileUploader
                selectedFiles={selectedFiles}
                onFilesChange={setSelectedFiles}
                maxFiles={3}
                category="other"
                usedSlots={getUsedSlots()}
              />

              <div className="space-y-3">
                <Label htmlFor="report-date">Report Date</Label>
                <Input
                  id="report-date"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this report..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || uploading || analyzing}
                  className="materna-button w-full"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <FileUp className="animate-pulse" size={18} />
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload size={18} />
                      Upload Reports
                    </span>
                  )}
                </Button>

                <Button
                  onClick={handleAnalyze}
                  disabled={selectedFiles.length === 0 || uploading || analyzing}
                  variant="outline"
                  className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  {analyzing ? (
                    <span className="flex items-center gap-2">
                      <FileUp className="animate-pulse" size={18} />
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <AlertTriangle size={18} />
                      Analyze for Risks
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// Helper Component for Pregnancy Progress
const Progress: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-in-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default UploadReportsPage;