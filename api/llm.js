// api/llm.js
// LLM API Layer — provider-agnostic.
// To switch providers: update PROVIDER config and implement the corresponding
// buildRequest / parseResponse pair below.
//
// Supported out of the box:
//   "groq"        — https://console.groq.com
//   "openrouter"  — https://openrouter.ai
//   "openai"      — https://platform.openai.com
//
// HOW TO ACTIVATE:
//   1. Obtain an API key from your chosen provider.
//   2. Set PROVIDER.name and PROVIDER.apiKey below.
//   3. Reload the extension.

const PROVIDER = {
  name:   "groq",                      // "groq" | "openrouter" | "openai"
  apiKey: "YOUR_API_KEY_HERE",         // ← Replace with your real key
  model:  "llama-3.1-8b-instant",            // Groq default; change per provider
};

// ── Provider definitions ─────────────────────────────────────────────────────

const PROVIDERS = {
  groq: {
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    headers: (key) => ({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    }),
    buildBody: (model, messages) => ({
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
    parseResponse: (data) => {
      if (data.error) throw new Error(data.error.message || "Groq API error");
      return data.choices?.[0]?.message?.content?.trim() ?? "(empty response)";
    },
  },

  openrouter: {
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    headers: (key) => ({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "HTTP-Referer": "https://guptx.extension",
      "X-Title": "GuptX",
    }),
    buildBody: (model, messages) => ({
      model: model || "openai/gpt-3.5-turbo",
      messages,
      max_tokens: 1024,
    }),
    parseResponse: (data) => {
      if (data.error) throw new Error(data.error.message || "OpenRouter error");
      return data.choices?.[0]?.message?.content?.trim() ?? "(empty response)";
    },
  },

  openai: {
    endpoint: "https://api.openai.com/v1/chat/completions",
    headers: (key) => ({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    }),
    buildBody: (model, messages) => ({
      model: model || "gpt-3.5-turbo",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
    parseResponse: (data) => {
      if (data.error) throw new Error(data.error.message || "OpenAI error");
      return data.choices?.[0]?.message?.content?.trim() ?? "(empty response)";
    },
  },
};

// ── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = {
  role: "system",
  content:
    "You are GuptX, a concise and intelligent AI assistant embedded in the user's browser. " +
    "Answer clearly and briefly. If asked about the current page, note you cannot see it directly. " +
    "Be helpful, direct, and professional.",
};

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * sendMessage — sends a conversation to the configured LLM and returns the reply.
 *
 * @param {Array<{role: string, content: string}>} messages  Chat history
 * @returns {Promise<string>}  The assistant's reply text
 */
async function sendMessage(messages) {
  if (PROVIDER.apiKey === "YOUR_API_KEY_HERE" || !PROVIDER.apiKey) {
    throw new Error(
      "No API key configured. Open api/llm.js and set PROVIDER.apiKey."
    );
  }

  const provider = PROVIDERS[PROVIDER.name];
  if (!provider) {
    throw new Error(`Unknown provider: "${PROVIDER.name}"`);
  }

  // Prepend system prompt; ensure it appears only once
  const fullMessages = [
    SYSTEM_PROMPT,
    ...messages.filter((m) => m.role !== "system"),
  ];

  const response = await fetch(provider.endpoint, {
    method: "POST",
    headers: provider.headers(PROVIDER.apiKey),
    body: JSON.stringify(provider.buildBody(PROVIDER.model, fullMessages)),
  });

  // Handle HTTP-level errors
  if (!response.ok) {
    let errText = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      errText = errJson?.error?.message || errText;
    } catch (_) {}
    throw new Error(errText);
  }

  const data = await response.json();
  return provider.parseResponse(data);
}

// Exposed as a plain const — accessible to content.js which loads after this file.
// (All three files share the same content-script scope per manifest load order.)
const GuptXLLM = { sendMessage };
