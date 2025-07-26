// marketplaceLogic.js — load and render active ERC721 listings and purchase with GCC token

const marketplaceAddress = "0x64e224c19611b302E06aAa7CC2D8aFEABE7cA648";
const nftContractAddress = "0x4bA7161d0FAF245c0c8bA83890c121a3D9Fe3AC9";
const paymentTokenAddress = "0x092aC429b9c3450c9909433eB0662c3b7c13cF9A"; // GCC token

// ABIs
const marketplaceABI = [
  "function totalListings() view returns (uint256)",
  "function getAllValidListings(uint256,uint256) view returns (tuple(uint256 listingId,uint256 tokenId,uint256 quantity,uint256 pricePerToken,uint128 startTimestamp,uint128 endTimestamp,address listingCreator,address assetContract,address currency,uint8 tokenType,uint8 status,bool reserved)[])",
  "function buyFromListing(uint256,address,uint256,address,uint256)"
];
const erc20ABI = [
  "function approve(address,uint256)"
];

async function loadMarketplace() {
  const provider = window.app.provider;
  const signer  = window.app.signer;
  const now     = Math.floor(Date.now() / 1000);
  const contractRead = new ethers.Contract(marketplaceAddress, marketplaceABI, provider);

  try {
    // 1) Fetch total listings
    const total = (await contractRead.totalListings()).toNumber();
    console.log('[marketplace] totalListings:', total);

    // 2) Fetch valid listings range
    const startId = 0;
    const endId   = total > 0 ? total - 1 : 0;
    console.log('[marketplace] fetching valid listings from', startId, 'to', endId);

    // 3) Read all valid listings
    const allRaw = total > 0
      ? await contractRead.getAllValidListings(startId, endId)
      : [];
    console.log('[marketplace] all valid listings raw:', allRaw);

    // 4) Filter: our collection, ERC-721, nonzero quantity, active, correct timeframe
    const listings = allRaw.filter(l =>
      l.assetContract.toLowerCase() === nftContractAddress.toLowerCase() &&
      l.tokenType === 0 &&
      !l.reserved &&
      l.status === 1 &&
      l.quantity.gt(0) &&
      l.startTimestamp.lte(now) &&
      (l.endTimestamp.eq(0) || l.endTimestamp.gt(now))
    );
    console.log('[marketplace] filtered listings:', listings);

    // 5) Render
    const container = document.getElementById('marketplace');
    container.innerHTML = '';
    if (listings.length === 0) {
      container.innerHTML = '<p>No active listings available.</p>';
      return;
    }

    listings.forEach(l => {
      const id = l.listingId.toString();
      const price = l.pricePerToken.toString();
      const tokenId = l.tokenId.toString();

      const card = document.createElement('div');
      card.className = 'nft-card';
      card.innerHTML = `
        <img src="NFT/${tokenId}.png" alt="NFT #${tokenId}" onerror="this.src='NFT/placeholder.png'" />
        <p><strong>Token #${tokenId}</strong></p>
        <p>${ethers.utils.formatEther(price)} GCC</p>
        <button data-id="${id}" data-price="${price}">Buy</button>
      `;
      container.appendChild(card);
    });

    // 6) Hook buy buttons
    const contractWrite = new ethers.Contract(marketplaceAddress, marketplaceABI, signer);
    const tokenContract = new ethers.Contract(paymentTokenAddress, erc20ABI, signer);

    container.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id    = btn.dataset.id;
        const price = btn.dataset.price;
        try {
          console.log('[marketplace] approving payment token...');
          const approveTx = await tokenContract.approve(marketplaceAddress, price);
          await approveTx.wait();

          console.log('[marketplace] buying listing', id);
          const tx = await contractWrite.buyFromListing(
            Number(id),
            await window.app.userAddress,
            1,
            paymentTokenAddress,
            price
          );
          await tx.wait();
          console.log('[marketplace] purchase complete');
          window.showToast('Purchase successful!');
          loadMarketplace();
        } catch (err) {
          console.error('[marketplace] purchase failed', err);
          window.showToast(`Purchase failed: ${err.error?.message || err.message}`);
        }
      });
    });

  } catch (err) {
    console.error('[marketplace] load error', err);
    const container = document.getElementById('marketplace');
    container.innerHTML = `<p>Error loading listings: ${err.reason || err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadMarketplace);
window.loadMarketplace = loadMarketplace;
