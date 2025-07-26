// shared.js
window.app = window.app || {
  provider: null,
  signer: null,
  userAddress: null,

  async connect() {
    if (!window.ethereum) throw new Error("MetaMask not found");

    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await this.provider.listAccounts();
    if (accounts.length === 0) {
      await this.provider.send("eth_requestAccounts", []);
    }

    this.signer = this.provider.getSigner();
    this.userAddress = await this.signer.getAddress();

    sessionStorage.setItem("walletConnected", "true");
  },

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.userAddress = null;
    sessionStorage.removeItem("walletConnected");
  },

  async isConnected() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();
      return accounts.length > 0;
    } catch {
      return false;
    }
  }
};
