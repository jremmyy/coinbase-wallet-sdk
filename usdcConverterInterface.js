class USDCConverterInterface {
  constructor(provider, usdcConverterAddress, usdcTokenAddress) {
    this.contract = new ethers.Contract(
      usdcConverterAddress,
      [
        "function agreeToTerms() external",
        "function convertETHtoUSDC() external payable",
        "function hasAgreed(address) public view returns (bool)",
        "event Converted(address user, uint256 ethAmount, uint256 usdcAmount)",
        "event ConversionFailed(address user, uint256 ethAmount, string reason)",
      ],
      provider
    );
    this.usdcTokenAddress = usdcTokenAddress;
  }

  async agreeToTerms(signer) {
    const contractWithSigner = this.contract.connect(signer);
    return await contractWithSigner.agreeToTerms();
  }

  async checkAgreement(address) {
    return await this.contract.hasAgreed(address);
  }

  async convertETHtoUSDC(signer, amount) {
    const contractWithSigner = this.contract.connect(signer);
    return await contractWithSigner.convertETHtoUSDC({ value: amount });
  }

  get estimateGas() {
    return this.contract.estimateGas;
  }
}
