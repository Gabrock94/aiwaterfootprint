const today = new Date().toISOString().slice(0, 10);

function updateDisplay(usage) {
  const gpt = usage.gpt || { total: 0, daily: {} };
  const gemini = usage.gemini || { total: 0, daily: {} };

  // document.getElementById("gpt-count").innerText =
  //   // `Today: ${gpt.daily[today] || 0} Total: ${gpt.total}`;
  //   `Today: ${gpt.daily[today] || 0}`; // Total: ${gpt.total}`;

  // document.getElementById("gemini-count").innerText =
  //   `Today: ${gemini.daily[today] || 0}, Total: ${gemini.total}`;

  let totalTodayCount = 0;

  for (const provider in usage) {
    const dailyCounts = usage[provider]?.daily || {};
    totalTodayCount += dailyCounts[today] || 0;
  }
  
  document.getElementById("today-count").innerText =
    `Today, you have interacted with AI models ${totalTodayCount || 0} different times.`;
  document.getElementById("count-by-provider").innerText = 
    `You have engaged with ChatGPT ${gpt.daily[today] || 0} times, and with Gemini ${gemini.daily[today] || 0} times.`;

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

  let comparison;
  if (liters < 1) {
    comparison = `About the same as drinking a glass of water (${liters.toFixed(2)} L)`;
  } else if (liters < 10) {
    comparison = `About the same as a short 5-minute shower (${liters.toFixed(1)} L)`;
  } else if (liters < 50) {
    comparison = `About the same as washing dishes by hand (${liters.toFixed(0)} L)`;
  } else {
    comparison = `A significant amount, comparable to several household water uses (${liters.toFixed(0)} L)`;
  }

  return `<strong>Your estimated daily water footprint from AI queries is ~${liters.toFixed(2)} liters.</strong><br> ${comparison}.`;
}

function updateWaterUsageDisplay(queryCount) {
  const message = waterUsageMessage(queryCount);
  document.getElementById("water-usage").innerHTML = message;
}
