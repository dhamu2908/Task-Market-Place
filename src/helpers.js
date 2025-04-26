export async function fetchBalance(provider, address) {
    const bal = await provider.getBalance(address);
    return ethers.formatEther(bal);
  }
  
