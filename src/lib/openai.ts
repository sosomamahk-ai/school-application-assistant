import OpenAI from 'openai';

// Allow the app to run without API key (will use mock mode)
const apiKey = process.env.OPENAI_API_KEY || 'mock-api-key';

export const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null as any; // Mock client when API key is not available

export default openai;

