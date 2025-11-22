import OpenAI from 'openai';
import https from 'https';

// Allow the app to run without API key (will use mock mode)
const apiKey = process.env.OPENAI_API_KEY || 'mock-api-key';

// Support proxy configuration for regions where OpenAI is restricted
// Set OPENAI_BASE_URL to use a proxy (e.g., https://your-proxy.com)
// Note: Don't include /v1 in the baseURL, OpenAI SDK will add it automatically
const baseURL = process.env.OPENAI_BASE_URL || process.env.OPENAI_PROXY_URL;

// Log configuration (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('[OpenAI Config] Initializing OpenAI client...');
  console.log(`[OpenAI Config] API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
  console.log(`[OpenAI Config] Base URL: ${baseURL || 'NOT SET (using default: https://api.openai.com)'}`);
  
  if (baseURL) {
    console.log(`[OpenAI Config] Using proxy: ${baseURL}`);
    console.log(`[OpenAI Config] Requests will go to: ${baseURL}/v1/*`);
  } else {
    console.log(`[OpenAI Config] Using default OpenAI API endpoint`);
  }
}

// Configure HTTPS agent with better timeout and error handling
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  timeout: 60000, // 60 seconds
  rejectUnauthorized: true, // Verify SSL certificates
});

// Create OpenAI client with proxy support
export const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      ...(baseURL && { 
        baseURL: baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL, // Remove trailing slash if present
      }), // Use proxy if configured
      httpAgent: httpsAgent, // Use custom HTTPS agent for better error handling
      timeout: 60000, // 60 seconds timeout
      maxRetries: 2, // Retry failed requests
    })
  : null as any; // Mock client when API key is not available

// Log client status
if (process.env.NODE_ENV === 'development') {
  if (openai) {
    console.log('[OpenAI Config] OpenAI client initialized successfully');
    if (baseURL) {
      console.log(`[OpenAI Config] Proxy configured: ${baseURL}`);
    }
  } else {
    console.warn('[OpenAI Config] OpenAI client not initialized (no API key)');
  }
}

export default openai;

