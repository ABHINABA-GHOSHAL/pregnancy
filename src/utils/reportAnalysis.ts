import { ReportAnalysisSummary } from "@/contexts/AppContext";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjsLib from "pdfjs-dist";

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
const GEMINI_API_KEY = "AIzaSyCQe0khiVx6n-Z9vHY4ZmqBcVnFk-xvLDE"
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

// Analyze report with Gemini API, with specific handling for blood type, HIV, and hepatitis
export const analyzeReportWithAI = async (
  reportText: string,
  reportType: string
): Promise<any[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const reportTypes: Record<string, string> = {
      cbc: "Complete Blood Count (CBC)",
      "blood-type": "Blood Typing",
      glucose: "Glucose Tolerance Test",
      doppler: "Doppler Ultrasound",
      "3d-4d": "3D/4D Ultrasound",
      hiv: "HIV Test",
      hepb: "Hepatitis B Test",
      tsh: "Thyroid Function Test",
      cfdna: "Cell-Free DNA Screening",
      carrier: "Carrier Screening",
      amnio: "Amniocentesis Results",
      cvs: "Chorionic Villus Sampling (CVS) Results",
      custom: "Medical Test",
    };

    const reportDescription = reportTypes[reportType.toLowerCase()] || "Medical Test";

    let prompt = `
      You are a medical data extraction AI. Analyze this ${reportDescription} report and extract all test parameters, their values, and reference ranges.

      Format the results as a JSON array where each item has these fields:
      - test_name: The name of the test parameter
      - result_value: The numeric value (if available) or text result (e.g., "Positive", "Negative", "A", "B")
      - result_unit: The unit of measurement (if available, e.g., "%", "g/dL")
      - ref_range_low: The lower limit of the reference range (numeric if available)
      - ref_range_high: The upper limit of the reference range (numeric if available)
      - ref_range_text: Text description of reference range (e.g., "Negative", "N/A")

      For qualitative tests, use text values in result_value (e.g., "Positive", "Negative") and set ref_range_text appropriately.
    `;

    // Specific instructions for blood type, HIV, and hepatitis
    if (reportType.toLowerCase() === "blood-type") {
      prompt += `
        For Blood Typing reports, extract:
        - Blood group (e.g., "A", "B", "AB", "O") as test_name: "Blood Group", result_value: [extracted group], ref_range_text: "N/A"
        - Rh factor (e.g., "Positive", "Negative") as test_name: "Rh Factor", result_value: [extracted factor], ref_range_text: "N/A"
      `;
    } else if (reportType.toLowerCase() === "hiv") {
      prompt += `
        For HIV Test reports, extract the result as "Positive" or "Negative".
        Set test_name: "HIV Result", result_value: [extracted result], ref_range_text: "Negative".
      `;
    } else if (reportType.toLowerCase() === "hepb") {
      prompt += `
        For Hepatitis B Test reports, extract the result as "Positive" or "Negative".
        Set test_name: "Hepatitis B Result", result_value: [extracted result], ref_range_text: "Negative".
      `;
    }

    prompt += `
      Report content:
      ${reportText}

      Return ONLY the JSON array.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    const jsonMatch = responseText.match(/\[.*\]/s);

    if (!jsonMatch) {
      console.error("Could not parse Gemini response as JSON:", responseText);
      return [];
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error analyzing report with Gemini:", error);
    return [];
  }
};

// Determine risk level for numeric results
export const determineRiskLevel = (
  value: string,
  refLow: string | undefined,
  refHigh: string | undefined
): [string, string] => {
  try {
    const numValue = parseFloat(value);
    const numRefLow = refLow ? parseFloat(refLow) : null;
    const numRefHigh = refHigh ? parseFloat(refHigh) : null;

    if (numRefLow && numRefHigh) {
      if (numValue < numRefLow) {
        return ["borderline", "low"];
      } else if (numValue > numRefHigh) {
        return ["borderline", "high"];
      } else {
        return ["normal", "normal"];
      }
    }
    return ["unknown", "unknown"];
  } catch (error) {
    return ["unknown", "unknown"];
  }
};

// Analyze qualitative results (e.g., Positive/Negative)
export const analyzeQualitativeResult = (
  resultValue: string,
  refRangeText: string
): [string, string] => {
  if (!resultValue || !refRangeText) {
    return ["unknown", "unknown"];
  }

  const result = resultValue.toLowerCase().trim();
  const refRange = refRangeText.toLowerCase().trim();

  if (refRange.includes("negative")) {
    if (result.includes("positive")) {
      return ["high_risk", "positive"];
    } else if (result.includes("negative")) {
      return ["normal", "normal"];
    }
  }
  return ["unknown", "unknown"];
};

// Analyze test results to assign risk levels
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
      risk_level: "",
      direction: "",
    };

    let isNumeric = !isNaN(parseFloat(result.result_value)) && isFinite(parseFloat(result.result_value));

    let riskLevel, direction;
    if (isNumeric && (result.ref_range_low || result.ref_range_high)) {
      [riskLevel, direction] = determineRiskLevel(
        result.result_value,
        result.ref_range_low,
        result.ref_range_high
      );
    } else {
      [riskLevel, direction] = analyzeQualitativeResult(
        result.result_value,
        result.ref_range_text
      );
    }

    result.risk_level = riskLevel;
    result.direction = direction;
    analyzedResults.push(result);
  }

  return analyzedResults;
};

// Main report analysis function
export const analyzeReport = async (
  file: File,
  reportType: string,
  patientId: string,
  reportDate: string
): Promise<ReportAnalysisSummary> => {
  try {
    const reportText = await extractTextFromFile(file);
    if (!reportText) {
      return { status: "error", message: "Could not extract text from the uploaded file." };
    }

    const testResults = await analyzeReportWithAI(reportText, reportType);
    if (!testResults || testResults.length === 0) {
      return { status: "error", message: "Could not extract test results from the report." };
    }

    const analyzedResults = analyzeTestResults(testResults);

    const riskFactors = analyzedResults
      .filter((result) => ["borderline", "high_risk"].includes(result.risk_level))
      .map((result) => ({
        test_name: result.test_name,
        result_value: result.result_value,
        result_unit: result.result_unit,
        reference_range:
          result.ref_range_low && result.ref_range_high
            ? `${result.ref_range_low}-${result.ref_range_high}`
            : result.ref_range_text || "N/A",
        risk_level: result.risk_level,
        direction: result.direction,
      }));

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

    return summary;
  } catch (error) {
    console.error("Error analyzing report:", error);
    return {
      status: "error",
      message: `An error occurred while analyzing the report: ${error.message}`,
    };
  }
};