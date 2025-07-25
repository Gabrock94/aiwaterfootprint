const today = new Date().toISOString().slice(0, 10);

function updateDisplay(usage) {
  const gpt = usage.gpt || { total: 0, daily: {} };
  const gemini = usage.gemini || { total: 0, daily: {} };
  const claude = usage.claude || { total: 0, daily: {} };
  console.log(claude);
  console.log(gpt);
  let totalTodayCount = 0;

  for (const provider in usage) {
    const dailyCounts = usage[provider]?.daily || {};
    totalTodayCount += dailyCounts[today] || 0;
  }
  
if (totalTodayCount > 0) {
  const timeText = totalTodayCount === 1 ? "1 time" : `${totalTodayCount} times`;
  document.getElementById("today-count").innerText =
    `Today, you have interacted with AI models ${timeText}.`;

  
  const providerCounts = [];
  const gptCount = gpt.daily[today] || 0;
  const geminiCount = gemini.daily[today] || 0;
  const claudeCount = claude.daily[today] || 0;

  if (gptCount > 0) {
    providerCounts.push(`ChatGPT ${gptCount === 1 ? "1 time" : `${gptCount} times`}`);
  }
  if (geminiCount > 0) {
    providerCounts.push(`Gemini ${geminiCount === 1 ? "1 time" : `${geminiCount} times`}`);
  }
  if (claudeCount > 0) {
    providerCounts.push(`Claude ${claudeCount === 1 ? "1 time" : `${claudeCount} times`}`);
  }

  document.getElementById("count-by-provider").innerText =  `You have engaged with ${providerCounts.join(" and ")}.`;
} else {
  document.getElementById("today-count").innerText =
    `You haven't interacted with AI models yet today.`;
}

  updateWaterUsageDisplay(totalTodayCount);
}

// Load usage from storage
chrome.storage.local.get("usage", (res) => {
  updateDisplay(res.usage || {});
});

// Reset GPT button
document.getElementById("reset-gpt").addEventListener("click", () => {
  chrome.storage.local.get("usage", (res) => {
    const usage = res.usage || {};
    usage.gpt = { total: 0, daily: {} };
    chrome.storage.local.set({ usage }, () => updateDisplay(usage));
  });
});

// Reset Gemini button
document.getElementById("reset-gemini").addEventListener("click", () => {
  chrome.storage.local.get("usage", (res) => {
    const usage = res.usage || {};
    usage.gemini = { total: 0, daily: {} };
    chrome.storage.local.set({ usage }, () => updateDisplay(usage));
  });
});

function estimateDailyWaterLiters(queryCount) {
  const waterPerQueryLiters = 0.01; // 10 mL per query
  return queryCount * waterPerQueryLiters;
}

function waterUsageMessage(queryCount) {
  const liters = estimateDailyWaterLiters(queryCount);

const comparisons = [
  { max: 0.005, label: "a teaspoon of water 🫖" },
  { max: 0.015, label: "a tablespoon of water 🥄" },
  { max: 0.25, label: "watering a small plant 🌿" },
  { max: 0.5, label: "brushing your teeth with the tap off 🪥" },
  { max: 1, label: "drinking a large glass of water 🥛" },
  { max: 3, label: "washing your hands quickly 🧼" },
  { max: 6, label: "a modern toilet flush 🚽" },
  { max: 10, label: "a 1-minute shower 🚿" },
  { max: 30, label: "washing dishes by hand 🍽️" },
  { max: 60, label: "a short 5–7 minute shower 🚿" },
  { max: 90, label: "a full load in the washing machine 🧺" },
  { max: 150, label: "a filled bathtub 🛁" },
  { max: 300, label: "watering a medium garden 🌱" },
  { max: 500, label: "washing a car with a hose 🚗" }
];


  // Find the best match
  const match = comparisons.find(c => liters <= c.max) || 
                { label: "several high-usage household tasks combined" };

  return `<strong>Your estimated daily water footprint from AI queries is about ${liters.toFixed(2)} liters.</strong><br> It is roughly equivalent to ${match.label}.`;
}

function updateWaterUsageDisplay(queryCount) {
  const message = waterUsageMessage(queryCount);
  document.getElementById("water-usage").innerHTML = message;
}
