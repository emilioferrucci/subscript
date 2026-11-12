/* SPDX-License-Identifier: MIT */
(async () => {
  const status = document.getElementById("status");
  try {
    const [tab] = await browser.tabs.query({active: true, currentWindow: true});
    const {states} = await browser.tabs.sendMessage(tab.id, {type: "subscript:status"});
    status.textContent = !states.length ? "Open a ChatGPT prompt box." :
      states.every(state => state === "active") ? "Protection attached to the editor." :
      "Protection unavailable. Reload ChatGPT; if this persists, an update is needed.";
  } catch {
    status.textContent = "Open ChatGPT and reload the page to attach protection.";
  }
})();
