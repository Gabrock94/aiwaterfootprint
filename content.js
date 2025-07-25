console.log("Query Counter content script loaded.");

// Helper to get provider
function getProvider() {
  if (location.hostname.includes("chat.openai.com") || location.hostname.includes("chatgpt.com")) {
    return "gpt";
  } else if (location.hostname.includes("gemini.google.com")) {
    return "gemini";
  } else if (location.hostname.includes("claude.ai")) {
    return "claude";
  }
  return "unknown";
}

// Helper to get today's date string
function getToday() {
  return new Date().toISOString().slice(0, 10); // e.g., "2025-07-17"
}

// Counter logic
function incrementCounter(provider) {
  const today = getToday();
  chrome.storage.local.get("usage", (res) => {
    const usage = res.usage || {};
    usage[provider] = usage[provider] || { total: 0, daily: {} };
    usage[provider].total += 1;
    usage[provider].daily[today] = (usage[provider].daily[today] || 0) + 1;
    chrome.storage.local.set({ usage }, () => {
      console.log(`✅ Incremented ${provider} usage → Total: ${usage[provider].total}, Today: ${usage[provider].daily[today]}`);
    });
  });
}

// --- Site-specific observers ---

function observeChatGPT() {
  const chatMain = document.querySelector("main");
  if (!chatMain) {
    console.warn("⚠️ Could not find ChatGPT main element.");
    return;
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (
          node.nodeType === 1 &&
          node.querySelector?.('[data-message-author-role="user"]')
        ) {
          incrementCounter("gpt");
        }
      }
    }
  });

  observer.observe(chatMain, { childList: true, subtree: true });
  console.log("👀 Observing ChatGPT for user prompts...");
}

// Updated Gemini observer with stricter deduplication logic
function observeGemini() {
  const target = document.body;
  if (!target) {
    console.warn("⚠️ Could not find Gemini body element.");
    return;
  }

  const seenText = new Set();
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;

        // Look for query elements
        const messageNodes = [
          ...node.querySelectorAll?.('[data-test-id="user-message-text"]') || [],
          ...node.querySelectorAll?.('.user-query-bubble-with-background') || []
        ];

        for (const el of messageNodes) {
          const text = el.innerText?.trim();
          if (text && !seenText.has(text)) {
            seenText.add(text);
            incrementCounter("gemini");
          }
        }
      }
    }
  });

  observer.observe(target, { childList: true, subtree: true });
  console.log("👀 Observing Gemini for user prompts (deduplicated by text)...");
}

// Claude observer
function observeClaude() {
  const target = document.body;
  if (!target) {
    console.warn("⚠️ Could not find Claude body element.");
    return;
  }

  const seenText = new Set();
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;

        // Look for user message elements in Claude
        // Claude uses various selectors for user messages
        const messageNodes = [
          ...node.querySelectorAll?.('[data-is-streaming="false"] .font-user-message') || [],
          ...node.querySelectorAll?.('.font-user-message') || [],
          ...node.querySelectorAll?.('[data-testid="user-message"]') || [],
          // Fallback: look for elements that might contain user messages
          ...Array.from(node.querySelectorAll?.('div') || []).filter(el => {
            const text = el.innerText?.trim();
            return text && 
                   el.closest('[data-is-streaming="false"]') && 
                   !el.querySelector('svg') && // Avoid icon containers
                   text.length > 10 && // Reasonable message length
                   !text.includes('Claude') && // Avoid Claude's responses
                   el.offsetHeight > 0; // Visible elements only
          })
        ];

        for (const el of messageNodes) {
          const text = el.innerText?.trim();
          if (text && !seenText.has(text)) {
            // Additional check to ensure this looks like a user message
            const parent = el.closest('[data-is-streaming="false"]');
            if (parent && text.length > 5) {
              seenText.add(text);
              incrementCounter("claude");
            }
          }
        }
      }
    }
  });

  observer.observe(target, { childList: true, subtree: true });
  console.log("👀 Observing Claude for user prompts (deduplicated by text)...");
}

// --- Start ---
const provider = getProvider();
console.log(`🌐 Detected provider: ${provider}`);

if (provider === "gpt") {
  observeChatGPT();
} else if (provider === "gemini") {
  observeGemini();
} else if (provider === "claude") {
  observeClaude();
} else {
  console.warn("❓ Unknown provider — not observing.");
}