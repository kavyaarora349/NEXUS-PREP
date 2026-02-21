
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationParams, QuestionPaper } from "../types";

// Initialize the GoogleGenAI client using the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateQuestionPaper(params: GenerationParams): Promise<QuestionPaper> {
  const prompt = `
    Generate a professional academic question paper for REVA University.
    Subject: ${params.subject}
    Semester: ${params.semester}
    Student: ${params.studentName}
    
    Contextual Notes Provided: 
    "${params.notesText.slice(0, 4000)}" 

    The paper should follow standard university patterns:
    Section A: Short answers (2 marks each)
    Section B: Medium answers (5 marks each)
    Section C: Descriptive/Long answers (10 marks each)
    
    Total marks should be 100.
    Ensure questions are realistic, high-quality, and relevant to the subject.
  `;

  try {
    const response = await ai.models.generateContent({
      // Use gemini-3-pro-preview for complex reasoning tasks like academic paper generation.
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            university: { type: Type.STRING },
            subject: { type: Type.STRING },
            semester: { type: Type.STRING },
            studentName: { type: Type.STRING },
            date: { type: Type.STRING },
            timeAllowed: { type: Type.STRING },
            maxMarks: { type: Type.NUMBER },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  instructions: { type: Type.STRING },
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.NUMBER },
                        text: { type: Type.STRING },
                        marks: { type: Type.NUMBER },
                        section: { type: Type.STRING }
                      },
                      required: ["id", "text", "marks"]
                    }
                  }
                },
                required: ["name", "instructions", "questions"]
              }
            }
          },
          required: ["university", "subject", "semester", "sections"]
        }
      }
    });

    // Access the response text directly as a property (getter), not a function call.
    const result = JSON.parse(response.text || '{}');
    // Ensure some defaults if missing
    return {
      id: result.id || Math.random().toString(36).substr(2, 9),
      university: result.university || "REVA University",
      subject: result.subject || params.subject,
      semester: result.semester || params.semester,
      studentName: result.studentName || params.studentName,
      date: result.date || new Date().toLocaleDateString(),
      timeAllowed: result.timeAllowed || "3 Hours",
      maxMarks: result.maxMarks || 100,
      sections: result.sections || []
    };
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}
