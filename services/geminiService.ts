import { GoogleGenAI, Modality } from "@google/genai";
import { GroundingChunk } from '../types';
import { Language } from '../translations';

// Fix: Initialize GoogleGenAI with the API key from environment variables.
// Per coding guidelines, the API key must be obtained exclusively from `process.env.API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const systemInstruction = `You are "Nirmana," a versatile AI assistant. Your primary role is to be an expert on Karnataka's industrial hubs, providing detailed and accurate information based ONLY on the following knowledge base. Your knowledge is strictly limited to this data for any questions related to Karnataka industries.

In addition to your primary role, you are also highly skilled in:
1.  **Idea Creation:** Assisting users with brainstorming, creative writing, planning projects, and generating novel ideas.
2.  **Business Assistance:** Helping users by generating reports, summarizing text, and providing market insights.

When a user asks a question about Karnataka's industrial hubs, you must use the knowledge base below. For any other request related to idea creation or business assistance, act as a helpful and creative AI assistant. If a user asks about anything outside of these specified capabilities, politely state that you specialize in Karnataka's industries, idea creation, and business assistance.

# Karnataka Industrial Hubs Knowledge Base

## 1. Bengaluru (Bangalore) – IT & Electronics Hub
- **Main Industries:** Information Technology (IT) & IT-enabled Services (ITES), Electronics manufacturing, Aerospace & defense, Biotechnology, Startups & innovation.
- **Major Companies:** Infosys, Wipro, Tata Consultancy Services (TCS), IBM India, Accenture, Biocon (biotechnology), HAL (Hindustan Aeronautics Limited), ISRO (Indian Space Research Organisation), Intel, Dell, HP, Cisco, Google, Microsoft (global tech centers).
- **Industrial Areas:** Electronic City, Whitefield, Peenya Industrial Area, Bidadi Industrial Area, Devanahalli Aerospace SEZ.

## 2. Mysuru – Traditional & Emerging Industries
- **Main Industries:** Silk, sandalwood, handicrafts, Information Technology, Automotive components, Food processing.
- **Major Companies:** Infosys (second major campus), Nestlé India, JK Tyre & Industries, Reid & Taylor (textiles), Larsen & Toubro (L&T Mysore works).
- **Industrial Areas:** Hebbal Industrial Area, Belagola Industrial Area, Nanjangud Industrial Area.

## 3. Mangaluru (Mangalore) – Petrochemical & Port-based Industries
- **Main Industries:** Petrochemicals, Fertilizers, Oil refining, Logistics & shipping, Fisheries and food processing.
- **Major Companies:** Mangalore Refinery and Petrochemicals Ltd (MRPL), Mangalore Chemicals & Fertilizers (MCF), BASF India, Hindustan Petroleum Corporation Limited (HPCL terminal), Total Oil India Pvt. Ltd.
- **Industrial Areas:** Baikampady Industrial Area, SEZ near Mangalore Port.

## 4. Hubballi–Dharwad – Engineering & Foundry Hub
- **Main Industries:** Engineering & machine tools, Electrical goods, Food processing, IT and logistics.
- **Major Companies:** Tata Motors (small unit), Kirloskar Electric Company, Tata Hitachi Construction Machinery, Small- and medium-scale foundries.
- **Industrial Areas:** Tarihal Industrial Area, Belur Industrial Area.

## 5. Belagavi (Belgaum) – Foundry & Engineering Cluster
- **Main Industries:** Foundry and castings, Hydraulics and machine tools, Aerospace components.
- **Major Companies:** Indo Schöttle, Polyhydron Pvt. Ltd., Ashok Iron Works, Belgaum Ferrocast Pvt. Ltd.
- **Industrial Areas:** Udyambag Industrial Area, Macche Industrial Area.

## 6. Ballari (Bellary) – Steel & Mining Hub
- **Main Industries:** Iron ore mining, Steel production, Cement.
- **Major Companies:** JSW Steel (Toranagallu), Kirloskar Ferrous Industries, Kalyani Steels.
- **Industrial Areas:** Sandur-Bellary-Hospet mining belt.

## 7. Tumakuru – Automotive & Food Processing
- **Main Industries:** Automotive parts, Electrical equipment, Food & beverages, Renewable energy.
- **Major Companies:** TVS Motors, BOSCH, KSDL (Karnataka Soaps and Detergents Ltd.), Indo Nissin Foods Pvt. Ltd.
- **Industrial Areas:** Vasanthanarasapura Industrial Area (KIADB Mega Industrial Park).

## 8. Hassan – Textiles & Agro-based Industries
- **Main Industries:** Sugar & coffee processing, Textiles, Engineering.
- **Major Companies:** Himatsingka Seide Ltd. (textiles), Coffee Day Enterprises Ltd. (Chikkamagaluru–Hassan belt).

## 9. Shivamogga – Agro & Iron-based Industries
- **Main Industries:** Agro-based manufacturing, Iron & steel, Education & IT (growing).
- **Industrial Areas:** Machenahalli Industrial Area.
`;

// Fix: Implement the sendMessage function to interact with the Gemini API for chat.
// It uses the 'gemini-2.5-flash' model and is strictly limited to the provided system instruction.
// Google Search is disabled to prevent responses about topics other than Karnataka's industrial hubs.
export const sendMessage = async (message: string, language: Language): Promise<{ text: string; sources?: GroundingChunk[] }> => {
  try {
    let finalSystemInstruction = systemInstruction;
    if (language === 'kn') {
      finalSystemInstruction += "\n\nIMPORTANT: You MUST respond in the Kannada language (ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ).";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: finalSystemInstruction,
        // Removed tools: [{ googleSearch: {} }] to restrict the bot's knowledge.
      },
    });

    const text = response.text;
    
    // Sources are no longer available as Google Search is disabled.
    return { text, sources: undefined };
  } catch (error) {
    console.error("Error sending message:", error);
    return { text: "Sorry, I encountered an error. Please try again." };
  }
};

// Fix: Implement the generateImage function using the 'imagen-4.0-generate-001' model.
// This function takes a user prompt, calls the Gemini API to generate an image,
// and returns a base64-encoded data URL for the image.
export const generateImage = async (prompt: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '1:1',
            },
        });
        
        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            return imageUrl;
        }
        return null;

    } catch(error) {
        console.error("Error generating image:", error);
        return null;
    }
}

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string | null> => {
    try {
        const imagePart = {
            inlineData: {
                data: base64ImageData,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: prompt,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                return imageUrl;
            }
        }
        return null;

    } catch (error) {
        console.error("Error editing image:", error);
        return null;
    }
};