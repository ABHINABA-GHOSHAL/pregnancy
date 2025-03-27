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
import UltrasoundImageUploader from "@/components/UltrasoundImageUploader";

const UploadReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    isRegistered, 
    patientData, 
    medicalReports, 
    addMedicalReport, 
    getCategoryReportCount,
    setMedicalReports
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
    other: "other"
  };

  useEffect(() => {
    if (!isRegistered) {
      navigate("/register");
    }
  }, [isRegistered, navigate]);

  // Clear selected files when changing tabs
  useEffect(() => {
    setSelectedFiles([]);
    // Set default report type based on active tab
    const defaultReportTypes: Record<string, string> = {
      blood: "cbc",
      ultrasound: "dating",
      infectious: "hiv",
      thyroid: "tsh",
      other: "custom"
    };
    setReportType(defaultReportTypes[activeTab] || "custom");
  }, [activeTab]);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    
    try {
      const currentCategory = categoryMap[activeTab];
      const promises = selectedFiles.map(async (selectedFile) => {
        // In a real app, this would upload to a server
        const fileUrl = await uploadFile(selectedFile.file);
        
        // Create new report entry
        const newReport = {
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: reportType,
          category: currentCategory,
          date: reportDate,
          fileUrl,
          notes
        };
        
        // Add to context
        return addMedicalReport(newReport);
      });
      
      const results = await Promise.all(promises);
      const successCount = results.filter(result => result).length;
      
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
          variant: "destructive"
        });
      }
      
      // Clear form
      setSelectedFiles([]);
      setNotes("");
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your reports. Please try again.",
        variant: "destructive"
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
        variant: "destructive"
      });
      return;
    }
    
    setAnalyzing(true);
    
    try {
      const currentCategory = categoryMap[activeTab];
      let successCount = 0;
      let highRiskCount = 0;
      let borderlineCount = 0;
      
      // Process files one by one
      for (const selectedFile of selectedFiles) {
        // In a real app, this would call an API endpoint
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
            variant: "destructive"
          });
          continue;
        }
        
        // Update risk counts
        highRiskCount += analysisResults.high_risk_results || 0;
        borderlineCount += analysisResults.borderline_results || 0;
        
        // Create new report entry with analysis results
        const fileUrl = await uploadFile(selectedFile.file);
        
        const newReport = {
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: reportType,
          category: currentCategory,
          date: reportDate,
          fileUrl,
          notes,
          analysisResults
        };
        
        // Add to context
        const added = addMedicalReport(newReport);
        if (added) successCount++;
      }
      
      // Display appropriate toast based on success
      if (successCount > 0) {
        if (highRiskCount > 0) {
          toast({
            title: "High Risk Factors Detected",
            description: `Found ${highRiskCount} high risk factors in your reports.`,
            variant: "destructive"
          });
        } else if (borderlineCount > 0) {
          toast({
            title: "Borderline Results Detected",
            description: `Found ${borderlineCount} borderline results in your reports.`,
            variant: "default"
          });
        } else {
          toast({
            title: "Analysis Complete",
            description: "No risk factors detected in your reports. Everything looks normal.",
            variant: "default"
          });
        }
        
        // Clear form
        setSelectedFiles([]);
        setNotes("");
        
        // Navigate to view reports
        navigate("/view-reports");
      } else {
        toast({
          title: "No reports processed",
          description: "No reports could be processed. Please check category limits.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your reports. Please try again.",
        variant: "destructive"
      });
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Get used slots for the current category
  const getUsedSlots = () => {
    return getCategoryReportCount(categoryMap[activeTab]);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-6">Upload Medical Reports</h1>
        
        <Card className="mb-8">
          <CardHeader className="bg-blue-50 rounded-t-lg">
            <CardTitle className="text-xl">Patient: {patientData.firstName} {patientData.lastName}</CardTitle>
            <CardDescription>ID: {patientData.id}</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <ProgressMetrics />
          </CardContent>
        </Card>
        
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Pregnancy Timeline</h2>
          <Progress progress={patientData.lmp ? calculatePregnancyProgress(new Date(patientData.lmp)) : 0} />
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
            
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label htmlFor="blood-test-type">Test Type</Label>
                <Select
                  value={reportType}
                  onValueChange={(value) => setReportType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Test Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cbc">Complete Blood Count (CBC)</SelectItem>
                    <SelectItem value="blood-type">Blood Typing Report</SelectItem>
                    <SelectItem value="iron">Iron/Ferritin Test</SelectItem>
                    <SelectItem value="glucose">Glucose Tolerance Test</SelectItem>
                    <SelectItem value="lipid">Lipid Panel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <MultiFileUploader
                selectedFiles={selectedFiles}
                onFilesChange={setSelectedFiles}
                maxFiles={3}
                category="blood"
                usedSlots={getUsedSlots()}
              />
              
              <div className="space-y-3">
                <Label htmlFor="test-date">Test Date</Label>
                <Input
                  id="test-date"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this test..."
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
              
              <div className="bg-blue-50 p-4 rounded-md text-sm">
                <p className="text-blue-700 font-medium mb-2 flex items-center gap-2">
                  <Info size={16} />
                  What happens when you analyze a report?
                </p>
                <p className="text-blue-600 mb-2">
                  The system will extract all test parameters from your report and compare them to normal reference ranges.
                </p>
                <ul className="space-y-2 text-blue-600">
                  <li className="flex gap-2">
                    <Check size={16} className="text-green-500 shrink-0" />
                    <span>Values within normal ranges will be marked as normal</span>
                  </li>
                  <li className="flex gap-2">
                    <AlertTriangle size={16} className="text-yellow-500 shrink-0" />
                    <span>Values slightly outside normal ranges will be marked as borderline</span>
                  </li>
                  <li className="flex gap-2">
                    <AlertTriangle size={16} className="text-red-500 shrink-0" />
                    <span>Values significantly outside normal ranges will be marked as high risk</span>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          {/* Other Tabs with similar structure but different report types */}
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
              
              {/* Upload Ultrasound Report */}
              <MultiFileUploader
                selectedFiles={selectedFiles}
                onFilesChange={setSelectedFiles}
                maxFiles={3}
                category="ultrasound"
                usedSlots={getUsedSlots()}
              />

              {/* Upload Ultrasound Scan Images */}
              <div className="mt-6 mb-4">
                <h3 className="text-md font-medium mb-2">Upload Ultrasound Scan Images</h3>
                <p className="text-sm text-gray-500 mb-4">Upload images from your ultrasound scan to keep a visual record of your baby's development.</p>
                <UltrasoundImageUploader 
                  onImageUpload={(imageUrl) => {
                    // Create new ultrasound image entry
                    const newUltrasoundImage = {
                      id: `ultrasound_${Date.now()}`,
                      type: reportType,
                      date: reportDate,
                      imageUrl,
                      notes
                    };
                    
                    // Update reports in context
                    setMedicalReports([...medicalReports, {
                      ...newUltrasoundImage,
                      fileUrl: newUltrasoundImage.imageUrl,
                      category: "ultrasound" // Add the missing category property
                    }]);
                    
                    toast({
                      title: "Image uploaded",
                      description: "Your ultrasound scan image has been saved successfully."
                    });
                  }}
                />
              </div>
              
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
          
          <TabsContent value="infectious">
            <h2 className="text-lg font-semibold mb-6">Infectious Disease Screening</h2>
            
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label htmlFor="infectious-test-type">Test Type</Label>
                <Select
                  value={reportType}
                  onValueChange={(value) => setReportType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Test Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hiv">HIV Test</SelectItem>
                    <SelectItem value="hepb">Hepatitis B Test</SelectItem>
                    <SelectItem value="hepc">Hepatitis C Test</SelectItem>
                    <SelectItem value="syphilis">Syphilis Test</SelectItem>
                    <SelectItem value="gonorrhea">Gonorrhea Test</SelectItem>
                    <SelectItem value="chlamydia">Chlamydia Test</SelectItem>
                    <SelectItem value="gbs">Group B Streptococcus (GBS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <MultiFileUploader
                selectedFiles={selectedFiles}
                onFilesChange={setSelectedFiles}
                maxFiles={3}
                category="infectious"
                usedSlots={getUsedSlots()}
              />
              
              <div className="space-y-3">
                <Label htmlFor="test-date">Test Date</Label>
                <Input
                  id="test-date"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="result">Result</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="indeterminate">Indeterminate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this test..."
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
          
          <TabsContent value="thyroid">
            <h2 className="text-lg font-semibold mb-6">Thyroid & Genetic Tests</h2>
            
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label htmlFor="thyroid-test-type">Test Type</Label>
                <Select
                  value={reportType}
                  onValueChange={(value) => setReportType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Test Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tsh">Thyroid Function Test</SelectItem>
                    <SelectItem value="nips">Non-Invasive Prenatal Screening (NIPS)</SelectItem>
                    <SelectItem value="nipt">Non-Invasive Prenatal Testing (NIPT)</SelectItem>
                    <SelectItem value="cfdna">Cell-Free DNA Screening</SelectItem>
                    <SelectItem value="carrier">Carrier Screening</SelectItem>
                    <SelectItem value="amnio">Amniocentesis Results</SelectItem>
                    <SelectItem value="cvs">Chorionic Villus Sampling (CVS) Results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <MultiFileUploader
                selectedFiles={selectedFiles}
                onFilesChange={setSelectedFiles}
                maxFiles={3}
                category="thyroid"
                usedSlots={getUsedSlots()}
              />
              
              <div className="space-y-3">
                <Label htmlFor="test-date">Test Date</Label>
                <Input
                  id="test-date"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="tsh-level">TSH Level (mIU/L)</Label>
                <Input
                  id="tsh-level"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 2.5"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this test..."
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

// Helper Components
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
