import { GoogleGenAI, Type } from "@google/genai";

export interface PlantIdentification {
  name: string;
  scientificName: string;
  category: 'plant' | 'mushroom';
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
  recognitionTips: { text: string; imageSearchTerm: string }[];
  warning?: string;
}

export async function identifyPlant(
  base64Image: string, 
  category: 'plant' | 'mushroom' = 'plant',
  subjectPart: string = 'Soggetto intero', 
  feedback?: string
): Promise<PlantIdentification> {
  let apiKey = process.env.GEMINI_API_KEY;
  
  if (apiKey) apiKey = apiKey.trim();

  if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.length < 20) {
    throw new Error("La chiave API Gemini non è valida. Assicurati di averla inserita correttamente nelle impostazioni del progetto.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-flash-latest as recommended by SKILL.md
    const model = "gemini-flash-latest";
    
    const expertType = category === 'plant' ? "pianta o albero selvatico" : "fungo";
    const detailType = category === 'plant' ? "forma delle foglie, venature, petali, frutti, corteccia" : "cappello, lamelle, gambo, anello, volva, colore della carne";

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
    - phytotherapyUses: lista di oggetti con "title" (nome rimedio/uso) e "recipeLink" (un link Google Search per il rimedio specifico). Se funghi, scrivi "N/A" o usi medicinali se applicabili.
    - description: una breve descrizione botanica/micologica che includa il portamento e l'habitat tipico.
    - botanicalDetails: un oggetto con descrizioni brevi e specifiche per "leaf" (foglie), "flower" (fiori/infiorescenze), "fruit" (frutti/semi o spore per funghi), "stem" (fusto/tronco o gambo per funghi), "habitat" (dove cresce).
    - recognitionTips: lista di 4-5 oggetti con "text" (consiglio pratico) e "imageSearchTerm" (una parola chiave molto specifica in inglese per trovare un'immagine di quel dettaglio botanico/micologico).
    - warning: eventuali avvertenze (es. somiglianze con specie tossiche, controindicazioni). PER I FUNGHI: includi sempre un avviso di non consumare mai senza il parere di un esperto dal vivo.
    
    Rispondi SOLO con il JSON.`;

    const response = await ai.models.generateContent({
      model,
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
            category: { type: Type.STRING, enum: ["plant", "mushroom"] },
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
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Impossibile analizzare i dati della pianta.");
  }
}
