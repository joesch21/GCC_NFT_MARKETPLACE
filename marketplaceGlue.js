// marketplaceGlue.js — wires buttons & initial load (CSP-safe)
document.addEventListener("DOMContentLoaded", async () => {
  const connectBtn    = document.getElementById("connectBtn");
  const disconnectBtn = document.getElementById("disconnectBtn");

  /* ---------- helpers ---------- */
  const updateUI = (connected) => {
    const status = document.getElementById("walletStatus");
    if (connected && window.app.userAddress) {
      status.textContent = `Connected: ${window.app.userAddress}`;
      connectBtn.classList.add("hidden");
      disconnectBtn.classList.remove("hidden");
    } else {
      status.textContent = "Wallet not connected";
      connectBtn.classList.remove("hidden");
      disconnectBtn.classList.add("hidden");
    }
  };

  /* ---------- connect ---------- */
  connectBtn.addEventListener("click", async () => {
    try {
      await window.app.connect();
      updateUI(true);
      await window.loadMarketplace();
    } catch (err) {
      console.error(err);
      updateUI(false);
    }
  });

  /* ---------- disconnect ---------- */
  disconnectBtn.addEventListener("click", () => {
    window.app.disconnect();
    updateUI(false);
    document.getElementById("marketplace").innerHTML =
      '<p>Please reconnect your wallet to view listings.</p>';
  });

  /* ---------- auto-load if already connected ---------- */
  if (sessionStorage.getItem("walletConnected")) {
    try {
      await window.app.connect();
      updateUI(true);
      await window.loadMarketplace();
    } catch {
      updateUI(false);
    }
  }
});