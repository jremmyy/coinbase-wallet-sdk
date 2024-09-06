// main.js

let sdk;
let provider;
let signer;
let usdcConverter;

const USDCConverterAddress = "0xFA27413DC4160E32F1979A81556B9372D2fB9B01"; // Update this after deploying to mainnet
const USDCTokenAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base mainnet

function initializeSdk() {
  console.log("Initializing SDK...");

  // Base mainnet network configuration
  const chainId = 8453; // Base mainnet
  const rpcUrl = "https://chain-proxy.wallet.coinbase.com?targetName=base";

  // Initialize the SDK
  sdk = new CoinbaseWalletSDK({
    appName: "Blinx Digital Technologies",
    appLogoUrl: "./image/logo-transparent.png",
    darkMode: false,
    overrideIsMetaMask: false,
  });

  console.log("SDK initialized:", sdk);

  // Create a Web3 Provider
  window.provider = sdk.makeWeb3Provider(rpcUrl, chainId);
  console.log("Web3 Provider created:", window.provider);

  // Initialize ethers provider and USDCConverterInterface
  provider = new ethers.providers.Web3Provider(window.provider);
  signer = provider.getSigner();
  usdcConverter = new ethers.Contract(
    USDCConverterAddress,
    [
      "function agreeToTerms() external",
      "function checkAgreement(address) external view returns (bool)",
      "function convertETHtoUSDC() external payable",
      "event TermsAgreed(address user)",
      "event Converted(address user, uint256 ethAmount, uint256 usdcAmount)",
      "event ConversionFailed(address user, uint256 ethAmount, string reason)",
    ],
    provider
  );
  console.log("USDCConverter contract initialized:", usdcConverter);

  // Set up event listeners
  window.provider.on("connect", (info) => {
    console.log("Connected:", info);
  });

  window.provider.on("disconnect", (error) => {
    console.log("Disconnected:", error);
    document.getElementById("status").textContent = "Disconnected";
    document.getElementById("disconnect").style.display = "none";
    document.getElementById("usdcConvert").style.display = "none";
    document.getElementById("agreeTerms").style.display = "none";
  });

  window.provider.on("accountsChanged", (accounts) => {
    console.log("Accounts changed:", accounts);
    if (accounts.length > 0) {
      document.getElementById(
        "status"
      ).textContent = `Connected: ${accounts[0]}`;
      checkAgreementAndUpdateUI(accounts[0]);
    } else {
      document.getElementById("status").textContent = "No account connected";
      document.getElementById("usdcConvert").style.display = "none";
      document.getElementById("agreeTerms").style.display = "none";
    }
  });

  window.provider.on("chainChanged", (chainId) => {
    console.log("Chain changed:", chainId);
    if (chainId !== "0x2105") {
      // '0x2105' is hexadecimal for 8453 (Base mainnet)
      alert("Please switch to the Base mainnet in your wallet.");
    }
  });
}

async function checkAgreementAndUpdateUI(account) {
  console.log("Checking agreement for account:", account);
  try {
    const hasAgreed = await usdcConverter.checkAgreement(account);
    console.log("Has agreed:", hasAgreed);
    if (hasAgreed) {
      document.getElementById("usdcConvert").style.display = "inline-block";
      document.getElementById("agreeTerms").style.display = "none";
    } else {
      document.getElementById("agreeTerms").style.display = "inline-block";
      document.getElementById("usdcConvert").style.display = "none";
    }
  } catch (error) {
    console.error("Error checking agreement:", error);
    document.getElementById("agreeTerms").style.display = "inline-block";
    document.getElementById("usdcConvert").style.display = "none";
  }
}

window.connectWallet = async function () {
  console.log("Connect wallet function called");
  try {
    const accounts = await window.provider.request({
      method: "eth_requestAccounts",
    });
    console.log("Connected accounts:", accounts);
    document.getElementById("status").textContent = `Connected: ${accounts[0]}`;
    document.getElementById("disconnect").style.display = "inline-block";

    signer = provider.getSigner();
    const network = await provider.getNetwork();
    console.log("Connected to network:", network);

    if (network.chainId !== 8453) {
      // Base mainnet chain ID
      alert("Please switch to the Base mainnet in your wallet.");
      return;
    }

    await checkAgreementAndUpdateUI(accounts[0]);
  } catch (error) {
    console.error("Failed to connect:", error);
    document.getElementById("status").textContent = "Connection failed";
  }
};

window.disconnectWallet = function () {
  console.log("Disconnect wallet function called");
  window.provider.disconnect();
  document.getElementById("status").textContent = "Disconnected";
  document.getElementById("disconnect").style.display = "none";
  document.getElementById("usdcConvert").style.display = "none";
  document.getElementById("agreeTerms").style.display = "none";
};

