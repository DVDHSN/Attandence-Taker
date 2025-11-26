import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateText = async (prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || '';
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    throw error;
  }
};
