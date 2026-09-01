import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Employee Voice & Grievance API",
    timestamp: new Date().toISOString(),
    aiAvailable: !!process.env.GEMINI_API_KEY,
  });
});

// AI Smart Triage & Category / Risk Assessment
app.post("/api/ai/analyze-complaint", async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback heuristics if API key is not yet set
      return res.json({
        suggestedCategory: category || "HR",
        urgencyScore: "Medium",
        sentiment: "Concerned",
        riskLevel: "Moderate",
        suggestedDepartment: "HR Operations",
        keyKeywords: ["Employee Relations", "Process"],
        summary: title || "Grievance submitted",
        recommendedActions: ["Acknowledge within 24 hours", "Assign designated officer", "Schedule initial inquiry"],
      });
    }

    const prompt = `You are an enterprise Employee Relations & Whistleblower Triage AI Expert for a Thai corporate organization.
Analyze the following employee complaint/feedback:
Title: "${title || ''}"
Category chosen: "${category || 'Not specified'}"
Description: "${description || ''}"

Return a valid JSON object with the following fields:
{
  "suggestedCategory": "HR" | "IT" | "Safety" | "Compliance" | "Ethics" | "Harassment" | "Fraud" | "Quality" | "Environment",
  "urgencyScore": "Low" | "Medium" | "High" | "Critical",
  "sentiment": "Neutral" | "Frustrated" | "Concerned" | "Urgent" | "Constructive",
  "riskLevel": "Low" | "Moderate" | "High" | "Severe",
  "suggestedDepartment": "string in Thai or English (e.g. แผนกบุคคล (HR), แผนกไอที (IT), ฝ่ายความปลอดภัย (Safety & EHS), ฝ่ายกำกับการปฏิบัติตามกฎเกณฑ์ (Compliance), ฝ่ายตรวจสอบภายใน (Internal Audit))",
  "keyKeywords": ["array of 2-4 keywords"],
  "summary": "1-sentence executive summary in Thai",
  "recommendedActions": ["array of 3 specific standard operating procedure triage steps in Thai"],
  "isDirectExecutiveWorthy": boolean (true if severe fraud, executive harassment, gross safety violation, or systemic ethics breach)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({
      error: "Failed to analyze grievance",
      details: error.message,
      fallback: true,
    });
  }
});

// AI Executive Root-Cause Cluster Insights & Strategic Briefing
app.post("/api/ai/cluster-insights", async (req, res) => {
  try {
    const { complaints } = req.body;
    const ai = getGeminiClient();

    if (!ai || !complaints || complaints.length === 0) {
      return res.json({
        topRiskClusters: [
          {
            clusterName: "IT Equipment & Infrastructure Latency",
            category: "IT",
            count: 14,
            rootCause: "Aging laptop hardware and VPN bandwidth constraints during hybrid days",
            preventiveAction: "Procure upgraded hardware batches and boost corporate gateway bandwidth",
            severity: "Medium",
          },
          {
            clusterName: "Workplace Harassment & Psychological Safety",
            category: "Harassment",
            count: 6,
            rootCause: "Middle management communication gap and lack of clear anti-harassment escalation workshop",
            preventiveAction: "Mandatory respectful workplace training and anonymous counseling hotline",
            severity: "High",
          },
          {
            clusterName: "EHS Workshop Safety Protocol Adherence",
            category: "Safety",
            count: 8,
            rootCause: "PPE inspection gaps during night shifts",
            preventiveAction: "Enforce bi-weekly safety audit and automated shift checklist sign-off",
            severity: "High",
          },
        ],
        executiveSummary: "ภาพรวมข้อร้องเรียนในไตรมาสนี้ มุ่งเน้นไปที่ด้านการทำงานแบบไฮบริดและอุปกรณ์ไอที รวมถึงการเสริมสร้างความปลอดภัยในโรงงาน การตอบสนองของ Gatekeeper อยู่ในเกณฑ์เฉลี่ย 94.2% ของ SLA",
        strategicRecommendations: [
          "เร่งรัดการปรับปรุงโครงสร้างพื้นฐานไอทีเพื่อลดเคสสะสม",
          "จัดอบรม Respectful Workplace & Anti-Harassment ทั่วทั้งองค์กร",
          "เพิ่มประสิทธิภาพการตรวจสอบความปลอดภัยกะดึก",
        ],
      });
    }

    const sampleSummary = complaints.slice(0, 15).map((c: any) => ({
      id: c.trackingCode,
      category: c.category,
      title: c.title,
      status: c.status,
      isDirectToExecutive: c.isDirectToExecutive,
    }));

    const prompt = `You are a Chief People Officer & Enterprise Risk Analyst for a major Thai corporation.
Analyze the following corporate grievances and suggestions sample:
${JSON.stringify(sampleSummary, null, 2)}

Identify the main root-cause clusters, systemic patterns, and strategic recommendations in Thai language.
Return valid JSON with schema:
{
  "topRiskClusters": [
    {
      "clusterName": "string in Thai",
      "category": "HR" | "IT" | "Safety" | "Compliance" | "Ethics" | "Harassment" | "Fraud" | "Quality" | "Environment",
      "count": number,
      "rootCause": "Deep root cause analysis in Thai",
      "preventiveAction": "Corrective & Preventive Action (CAPA) in Thai",
      "severity": "Low" | "Medium" | "High" | "Critical"
    }
  ],
  "executiveSummary": "Concise paragraph in Thai summarizing the organizational health, key risk alerts, and resolution trends for CEO/EVP",
  "strategicRecommendations": ["array of 3-4 concrete actionable strategic management directives in Thai"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("AI Cluster Insights Error:", error);
    res.status(500).json({ error: "Failed to generate cluster insights" });
  }
});

// Enterprise Legacy API Mock Integration & Webhooks
app.get("/api/v1/legacy/employees/:empId", (req, res) => {
  const { empId } = req.params;
  res.json({
    success: true,
    source: "Oracle HRMS / Active Directory Sync",
    employee: {
      employeeId: empId,
      name: "สมชาย วิจิตรศิลป์ (Somchai V.)",
      department: "Digital Innovation & Engineering",
      email: "somchai.v@company.internal",
      position: "Senior Systems Engineer",
      manager: "ดร. กฤษณา เกียรติสกุล (EVP Technology)",
      joinedDate: "2021-03-15",
      status: "Active",
      securityClearance: "Level 3",
    },
  });
});

app.post("/api/v1/legacy/export-webhook", (req, res) => {
  res.json({
    success: true,
    message: "Data securely synchronized with Corporate SAP GRC & Data Warehouse via REST API",
    payloadHash: "sha256-" + Math.random().toString(36).substring(2) + Date.now(),
    syncedAt: new Date().toISOString(),
  });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise Grievance Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
