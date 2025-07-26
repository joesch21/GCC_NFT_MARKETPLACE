// app.js — central wallet connection and page loader

// Wait for DOM before attempting auto-connection
window.addEventListener("DOMContentLoaded", async () => {
  if (!window.ethereum) {
    const statusEl = document.getElementById("walletStatus");
    if (statusEl) statusEl.textContent = "MetaMask not found";
    return;
  }

  // Auto-connect if user was connected previously
  if (sessionStorage.getItem("walletConnected")) {
    try {
      await connectWallet();
    } catch (err) {
      console.error("Auto-connect failed:", err);
    }
  }
});

/**
 * Connects the wallet via shared.js, updates UI, and triggers page-specific loaders.
 */
async function connectWallet() {
  // Use shared.js abstraction
  await window.app.connect();
  sessionStorage.setItem("walletConnected", "true");

  // Update status badge
  const statusEl = document.getElementById("walletStatus");
  if (statusEl) statusEl.textContent = `Connected: ${window.app.userAddress}`;

  // Load marketplace listings if on marketplace page
  if (typeof loadMarketplace === 'function' && document.getElementById("marketplace")) {
    await loadMarketplace();
  }

  // Load owned NFTs if on homepage or gallery
  if (typeof loadOwned === 'function' && document.getElementById("myNFTs")) {
    await loadOwned();
  }
}

/**
 * Disconnects wallet and resets UI and page content.
 */
function disconnectWallet() {
  window.app.disconnect();
  sessionStorage.removeItem("walletConnected");

  const statusEl = document.getElementById("walletStatus");
  if (statusEl) statusEl.textContent = "Wallet not connected";

  const marketplaceEl = document.getElementById("marketplace");
  if (marketplaceEl) marketplaceEl.innerHTML = '<p>Please reconnect to view listings.</p>';

  const ownedEl = document.getElementById("myNFTs");
  if (ownedEl) ownedEl.innerHTML = '<p>Please reconnect to view your NFTs.</p>';
}

// Expose functions globally for HTML event handlers or buttons
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
