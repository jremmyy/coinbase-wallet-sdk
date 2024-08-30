// main.js
(function () {
  // We'll initialize the SDK after the script has loaded
  let sdk;

  function initializeSdk() {
    // Initialize the SDK
    sdk = new CoinbaseWalletSDK({
      appName: "Blinx Digital Technologies",
      appLogoUrl:
        "https://ipfs.io/ipfs/QmfYWXqgfR4igPm5gMuB3sjub5zj22VY7VEYZMJerquxvN?filename=design-28%20(1).png",
      darkMode: false,
    });

    // Create a Web3 Provider
    window.provider = sdk.makeWeb3Provider();

    // Set up event listeners
    window.provider.on("connect", (info) => {
      console.log("Connected:", info);
    });

    window.provider.on("disconnect", (error) => {
      console.log("Disconnected:", error);
      document.getElementById("status").textContent = "Disconnected";
      document.getElementById("disconnect").style.display = "none";
    });

    window.provider.on("accountsChanged", (accounts) => {
      console.log("Accounts changed:", accounts);
      if (accounts.length > 0) {
        document.getElementById(
          "status"
        ).textContent = `Connected: ${accounts[0]}`;
      } else {
        document.getElementById("status").textContent = "No account connected";
      }
    });

    window.provider.on("chainChanged", (chainId) => {
      console.log("Chain changed:", chainId);
    });
  }

  // Function to connect to the wallet
  window.connectWallet = async function () {
    try {
      const accounts = await window.provider.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected accounts:", accounts);
      document.getElementById(
        "status"
      ).textContent = `Connected: ${accounts[0]}`;
      document.getElementById("disconnect").style.display = "inline-block";
    } catch (error) {
      console.error("Failed to connect:", error);
      document.getElementById("status").textContent = "Connection failed";
    }
  };

  // Function to disconnect from the wallet
  window.disconnectWallet = function () {
    window.provider.disconnect();
    document.getElementById("status").textContent = "Disconnected";
    document.getElementById("disconnect").style.display = "none";
  };

  // Initialize SDK when the script has loaded
  if (document.readyState === "complete") {
    initializeSdk();
  } else {
    window.addEventListener("load", initializeSdk);
  }
})();