window.agreeToTerms = async function () {
  console.log("Agree to terms function called");
  try {
    const tx = await usdcConverter.connect(signer).agreeToTerms();
    await tx.wait();
    console.log("Agreement transaction completed");

    // Check if the agreement was successful
    const account = await signer.getAddress();
    const hasAgreed = await usdcConverter.checkAgreement(account);
    console.log("Agreement status after transaction:", hasAgreed);

    if (hasAgreed) {
      document.getElementById("agreeTerms").style.display = "none";
      document.getElementById("usdcConvert").style.display = "inline-block";
      alert("You have successfully agreed to the terms.");
    } else {
      throw new Error("Agreement not registered on the blockchain");
    }
  } catch (error) {
    console.error("Failed to agree to terms:", error);
    alert("Failed to agree to terms. Please try again.");
  }
};

window.convertToUSDC = async function () {
  console.log("Convert to USDC function called");
  try {
    const account = await signer.getAddress();
    const hasAgreed = await usdcConverter.checkAgreement(account);
    console.log("Agreement status before conversion:", hasAgreed);

    if (!hasAgreed) {
      alert("You must agree to the terms before converting to USDC.");
      return;
    }

    const balance = await provider.getBalance(account);
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

    const amountToConvert = prompt(
      "Enter the amount of ETH to convert to USDC:",
      "0.0002"
    );
    if (!amountToConvert) return;

    const amount = ethers.utils.parseEther(amountToConvert);

    if (balance.lt(amount)) {
      alert(
        `Insufficient funds. Your balance is ${ethers.utils.formatEther(
          balance
        )} ETH.`
      );
      return;
    }

    console.log("Initiating ETH to USDC conversion...");
    const contractWithSigner = usdcConverter.connect(signer);

    // Set a manual gas limit
    const manualGasLimit = ethers.BigNumber.from("500000"); // Adjust this value as needed
    console.log("Using manual gas limit:", manualGasLimit.toString());

    const tx = await contractWithSigner.convertETHtoUSDC({
      value: amount,
      gasLimit: manualGasLimit,
    });
    console.log("Transaction submitted:", tx.hash);

    console.log("Waiting for transaction confirmation...");
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.transactionHash);

    const convertedEvent = receipt.events.find((e) => e.event === "Converted");
    const failedEvent = receipt.events.find(
      (e) => e.event === "ConversionFailed"
    );

    if (convertedEvent) {
      const [user, ethAmount, usdcAmount] = convertedEvent.args;
      console.log(
        `Converted ${ethers.utils.formatEther(
          ethAmount
        )} ETH to ${ethers.utils.formatUnits(usdcAmount, 6)} USDC`
      );
      alert(
        `Successfully converted ${ethers.utils.formatEther(
          ethAmount
        )} ETH to ${ethers.utils.formatUnits(usdcAmount, 6)} USDC!`
      );
    } else if (failedEvent) {
      const [user, ethAmount, reason] = failedEvent.args;
      console.error(`Conversion failed: ${reason}`);
      alert(`Failed to convert ETH to USDC: ${reason}`);
    } else {
      console.error("No conversion event found in transaction receipt");
      alert("Conversion status unclear. Please check your wallet for updates.");
    }
  } catch (error) {
    console.error("Failed to convert to USDC:", error);
    if (error.error && error.error.message) {
      alert(`Failed to convert to USDC: ${error.error.message}`);
    } else {
      alert(
        "Failed to convert to USDC. Please check the console for more details."
      );
    }
  }
};

window.checkUSDCBalance = async function () {
  try {
    const account = await signer.getAddress();
    const usdcContract = new ethers.Contract(
      USDCTokenAddress,
      ["function balanceOf(address) view returns (uint256)"],
      provider
    );
    const usdcBalance = await usdcContract.balanceOf(account);
    const formattedBalance = ethers.utils.formatUnits(usdcBalance, 6); // USDC has 6 decimal places
    console.log("USDC balance:", formattedBalance);
    alert(`Your USDC balance is: ${formattedBalance} USDC`);
  } catch (error) {
    console.error("Failed to check USDC balance:", error);
    alert(
      "Failed to check USDC balance. Please check the console for more details."
    );
  }
};

// Initialize SDK when the script has loaded
if (document.readyState === "complete") {
  console.log("Document ready state is complete, initializing SDK");
  initializeSdk();
} else {
  console.log("Document not ready, adding load event listener");
  window.addEventListener("load", initializeSdk);
}

console.log("main.js executed");
