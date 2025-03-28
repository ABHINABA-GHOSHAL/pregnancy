import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, AlertTriangle, CheckCircle, Info, ArrowUpRight, ArrowDownRight } from "lucide-react";

const ViewReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isRegistered, patientData, medicalReports } = useApp();
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!isRegistered) {
      navigate("/register");
    }
  }, [isRegistered, navigate]);

  // Filter reports based on active tab
  const filteredReports = activeTab === "all"
    ? medicalReports
    : medicalReports.filter((report) => report.category === activeTab);

  // Group reports by type
  const reportsByType = filteredReports.reduce((acc, report) => {
    const type = report.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(report);
    return acc;
  }, {} as Record<string, typeof medicalReports>);

  // Function to generate and download JSON summary
  const downloadJsonSummary = () => {
    const allTestResults = medicalReports.flatMap((report) =>
      report.analysisResults?.all_results || []
    );
    const summary = {
      patientId: patientData.id,
      patientName: `${patientData.firstName} ${patientData.lastName}`,
      allTestResults: allTestResults.map((result) => ({
        test_name: result.test_name,
        result_value: result.result_value,
        result_unit: result.result_unit,
        reference_range: result.referenceRange,
        risk_level: result.risk_level,
        direction: result.direction,
        date: medicalReports.find((r) =>
          r.analysisResults?.all_results.includes(result)
        )?.date,
      })),
      generatedAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(summary, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `patient_${patientData.id}_summary.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">View Medical Reports</h1>
          <div className="flex gap-4">
            <Button onClick={downloadJsonSummary} className="materna-button">
              Download JSON Summary
            </Button>
            <Link to="/upload-reports">
              <Button className="materna-button">
                <Upload className="mr-2 h-4 w-4" />
                Upload New Report
              </Button>
            </Link>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader className="bg-blue-50 rounded-t-lg">
            <CardTitle>
              Patient: {patientData.firstName} {patientData.lastName}
            </CardTitle>
            <CardDescription>ID: {patientData.id}</CardDescription>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
          <TabsList className="grid grid-cols-6">
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="blood">Blood Tests</TabsTrigger>
            <TabsTrigger value="ultrasound">Ultrasound</TabsTrigger>
            <TabsTrigger value="infectious">Infectious</TabsTrigger>
            <TabsTrigger value="thyroid">Thyroid & Genetic</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="text-gray-400 bg-gray-100 p-6 rounded-full">
              <FileText size={40} />
            </div>
            <h2 className="text-xl font-semibold">No reports have been uploaded yet.</h2>
            <p className="text-gray-500 mb-4">
              Go to the 'Upload Reports' section to add your medical reports.
            </p>
            <Link to="/upload-reports">
              <Button className="materna-button">
                <Upload className="mr-2 h-4 w-4" />
                Upload Reports
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(reportsByType).map(([type, reports]) => (
              <div key={type} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4 capitalize">
                  {type.replace("-", " ")} Reports
                </h2>
                <div className="grid gap-4">
                  {reports.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

// Badge for risk levels
const RiskBadge: React.FC<{ riskLevel: string }> = ({ riskLevel }) => {
  switch (riskLevel) {
    case "high_risk":
      return (
        <Badge variant="destructive" className="flex gap-1 items-center">
          <AlertTriangle size={12} />
          High Risk
        </Badge>
      );
    case "borderline":
      return (
        <Badge variant="default" className="flex gap-1 items-center bg-yellow-500">
          <Info size={12} />
          Borderline
        </Badge>
      );
    case "normal":
      return (
        <Badge variant="outline" className="flex gap-1 items-center text-green-600 border-green-600">
          <CheckCircle size={12} />
          Normal
        </Badge>
      );
    default:
      return null;
  }
};

// Direction indicator for test results
const DirectionIndicator: React.FC<{ direction: string }> = ({ direction }) => {
  switch (direction) {
    case "high":
      return <ArrowUpRight className="text-red-500" size={16} />;
    case "low":
      return <ArrowDownRight className="text-blue-500" size={16} />;
    default:
      return null;
  }
};

// Updated ReportCard component to open PDF in a new tab
const ReportCard: React.FC<{ report: any }> = ({ report }) => {
  const analysis = report.analysisResults;

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-md">{report.date}</CardTitle>
            <CardDescription className="text-xs">
              Category: <span className="capitalize">{report.category}</span>
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(report.fileUrl, "_blank")}
          >
            <FileText className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {report.notes && (
          <CardDescription className="mb-2">{report.notes}</CardDescription>
        )}

        {analysis && analysis.status === "success" && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2 mb-3">
              {analysis.normal_results > 0 && (
                <Badge variant="outline" className="flex gap-1 text-green-600 border-green-600">
                  <CheckCircle size={12} />
                  {analysis.normal_results} Normal
                </Badge>
              )}
              {analysis.borderline_results > 0 && (
                <Badge variant="default" className="flex gap-1 bg-yellow-500">
                  <Info size={12} />
                  {analysis.borderline_results} Borderline
                </Badge>
              )}
              {analysis.high_risk_results > 0 && (
                <Badge variant="destructive" className="flex gap-1">
                  <AlertTriangle size={12} />
                  {analysis.high_risk_results} High Risk
                </Badge>
              )}
            </div>

            {analysis.all_results && analysis.all_results.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Test Results:</h4>
                <div className="space-y-2">
                  {analysis.all_results.map((result: any, index: number) => (
                    <div
                      key={index}
                      className="p-2 rounded bg-gray-50 text-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1">
                        <DirectionIndicator direction={result.direction} />
                        <span className="font-medium">{result.test_name}:</span>
                        <span>
                          {result.result_value} {result.result_unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Ref: {result.reference_range}
                        </span>
                        <RiskBadge riskLevel={result.risk_level} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {!report.analysisResults && (
        <CardFooter className="bg-gray-50 py-2">
          <span className="text-xs text-gray-500 italic">
            No analysis data available for this report
          </span>
        </CardFooter>
      )}
    </Card>
  );
};

export default ViewReportsPage;