// gallery.js — Handles wallet connection, owned NFTs, and user’s marketplace listings

/* ---------- BOOTSTRAP ---------- */
window.addEventListener("DOMContentLoaded", () => {
  // Attach Connect button handler
  const btn = document.getElementById("connectBtn");
  if (btn) btn.addEventListener("click", connectWallet);
});

/**
 * Updates the wallet status badge.
 */
function setStatus(text) {
  const el = document.getElementById("walletStatus");
  if (el) el.textContent = text;
}

/**
 * Connects wallet and loads page data.
 */
async function connectWallet() {
  try {
    await window.app.connect();
    setStatus(`Connected: ${window.app.userAddress}`);
  } catch (e) {
    console.error(e);
    return setStatus("Connection failed");
  }

  // Load owned NFTs if container exists
  if (document.getElementById("owned")) {
    await loadOwnedNFTs();
  }
  // Load user's listings if gallery container exists
  if (document.getElementById("gallery")) {
    await loadMyListings();
  }
}

/* ---------- CONFIG & ABIs ---------- */
const nftContractAddress      = "0x4bA7161d0FAF245c0c8bA83890c121a3D9Fe3AC9";
const marketplaceAddress      = "0x64e224c19611b302E06aAa7CC2D8aFEABE7cA648";
const nftABI = [
  "function balanceOf(address) view returns (uint256)",
  "function tokenOfOwnerByIndex(address,uint256) view returns (uint256)",
  "function ownerOf(uint256) view returns (address)"
];
const directABI = [
  "function totalListings() view returns (uint256)",
  "function getAllValidListings(uint256,uint256) view returns (tuple(uint256 listingId,uint256 tokenId,uint256 quantity,uint256 pricePerToken,uint128 startTimestamp,uint128 endTimestamp,address listingCreator,address assetContract,address currency,uint8 tokenType,uint8 status,bool reserved)[])",
];

/* ---------- LOAD OWNED NFTs ---------- */
async function loadOwnedNFTs() {
  const cont = document.getElementById("owned");
  cont.innerHTML = "";

  const nft = new ethers.Contract(nftContractAddress, nftABI, window.app.signer);
  const balanceBN = await nft.balanceOf(window.app.userAddress);
  const balance = balanceBN.toNumber();

  if (balance === 0) {
    cont.innerHTML = '<p>You don’t own any GCC NFTs yet.</p>';
    return;
  }

  for (let i = 0; i < balance; i++) {
    const tokenIdBN = await nft.tokenOfOwnerByIndex(window.app.userAddress, i);
    const tokenId = tokenIdBN.toNumber();

    const card = document.createElement("div");
    card.className = "nft-card";

    const img = document.createElement("img");
    img.src = `NFT/${tokenId}.png`;
    img.alt = `NFT #${tokenId}`;
    img.addEventListener("error", () => img.src = "NFT/placeholder.png");
    card.appendChild(img);

    const caption = document.createElement("p");
    caption.innerHTML = `<strong>Token ID:</strong> ${tokenId}`;
    card.appendChild(caption);

    cont.appendChild(card);
  }
}

/* ---------- LOAD USER LISTINGS ---------- */
async function loadMyListings() {
  const cont = document.getElementById("gallery");
  cont.innerHTML = "";

  const market = new ethers.Contract(marketplaceAddress, directABI, window.app.provider);
  const totalBN = await market.totalListings();
  const total = totalBN.toNumber();

  if (total === 0) {
    cont.innerHTML = '<p>No listings available.</p>';
    return;
  }

  const end = Math.min(total - 1, 19);
  let listings = await market.getAllValidListings(0, end);
  // Filter to only user's listings
  listings = listings.filter(l =>
    l.listingCreator.toLowerCase() === window.app.userAddress.toLowerCase()
  );

  if (listings.length === 0) {
    cont.innerHTML = '<p>You have no active listings.</p>';
    return;
  }

  listings.forEach(l => {
    const tokenId = l.tokenId.toNumber();
    const price = ethers.utils.formatEther(l.pricePerToken);

    const card = document.createElement("div");
    card.className = "nft-card";

    const img = document.createElement("img");
    img.src = `NFT/${tokenId}.png`;
    img.alt = `NFT #${tokenId}`;
    img.addEventListener("error", () => img.src = "NFT/placeholder.png");
    card.appendChild(img);

    const caption = document.createElement("p");
    caption.innerHTML = `<strong>Token ID:</strong> ${tokenId}`;
    card.appendChild(caption);

    const priceEl = document.createElement("p");
    priceEl.innerHTML = `<strong>Price:</strong> ${price} BNB`;
    card.appendChild(priceEl);

    cont.appendChild(card);
  });
}

// Expose connect for button
window.connectWallet = connectWallet;
