
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const extractLandRecord = async (fileBase64: string, mimeType: string) => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are an expert Maharashtra Land Record Officer.
    Analyze the provided 7/12 (Satbara) document (image or PDF) and extract structured data.
    The document can be printed, scanned, or handwritten in Marathi or English.
    
    Extract the following fields accurately:
    1. भू-धारणा पद्धती (Land Holding Type)
    2. गाव (Village)
    3. तालुका (Taluka)
    4. जिल्हा (District)
    5. क्षेत्र (Total Area)
    6. शेवटचा फेरफार क्रमांक (Last Mutation Number)
    
    LITERAL EXTRACTION GUIDELINES:
    - Extract 'भू-धारणा पद्धती' (Land Holding Type) and 'गाव' (Village) with 100% absolute literal fidelity.
    - DO NOT standardize spellings. DO NOT change digits (keep English '1' as '1', Marathi '१' as '१').
    - VISUAL PRECISION MANDATORY FOR 'REPH' (HOOK): Pay extreme attention to the character 'ग' (ga). If there is a small hook/reph on top of it, it MUST be extracted as 'र्ग' (rga). 
    - CRITICAL: Distinguish between 'वग' (vaga) and 'वर्ग' (varga). In the provided documents, it is almost always 'वर्ग' (with the hook). Capturing this 'र' stroke is mandatory.
    - VILLAGE NAME: Extract ONLY the village name. Exclude bracketed numbers, census codes, or pincodes (e.g., if it says 'कोल्हेवाडी (558105)', extract only 'कोल्हेवाडी').
    - Accurate character-by-character reproduction is mandatory for filtering consistency.
    
    Additionally, search the ENTIRE document (including remarks and margins) for these legal flags:
    - तुकडा / तुकडे बंदी (Fragment Restriction)
    - सीलिंग (Ceiling)
    - Forest / फॉरेस्ट (Forest)
    - इनाम (Inam)
    - भूदान (Bhudan)
    - गावठाण (Gavthan)
    
    If any of these keywords are present (even in different variations like 'forest' or 'फॉरेस्ट'), mark as true. Otherwise false.
    
    Respond STRICTLY in the following JSON format:
    {
      "landHoldingType": "string",
      "village": "string",
      "taluka": "string",
      "district": "string",
      "totalArea": "string",
      "lastMutationNumber": "string",
      "fragmentRestriction": boolean,
      "ceiling": boolean,
      "forest": boolean,
      "inam": boolean,
      "bhudan": boolean,
      "gavthan": boolean,
      "confidenceScore": number (0-1)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: fileBase64, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            landHoldingType: { type: Type.STRING },
            village: { type: Type.STRING },
            taluka: { type: Type.STRING },
            district: { type: Type.STRING },
            totalArea: { type: Type.STRING },
            lastMutationNumber: { type: Type.STRING },
            fragmentRestriction: { type: Type.BOOLEAN },
            ceiling: { type: Type.BOOLEAN },
            forest: { type: Type.BOOLEAN },
            inam: { type: Type.BOOLEAN },
            bhudan: { type: Type.BOOLEAN },
            gavthan: { type: Type.BOOLEAN },
            confidenceScore: { type: Type.NUMBER }
          },
          required: ["village", "taluka", "district"]
        }
      }
    });

    const text = response.text?.trim();
    console.log('AI Response:', text?.substring(0, 500) + '...');
    
    if (!text) {
      throw new Error("Empty response from AI");
    }
    return JSON.parse(text);
  } catch (error: any) {
    console.error("=== EXTRACTION ERROR ===");
    console.error(error);
    if (error instanceof SyntaxError) {
      console.error("Invalid JSON from AI - check prompt response");
      throw new Error("AI returned invalid JSON. Try with a clearer document.");
    }
    if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('Quota')) {
      throw new Error("AI Quota Reached. Please wait and try again.");
    }
    throw new Error("Failed to extract. Check console for details.");
  }
};
