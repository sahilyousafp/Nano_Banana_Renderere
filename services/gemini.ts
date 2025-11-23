import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface EditImageParams {
  base64Image: string;
  prompt: string;
  mimeType?: string;
  creativity?: number; // 0.0 to 1.0
}

export const generateEditedImage = async (params: EditImageParams): Promise<string> => {
  try {
    const { base64Image, prompt, mimeType = 'image/png', creativity = 0.5 } = params;

    // Remove header if present for inlineData
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        temperature: creativity,
      }
    });

    // Parse response
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated in response");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};