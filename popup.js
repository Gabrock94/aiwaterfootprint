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

  function formatProviderCounts(providerCounts) {
    if (providerCounts.length === 0) return "";
    if (providerCounts.length === 1) return providerCounts[0];
    if (providerCounts.length === 2) return providerCounts.join(" and ");
    return providerCounts.slice(0, -1).join(", ") + ", and " + providerCounts.slice(-1);
  }

  // Example usage:
  const formatted = formatProviderCounts(providerCounts);
  document.getElementById("count-by-provider").innerText = `You have engaged with ${formatted}.`;

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

  // Helper to show a familiar kitchen equivalent alongside liters
  function cupsFromLiters(l) {
    const cups = l / 0.24; // ~240 mL per cup
    if (cups < 0.5) return "";
    const precision = cups < 3 ? 1 : 0;
    return ` (~${cups.toFixed(precision)} cups)`;
  }

  const comparisons = [
    { max: 0.005, label: "a teaspoon of water 🫖" },
    { max: 0.015, label: "a tablespoon of water 🥄" },
    { max: 0.25, label: "watering a small plant 🌿" },
    { max: 0.5, label: "brushing your teeth with the tap off 🪥" },
    { max: 1, label: "drinking a large glass of water 🥛" },
    { max: 3, label: "washing your hands quickly 🧼" },
    { max: 6, label: "a modern toilet flush 🚽" },
    { max: 10, label: "a 1‑minute shower 🚿" },
    { max: 30, label: "washing dishes by hand 🍽️" },
    { max: 60, label: "a short 5–7 minute shower 🚿" },
    { max: 90, label: "a full load in the washing machine 🧺" },
    { max: 150, label: "a filled bathtub 🛁" },
    { max: 300, label: "watering a medium garden 🌱" },
    { max: 500, label: "washing a car with a hose 🚗" }
  ];


  // Find the best match
  const match = comparisons.find(c => liters <= c.max) ||
                { label: "several high‑usage household tasks combined" };

  const intros = [
    "That's approximately",
    "Roughly equal to",
    "In everyday terms, that's like",
    "Think",
    "Picture",
    "About"
  ];
  const intro = intros[Math.floor(Math.random() * intros.length)];

  return `<strong>${intro} ${liters.toFixed(2)} L${cupsFromLiters(liters)}</strong> — like ${match.label}.`;
}

function updateWaterUsageDisplay(queryCount) {
  const message = waterUsageMessage(queryCount);
  document.getElementById("water-usage").innerHTML = message;

  // Show a rotating fun fact
  const facts = [
    "Turning off the tap while brushing can save up to 6 L per minute 🪥",
    "A modern dishwasher can use less water than hand washing 🍽️",
    "Fixing a dripping tap can save thousands of liters a year 💧",
    "Shortening your shower by 1 minute can save ~10 L 🚿",
    "It takes water to make electricity; saving energy saves water ⚡💧",
    "Cloud data centers also consume water for cooling — efficiency matters ☁️"
  ];
  const fact = facts[Math.floor(Math.random() * facts.length)];
  const factEl = document.getElementById("fun-fact");
  if (factEl) {
    factEl.style.opacity = "0";
    // next frame to trigger transition
    requestAnimationFrame(() => {
      factEl.textContent = `Did you know? ${fact}`;
      factEl.style.opacity = "1";
    });
  }

  // Visuals: progress bar, badge, and wave scaling
  const liters = estimateDailyWaterLiters(queryCount);

  // Accurate hybrid mapping with early feedback:
  // 0–1 L -> 0–33% (linear), 1–10 L -> 33–66% (log), 10–100 L -> 66–100% (log)
  function litersToPercent(l) {
    const clamped = Math.max(0, Math.min(l, 100));
    if (clamped <= 1) {
      return clamped * 33; // linear 0..33
    }
    const logv = Math.log10(clamped);
    if (clamped <= 10) {
      // log10 range 0..1 maps to 33..66
      return 33 + (logv - 0) * 33;
    }
    // log10 range 1..2 maps to 66..100
    return 66 + (logv - 1) * 34;
  }

  let percent = litersToPercent(liters);
  if (queryCount > 0) percent = Math.max(percent, 2); // ensure visible movement on first queries
  const track = document.getElementById("usage-track");
  const fill = document.getElementById("usage-fill");
  const thumb = document.getElementById("usage-thumb");
  if (fill && thumb && track) {
    const pct = percent;
    fill.style.width = pct + "%";
    thumb.style.left = pct + "%";
    fill.style.transition = "width .35s ease, background .35s ease";
    thumb.style.transition = "left .35s ease, background .35s ease, box-shadow .35s ease";
    // Color ramps with percent
    const hue = 200 - Math.floor((pct / 100) * 80); // 200->120
    fill.style.background = `linear-gradient(90deg, hsl(${hue},85%,55%), hsl(${Math.max(120,hue-20)},70%,50%))`;
    thumb.style.background = `hsl(${hue},85%,50%)`;
    // pulse thumb on update
    thumb.classList.remove("thumb-pulse");
    void thumb.offsetWidth;
    thumb.classList.add("thumb-pulse");
  }

  const badge = document.getElementById("usage-badge");
  if (badge) {
    const prev = badge.textContent || "Low";
    let label = "Low"; let bg = "#e0f2fe"; let fg = "#075985";
    if (percent >= 70) { label = "High"; bg = "#fee2e2"; fg = "#991b1b"; }
    else if (percent >= 40) { label = "Moderate"; bg = "#fef9c3"; fg = "#713f12"; }
    badge.textContent = label;
    badge.style.background = bg; badge.style.color = fg;
    if (label !== prev) {
      badge.classList.remove("badge-pop");
      void badge.offsetWidth;
      badge.classList.add("badge-pop");
    }
  }

  // Adjust wave offsets for a subtle amplitude effect
  const wave1 = document.getElementById("wave1");
  const wave2 = document.getElementById("wave2");
  const wave3 = document.getElementById("wave3");
  const wave4 = document.getElementById("wave4");
  const amp = Math.min(10, Math.floor(percent / 10)); // 0..10
  if (wave1) wave1.setAttribute("y", String(0 - Math.floor(amp * 0.3)));
  if (wave2) wave2.setAttribute("y", String(3 - Math.floor(amp * 0.2)));
  if (wave3) wave3.setAttribute("y", String(5 - Math.floor(amp * 0.1)));
  if (wave4) wave4.setAttribute("y", String(7));

  // speed modulation for waves
  const group = document.getElementById("parallax-group");
  if (group) {
    const speedFactor = 1 + Math.min(1, percent / 100); // 1..2x
    const base1 = 7 / speedFactor;
    const base2 = 10 / speedFactor;
    const base3 = 13 / speedFactor;
    const base4 = 20 / speedFactor;
    // apply via style animation-duration by writing inline styles on each child
    const uses = group.getElementsByTagName("use");
    if (uses && uses.length >= 4) {
      uses[0].style.animationDuration = base1 + "s";
      uses[1].style.animationDuration = base2 + "s";
      uses[2].style.animationDuration = base3 + "s";
      uses[3].style.animationDuration = base4 + "s";
    }
  }
}
