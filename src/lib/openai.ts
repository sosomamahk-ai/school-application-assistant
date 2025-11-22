import OpenAI from 'openai';
import https from 'https';

// Allow the app to run without API key (will use mock mode)
const apiKey = process.env.OPENAI_API_KEY || 'mock-api-key';

// Support proxy configuration for regions where OpenAI is restricted
// Set OPENAI_BASE_URL to use a proxy (e.g., https://your-proxy.com)
// Note: Don't include /v1 in the baseURL, OpenAI SDK will add it automatically
const baseURL = process.env.OPENAI_BASE_URL || process.env.OPENAI_PROXY_URL;

// Log configuration (always log in server-side contexts)
// Check if we're in a server context (Node.js environment)
const isServer = typeof window === 'undefined';

// Check if API key is set and not a mock value (must be defined before logging)
const hasValidApiKey = process.env.OPENAI_API_KEY && 
                       process.env.OPENAI_API_KEY !== 'mock-api-key' &&
                       typeof process.env.OPENAI_API_KEY === 'string' &&
                       process.env.OPENAI_API_KEY.trim().length > 0;

if (isServer) {
  console.log('[OpenAI Config] Initializing OpenAI client...');
  console.log(`[OpenAI Config] API Key: ${apiKey && apiKey !== 'mock-api-key' ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
  console.log(`[OpenAI Config] Base URL: ${baseURL || 'NOT SET (using default: https://api.openai.com)'}`);
  console.log(`[OpenAI Config] Raw OPENAI_API_KEY from env: ${process.env.OPENAI_API_KEY ? 'SET (' + process.env.OPENAI_API_KEY.length + ' chars)' : 'NOT SET'}`);
  console.log(`[OpenAI Config] Has valid API key: ${hasValidApiKey}`);
  
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

export const openai = hasValidApiKey
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      ...(baseURL && { 
        baseURL: baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL, // Remove trailing slash if present
      }), // Use proxy if configured
      httpAgent: httpsAgent, // Use custom HTTPS agent for better error handling
      timeout: 60000, // 60 seconds timeout
      maxRetries: 2, // Retry failed requests
    })
  : null as any; // Mock client when API key is not available

// Log client status (always log in server-side contexts)
if (isServer) {
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

