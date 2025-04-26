// src/contract.js
import { ethers } from "ethers";
import abi from "./abi/TaskMarketplace.json";       // ← one level up!

const ABI   = abi.abi;
const ADDR  = import.meta.env.VITE_CONTRACT;
const RPC   = import.meta.env.VITE_RPC_URL;  
const CHAIN = Number(import.meta.env.VITE_CHAIN_ID) || 296;

export async function connectWallet() {
    if (!window.ethereum) throw new Error("Install MetaMask / HashPack");
  
    // 1️⃣ always create provider *after* we know we’re on the right chain
    async function getFresh() {
      const p = new ethers.BrowserProvider(window.ethereum);
      const s = await p.getSigner();
      return { provider: p, signer: s, me: await s.getAddress(),
               contract: new ethers.Contract(ADDR, abi.abi, s) };
    }
  
    // initial request for accounts
    await window.ethereum.request({ method: "eth_requestAccounts" });
  
    let chainId = Number(await window.ethereum.request({ method: "eth_chainId" }));
    if (chainId !== CHAIN) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${CHAIN.toString(16)}` }]
        });
      } catch (e) {
        // add chain if it isn’t known yet
        if (e.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: `0x${CHAIN.toString(16)}`,
              chainName: "Hedera Testnet",
              rpcUrls: ["https://testnet.hashio.io/api"],
              nativeCurrency: { name:"HBAR", symbol:"HBAR", decimals:18 },
              blockExplorerUrls: ["https://hashscan.io/testnet"]
            }]
          });
        } else {
          throw e; // user rejected
        }
      }
      // 🔄 refresh chainId
      chainId = Number(await window.ethereum.request({ method: "eth_chainId" }));
      if (chainId !== CHAIN) throw new Error("User stayed on wrong network");
    }
  
    return getFresh();   // provider is now guaranteed on the right chain
  }

/* ───── read helpers ───── */

export const fetchOpenTasks = async c =>
  Promise.all((await c.getOpenTaskIds()).map(id => fetchTask(c, id)));

export const fetchTask = async (c, id) => {
  const t    = await c.getTask(id);
  const subs = await c.getSubmissions(id);
  return {
    id,
    client:       t.client,
    clientName:   t.name,
    reward:       Number(t.reward),
    deadline:     Number(t.deadline),
    state:        Number(t.state),
    status:       t.status,
    approved:     t.approvedWorker,
    submissions:  subs
  };
};

// ⇩⇩  add THIS function right here  ⇩⇩
export async function fetchActiveReviews(c) {
    const ids = await c.getActiveReviewIds();
    return Promise.all(
      ids.map(async id => {

        const rs = await c.getReviewStatus(id);
      const workerAddr = rs[4];
   // ← use the new getter that accepts an address:
      const workerName = await c.getName(workerAddr);
        return {
          id,
          active:  rs[0],
          yes:     Number(rs[1]),
          no:      Number(rs[2]),
          iVoted:  rs[3],
          worker:  rs[4],
          workerName    
        };
      })
    );
  }

// ───── read-only contract for initial load ─────
export function getReadOnlyContract() {
     const provider = new ethers.JsonRpcProvider(RPC);
      return new ethers.Contract(ADDR, ABI, provider);
}
