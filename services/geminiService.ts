import { GoogleGenAI, Type } from "@google/genai";
import { TerminalProfile } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API_KEY is missing from environment variables");
    return "";
  }
  return key;
};

export const parseProfileWithGemini = async (
  text: string
): Promise<TerminalProfile> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: text,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          username: { type: Type.STRING },
          bio: { type: Type.STRING },
          lines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.STRING },
              },
              required: ["label", "value"],
            },
          },
        },
        required: ["username", "lines"],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("No response from Gemini");
  }

  try {
    return JSON.parse(responseText) as TerminalProfile;
  } catch (e) {
    console.error("Failed to parse Gemini JSON", e);
    throw new Error("Failed to parse AI response");
  }
};