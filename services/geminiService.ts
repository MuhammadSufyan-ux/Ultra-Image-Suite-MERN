
import { GoogleGenAI } from "@google/genai";

// Create a compliant image processing function using Gemini 2.5 Flash Image model
export const processImageWithAI = async (
  base64Image: string,
  prompt: string,
  mimeType: string = 'image/png'
): Promise<string | null> => {
  // Always create a new GoogleGenAI instance right before making an API call to ensure latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  try {
    // Extract base64 data correctly by stripping the data URL prefix if present
    const dataOnly = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    // Determine mimeType from base64 if possible
    const detectedMimeType = base64Image.match(/data:(.*);base64/)?.[1] || mimeType;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { 
            inlineData: { 
              data: dataOnly, 
              mimeType: detectedMimeType 
            } 
          },
          { text: prompt }
        ]
      }
    });

    // Iterate through response parts to find the image part, as recommended
    const candidates = response.candidates;
    if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${detectedMimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini AI Processing Error:", error);
    throw error;
  }
};
