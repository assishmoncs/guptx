const PROVIDER = {
  name:   "groq",                      
  apiKey: "YOUR_API_KEY_HERE",         
  model:  "llama-3.1-8b-instant",            
};

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

const SYSTEM_PROMPT = {
  role: "system",
  content:
    "You are GuptX, a concise and intelligent AI assistant embedded in the user's browser. " +
    "Answer clearly and briefly. If asked about the current page, note you cannot see it directly. " +
    "Be helpful, direct, and professional.",
};

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

  
  const fullMessages = [
    SYSTEM_PROMPT,
    ...messages.filter((m) => m.role !== "system"),
  ];

  const response = await fetch(provider.endpoint, {
    method: "POST",
    headers: provider.headers(PROVIDER.apiKey),
    body: JSON.stringify(provider.buildBody(PROVIDER.model, fullMessages)),
  });

  
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

const GuptXLLM = { sendMessage };
