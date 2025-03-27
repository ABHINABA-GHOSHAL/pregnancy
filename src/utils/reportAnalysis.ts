import { ReportAnalysisSummary } from "@/contexts/AppContext";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjsLib from "pdfjs-dist";

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Configure Gemini API key
const GENAI_API_KEY = "AIzaSyCQe0khiVx6n-Z9vHY4ZmqBcVnFk-xvLDE"; // Use the provided API key
const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

// Extract text from a PDF file
export const extractTextFromFile = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => (item.str ? item.str : ""))
        .join(" ");
      text += pageText + "\n";
    }

    return text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return "";
  }
};

// Analyze report with Gemini API
export const analyzeReportWithAI = async (
  reportText: string,
  reportType: string
): Promise<any[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const reportTypes: Record<string, string> = {
      cbc: "Complete Blood Count (CBC)",
      "blood-type": "Blood Typing",
      iron: "Iron/Ferritin Test",
      glucose: "Glucose Tolerance Test",
      lipid: "Lipid Panel",
      dating: "Dating Scan",
      anatomy: "Anatomy Scan",
      growth: "Growth Scan",
      doppler: "Doppler Ultrasound",
      "3d-4d": "3D/4D Ultrasound",
      hiv: "HIV Test",
      hepb: "Hepatitis B Test",
      hepc: "Hepatitis C Test",
      syphilis: "Syphilis Test",
      gonorrhea: "Gonorrhea Test",
      chlamydia: "Chlamydia Test",
      gbs: "Group B Streptococcus (GBS)",
      tsh: "Thyroid Function Test",
      nips: "Non-Invasive Prenatal Screening (NIPS)",
      nipt: "Non-Invasive Prenatal Testing (NIPT)",
      cfdna: "Cell-Free DNA Screening",
      carrier: "Carrier Screening",
      amnio: "Amniocentesis Results",
      cvs: "Chorionic Villus Sampling (CVS) Results",
      custom: "Medical Test",
    };

    const reportDescription = reportTypes[reportType.toLowerCase()] || "Medical Test";

    const prompt = `
      You are a medical data extraction AI. Analyze this ${reportDescription} report and extract all test parameters, their values, and reference ranges.

      Format the results as a JSON array where each item has these fields:
      - test_name: The name of the test parameter
      - result_value: The numeric value (if available) or text result
      - result_unit: The unit of measurement (if available)
      - ref_range_low: The lower limit of the reference range (numeric if available)
      - ref_range_high: The upper limit of the reference range (numeric if available)
      - ref_range_text: Text description of reference range (like "Negative", "Not Detected", etc.)

      For qualitative tests or tests without numeric reference ranges, fill in the appropriate fields only.
      For test results that use text values like "Positive", "Negative", "Normal", etc., use those in result_value and leave numeric fields empty.

      The report content is below:
      ${reportText}

      Return ONLY the JSON array, with no other text.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Clean up the response to extract only the JSON
    const jsonMatch = responseText.match(/\[.*\]/s);
    if (!jsonMatch) {
      console.error("Could not parse Gemini response as JSON:", responseText);
      return [];
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error parsing JSON from Gemini response:", error);
      return [];
    }
  } catch (error) {
    console.error("Error analyzing report with Gemini:", error);
    return [];
  }
};

// Determine risk level based on test values and reference ranges
export const determineRiskLevel = (
  value: string,
  refLow: string | undefined,
  refHigh: string | undefined
): [string, string] => {
  try {
    const numValue = parseFloat(value);
    const numRefLow = refLow && refLow !== "N/A" ? parseFloat(refLow) : null;
    const numRefHigh = refHigh && refHigh !== "N/A" ? parseFloat(refHigh) : null;

    // Handle cases where only one bound is provided
    if (!numRefLow && numRefHigh) {
      if (numValue > numRefHigh * 1.2) {
        return ["high_risk", "high"];
      } else if (numValue > numRefHigh) {
        return ["borderline", "high"];
      } else {
        return ["normal", "normal"];
      }
    } else if (numRefLow && !numRefHigh) {
      if (numValue < numRefLow * 0.8) {
        return ["high_risk", "low"];
      } else if (numValue < numRefLow) {
        return ["borderline", "low"];
      } else {
        return ["normal", "normal"];
      }
    } else if (numRefLow && numRefHigh) {
      // Both bounds are provided
      if (numValue < numRefLow) {
        // Below lower reference
        const deviation = (numRefLow - numValue) / numRefLow;
        if (deviation > 0.2) {
          return ["high_risk", "low"];
        } else {
          return ["borderline", "low"];
        }
      } else if (numValue > numRefHigh) {
        // Above upper reference
        const deviation = (numValue - numRefHigh) / numRefHigh;
        if (deviation > 0.2) {
          return ["high_risk", "high"];
        } else {
          return ["borderline", "high"];
        }
      } else {
        // Within reference range
        return ["normal", "normal"];
      }
    }

    // No reference ranges provided
    return ["unknown", "unknown"];
  } catch (error) {
    // For non-numeric values
    return ["unknown", "unknown"];
  }
};

// Analyze a qualitative test result
export const analyzeQualitativeResult = (
  resultValue: string,
  refRangeText: string
): [string, string] => {
  if (!resultValue || !refRangeText) {
    return ["unknown", "unknown"];
  }

  const result = resultValue.toLowerCase().trim();
  const refRange = refRangeText.toLowerCase().trim();

  // Negative results should typically be negative
  if (refRange.includes("negative")) {
    if (result.includes("positive")) {
      return ["high_risk", "positive"];
    } else if (result.includes("negative")) {
      return ["normal", "normal"];
    } else if (result.includes("borderline") || result.includes("indeterminate")) {
      return ["borderline", "indeterminate"];
    }
  }

  // For "normal" reference ranges
  if (refRange.includes("normal")) {
    if (result.includes("normal")) {
      return ["normal", "normal"];
    } else if (result.includes("abnormal")) {
      return ["high_risk", "abnormal"];
    }
  }

  // Default case
  return ["unknown", "unknown"];
};

// Analyze test results to determine risk levels
export const analyzeTestResults = (testResults: any[]): any[] => {
  const analyzedResults = [];

  for (const test of testResults) {
    const result = {
      test_name: test.test_name || "",
      result_value: test.result_value || "",
      result_unit: test.result_unit || "",
      ref_range_low: test.ref_range_low || "",
      ref_range_high: test.ref_range_high || "",
      ref_range_text: test.ref_range_text || "",
      risk_level: "", // Initialize these properties
      direction: "", // Initialize these properties
    };

    // Try to convert result_value to float for numeric comparison
    let isNumeric = false;
    try {
      parseFloat(result.result_value);
      isNumeric = true;
    } catch (error) {
      isNumeric = false;
    }

    // Determine risk level
    let riskLevel, direction;
    if (isNumeric && (result.ref_range_low || result.ref_range_high)) {
      [riskLevel, direction] = determineRiskLevel(
        result.result_value,
        result.ref_range_low,
        result.ref_range_high
      );
    } else {
      // For qualitative tests
      [riskLevel, direction] = analyzeQualitativeResult(
        result.result_value,
        result.ref_range_text || ""
      );
    }

    result.risk_level = riskLevel;
    result.direction = direction;
    analyzedResults.push(result);
  }

  return analyzedResults;
};

// Save analysis results to localStorage
export const saveAnalysisToLocalStorage = (
  patientId: string,
  reportId: string,
  analysis: ReportAnalysisSummary
): void => {
  try {
    const storageKey = `report_analysis_${patientId}_${reportId}`;
    localStorage.setItem(storageKey, JSON.stringify(analysis));
    console.log(`Analysis saved to localStorage with key: ${storageKey}`);
  } catch (error) {
    console.error("Error saving analysis to localStorage:", error);
  }
};

// Get analysis results from localStorage
export const getAnalysisFromLocalStorage = (
  patientId: string,
  reportId: string
): ReportAnalysisSummary | null => {
  try {
    const storageKey = `report_analysis_${patientId}_${reportId}`;
    const analysisData = localStorage.getItem(storageKey);

    if (analysisData) {
      return JSON.parse(analysisData) as ReportAnalysisSummary;
    }
    return null;
  } catch (error) {
    console.error("Error retrieving analysis from localStorage:", error);
    return null;
  }
};

// Export analysis results to JSON file
export const exportAnalysisToJson = (
  analysis: ReportAnalysisSummary,
  fileName: string = "report-analysis.json"
): void => {
  try {
    // Create a blob from the JSON data
    const jsonString = JSON.stringify(analysis, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create a download link and trigger the download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`Analysis exported to ${fileName}`);
  } catch (error) {
    console.error("Error exporting analysis to JSON:", error);
  }
};

// Main report analysis function
export const analyzeReport = async (
  file: File,
  reportType: string,
  patientId: string,
  reportDate: string
): Promise<ReportAnalysisSummary> => {
  try {
    // Extract text from file
    const reportText = await extractTextFromFile(file);
    if (!reportText) {
      return {
        status: "error",
        message: "Could not extract text from the uploaded file.",
      };
    }

    // Analyze report with AI
    const testResults = await analyzeReportWithAI(reportText, reportType);
    if (!testResults || testResults.length === 0) {
      return {
        status: "error",
        message: "Could not extract test results from the report.",
      };
    }

    // Analyze results for risk factors
    const analyzedResults = analyzeTestResults(testResults);

    // Identify risk factors (results that are not normal)
    const riskFactors = analyzedResults
      .filter((result) => ["borderline", "high_risk"].includes(result.risk_level))
      .map((result) => ({
        test_name: result.test_name,
        result_value: result.result_value,
        result_unit: result.result_unit,
        reference_range: result.ref_range_low && result.ref_range_high
          ? `${result.ref_range_low}-${result.ref_range_high}`
          : result.ref_range_text || "",
        risk_level: result.risk_level,
        direction: result.direction,
      }));

    // Create a summary
    const summary: ReportAnalysisSummary = {
      status: "success",
      report_type: reportType,
      total_tests: analyzedResults.length,
      normal_results: analyzedResults.filter((r) => r.risk_level === "normal").length,
      borderline_results: analyzedResults.filter((r) => r.risk_level === "borderline").length,
      high_risk_results: analyzedResults.filter((r) => r.risk_level === "high_risk").length,
      unknown_results: analyzedResults.filter((r) => r.risk_level === "unknown").length,
      risk_factors: riskFactors,
      all_results: analyzedResults,
    };

    // Save analysis to localStorage
    const reportId = file.name.replace(/\s+/g, "_").toLowerCase();
    saveAnalysisToLocalStorage(patientId, reportId, summary);

    // Return the summary
    return summary;
  } catch (error) {
    console.error("Error analyzing report:", error);
    return {
      status: "error",
      message: "An error occurred while analyzing the report.",
    };
  }
};