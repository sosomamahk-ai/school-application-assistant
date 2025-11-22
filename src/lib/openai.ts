import OpenAI from 'openai';

// Allow the app to run without API key (will use mock mode)
const apiKey = process.env.OPENAI_API_KEY || 'mock-api-key';

// Support proxy configuration for regions where OpenAI is restricted
// Set OPENAI_BASE_URL to use a proxy (e.g., https://your-proxy.com/v1)
const baseURL = process.env.OPENAI_BASE_URL || process.env.OPENAI_PROXY_URL;

export const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      ...(baseURL && { baseURL }), // Use proxy if configured
    })
  : null as any; // Mock client when API key is not available

export default openai;

