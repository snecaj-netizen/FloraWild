import { GoogleGenAI, Type } from "@google/genai";

export interface PlantIdentification {
  name: string;
  scientificName: string;
  category: 'plant' | 'mushroom' | 'cultivable';
  isEdible: boolean;
  edibilityDetails: string;
  culinaryUses: { title: string; recipeLink: string }[];
  phytotherapyUses: { title: string; recipeLink: string }[];
  description: string;
  botanicalDetails?: {
    leaf?: string;
    flower?: string;
    fruit?: string;
    stem?: string;
    habitat?: string;
  };
  gardeningDetails?: {
    sowingTime: string;
    plantingTime: string;
    sunExposure: string;
    watering: string;
    soilPreference: string;
    harvestTime: string;
    spacing: string;
  };
  recognitionTips: { text: string; imageSearchTerm: string }[];
  warning?: string;
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 1) throw error;
    
    // Only retry on potential transient errors (500, network errors, etc.)
    const errorMessage = error?.message || "";
    const statusCode = error?.code || 0;
    
    const isTransient = 
      errorMessage.includes("500") || 
      errorMessage.includes("xhr error") || 
      errorMessage.includes("UNKNOWN") ||
      statusCode === 500 ||
      statusCode === 503;

    if (!isTransient) throw error;

    console.warn(`Transient error, retrying in ${delay}ms... (${retries - 1} retries left)`, error);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

export async function identifyPlant(
  base64Image: string, 
  category: 'plant' | 'mushroom' | 'cultivable' = 'plant',
  subjectPart: string = 'Soggetto intero', 
  feedback?: string
): Promise<PlantIdentification> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.length < 20) {
    throw new Error("La chiave API Gemini non è valida. Assicurati di averla inserita correttamente nelle impostazioni del progetto.");
  }

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-flash-latest as recommended by SKILL.md
    const model = "gemini-flash-latest";
    
    let expertType = "pianta o albero selvatico";
    if (category === 'mushroom') expertType = "fungo";
    if (category === 'cultivable') expertType = "pianta da orto o giardino (pianta coltivabile)";

    const detailType = category === 'mushroom' ? "cappello, lamelle, gambo, anello, volva, colore della carne" : "forma delle foglie, venature, petali, frutti, corteccia";

    let prompt = `Identifica questo ${expertType} dall'immagine. 
    L'utente ha indicato che l'immagine mostra principalmente: ${subjectPart}.
    
    Analizza attentamente i dettagli visibili (${detailType}) per fornire un'identificazione precisa.`;

    if (feedback) {
      prompt += `\n\nIMPORTANTE: L'utente ha fornito questo feedback su una precedente identificazione errata: "${feedback}". 
      Usa questa informazione per correggere l'identificazione e fornire dati più accurati.`;
    }
    
    prompt += `\n\nFornisci i dettagli in formato JSON con i seguenti campi:
    - name: nome comune in italiano
    - scientificName: nome scientifico
    - category: stringa esatta "${category}"
    - isEdible: booleano (true se commestibile, false altrimenti)
    - edibilityDetails: spiegazione dettagliata sulla commestibilità. PER I FUNGHI: SII ESTREMAMENTE CAUTO.
    - culinaryUses: lista di oggetti con "title" (nome ricetta/uso) e "recipeLink" (un link Google Search per la ricetta specifica)
    - phytotherapyUses: lista di oggetti con "title" (nome rimedio/uso) e "recipeLink" (un link Google Search per il rimedio specifico).
    - description: una breve descrizione botanica/micologica che includa il portamento e l'habitat tipico.
    - botanicalDetails: un oggetto con descrizioni brevi e specifiche per "leaf" (foglie), "flower" (fiori/infiorescenze), "fruit" (frutti/semi o spore per funghi), "stem" (fusto/tronco o gambo per funghi), "habitat" (dove cresce).`;

    if (category === 'cultivable') {
      prompt += `\n- gardeningDetails: un oggetto con informazioni utili per la coltivazione:
        - sowingTime: quando seminare (mesi, es. "Febbraio - Aprile")
        - plantingTime: quando trapiantare/impiantare (mesi)
        - sunExposure: esposizione solare ideale (es. "Pieno sole", "Mezz'ombra")
        - watering: consigli su quando e quanto innaffiare
        - soilPreference: tipo di terreno preferito
        - harvestTime: quando raccogliere
        - spacing: distanza consigliata tra le piante`;
    }

    prompt += `\n- recognitionTips: lista di 4-5 oggetti con "text" (consiglio pratico) e "imageSearchTerm" (una parola chiave molto specifica in inglese per trovare un'immagine di quel dettaglio botanico/micologico).
    - warning: eventuali avvertenze (es. somiglianze con specie tossiche, controindicazioni). PER I FUNGHI: includi sempre un avviso di non consumare mai senza il parere di un esperto dal vivo.
    
    Rispondi SOLO con il JSON.`;

    const response = await ai.models.generateContent({
      model: model || "gemini-flash-latest",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            category: { type: Type.STRING, enum: ["plant", "mushroom", "cultivable"] },
            isEdible: { type: Type.BOOLEAN },
            edibilityDetails: { type: Type.STRING },
            culinaryUses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  recipeLink: { type: Type.STRING }
                },
                required: ["title", "recipeLink"]
              },
            },
            phytotherapyUses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  recipeLink: { type: Type.STRING }
                },
                required: ["title", "recipeLink"]
              },
            },
            description: { type: Type.STRING },
            botanicalDetails: {
              type: Type.OBJECT,
              properties: {
                leaf: { type: Type.STRING },
                flower: { type: Type.STRING },
                fruit: { type: Type.STRING },
                stem: { type: Type.STRING },
                habitat: { type: Type.STRING }
              }
            },
            gardeningDetails: {
              type: Type.OBJECT,
              properties: {
                sowingTime: { type: Type.STRING },
                plantingTime: { type: Type.STRING },
                sunExposure: { type: Type.STRING },
                watering: { type: Type.STRING },
                soilPreference: { type: Type.STRING },
                harvestTime: { type: Type.STRING },
                spacing: { type: Type.STRING }
              }
            },
            recognitionTips: {
              type: Type.ARRAY,
              items: { 
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  imageSearchTerm: { type: Type.STRING }
                },
                required: ["text", "imageSearchTerm"]
              }
            },
            warning: { type: Type.STRING },
          },
          required: ["name", "scientificName", "category", "isEdible", "edibilityDetails", "culinaryUses", "phytotherapyUses", "description", "recognitionTips"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Nessuna risposta ricevuta dal modello.");
    
    try {
      return JSON.parse(text.trim());
    } catch (e) {
      console.error("JSON parse error:", text);
      throw new Error("Errore nel formato della risposta dell'IA.");
    }
  });
}
