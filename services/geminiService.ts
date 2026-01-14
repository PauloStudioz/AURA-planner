
import { GoogleGenAI, Type } from "@google/genai";
import { AILevel, Task } from "../types";

const SYSTEM_PROMPTS = {
  [AILevel.SOFT]: "You are a supportive, encouraging life coach. Help the user organize their day with kindness. Provide quiet, restrained advice. If the user is overwhelmed, suggest dropping low-priority tasks.",
  [AILevel.NORMAL]: "You are a minimalist personal assistant. Be clear, concise, and logical. Use white space in your reasoning. Focus on one core goal at a time.",
  [AILevel.BRUTAL]: "You are a quiet, stoic mentor. No excuses. High standards, low volume. Focus on discipline over motivation."
};

export const processAIInput = async (
  apiKey: string,
  input: string,
  mode: AILevel,
  currentTasks: Task[],
  energy: string
) => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      User input: "${input}"
      Current energy level: ${energy}
      Current context (today's date/time): ${new Date().toISOString()}
      Existing tasks: ${JSON.stringify(currentTasks)}
      
      Instruction: Transform the input into a clean, minimal list of tasks.
      CRITICAL: You can update existing tasks if the user asks to "move", "reschedule", or "change" them. 
      Match them by title.
      
      Assign difficulty (1-5) based on cognitive load:
      1-2: Easy/Routine
      3: Moderate
      4-5: Intense/Boss
      
      If the plan is unrealistic, provide a brief "realityCheck" (max 10 words).
      Break down complex tasks into 3-5 manageable subtasks.
      Ensure categories are strictly: 'work', 'personal', 'health', or 'growth'.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPTS[mode],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "If updating an existing task, use its ID. Otherwise leave null." },
                  title: { type: Type.STRING },
                  duration: { type: Type.NUMBER },
                  startTime: { type: Type.STRING, description: "Format HH:mm" },
                  date: { type: Type.STRING, description: "Format YYYY-MM-DD" },
                  category: { type: Type.STRING },
                  difficulty: { type: Type.INTEGER },
                  isBoss: { type: Type.BOOLEAN },
                  subTasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        completed: { type: Type.BOOLEAN }
                      }
                    }
                  }
                },
                required: ["title", "duration", "category", "isBoss", "difficulty"]
              }
            },
            realityCheck: { type: Type.STRING }
          }
        }
      }
    });

    if (!response.text) throw new Error("Empty neural response.");
    return JSON.parse(response.text);
  } catch (err: any) {
    console.error("Neural Error:", err);
    if (err.message?.includes('403') || err.message?.includes('API_KEY_INVALID')) {
      throw new Error("403: Invalid API Key. Access denied.");
    }
    if (err.message?.includes('429')) {
      throw new Error("429: Rate limit reached. Breathe.");
    }
    if (err instanceof SyntaxError) {
      throw new Error("Neural synthesis failed. Data corruption.");
    }
    throw new Error(err.message || "Neural connection failed.");
  }
};

export const suggestSubtasks = async (apiKey: string, taskTitle: string, mode: AILevel) => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Provide 3 actionable, minimalist subtasks for: "${taskTitle}".`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPTS[mode] + " Return strictly a JSON array of strings.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    return JSON.parse(response.text) as string[];
  } catch (err) {
    throw new Error("Subtask generation failed.");
  }
};

export const getReflection = async (
    apiKey: string,
    completedTasks: Task[],
    skippedTasks: Task[],
    mode: AILevel
) => {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Reflect on this day: ${completedTasks.length} done, ${skippedTasks.length} missed. Mode: ${mode}. Keep it under 15 words.`;
      
      const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
              systemInstruction: "You are a stoic mentor. Provide a short, calm reflection."
          }
      });
      return response.text;
    } catch (err) {
      return "The day ends. Rest and recalibrate.";
    }
};
