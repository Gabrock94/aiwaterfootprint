function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function updateBadgeFromUsage(usage) {
  const today = getToday();
  let totalTodayCount = 0;

  for (const provider in usage) {
    const dailyCounts = usage[provider]?.daily || {};
    totalTodayCount += dailyCounts[today] || 0;
  }

  chrome.browserAction.setBadgeText({ text: totalTodayCount.toString() });
  chrome.browserAction.setBadgeBackgroundColor({ color: "#4688F1" });
}

// On storage change listener
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.usage) {
    updateBadgeFromUsage(changes.usage.newValue || {});
  }
});

// Also update badge at startup
chrome.storage.local.get("usage", (res) => {
  updateBadgeFromUsage(res.usage || {});
});
