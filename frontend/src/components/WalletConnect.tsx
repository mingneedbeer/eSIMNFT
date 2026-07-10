import { useCallback, useEffect, useState } from "react";
import { abstractSepolia } from "../lib/contract";

interface Props {
  onAccount: (account: `0x${string}`) => void;
}

const EXPECTED_CHAIN_ID = "0x" + abstractSepolia.id.toString(16);

export function WalletConnect({ onAccount }: Props) {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [connecting, setConnecting] = useState(false);

  const ensureChain = useCallback(async () => {
    try {
      await window.ethereum!.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: EXPECTED_CHAIN_ID }],
      });
    } catch (e: any) {
      if (e.code === 4902) {
        await window.ethereum!.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: EXPECTED_CHAIN_ID,
            chainName: abstractSepolia.name,
            nativeCurrency: abstractSepolia.nativeCurrency,
            rpcUrls: [abstractSepolia.rpcUrls.default.http[0]],
            blockExplorerUrls: [abstractSepolia.blockExplorers.default.url],
          }],
        });
      } else {
        throw e;
      }
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleChainChanged = () => { /* re-render on chain switch */ };
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
        localStorage.removeItem("esim_wallet");
        onAccount("" as `0x${string}`);
      }
    };
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [onAccount]);

  useEffect(() => {
    const saved = localStorage.getItem("esim_wallet");
    if (saved) {
      setAccount(saved as `0x${string}`);
      onAccount(saved as `0x${string}`);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another wallet");
      return;
    }
    setConnecting(true);
    try {
      await ensureChain();
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const addr = accounts[0] as `0x${string}`;
      setAccount(addr);
      localStorage.setItem("esim_wallet", addr);
      onAccount(addr);
    } catch (e: any) {
      if (e.code !== 4001) alert(e.message ?? "Failed to connect");
    } finally {
      setConnecting(false);
    }
  }, [ensureChain, onAccount]);

  const disconnect = useCallback(() => {
    setAccount(null);
    localStorage.removeItem("esim_wallet");
    onAccount("" as `0x${string}`);
  }, [onAccount]);

  return (
    <div>
      {account ? (
        <button onClick={disconnect} class="btn btn-secondary">
          {account.slice(0, 6)}...{account.slice(-4)}
        </button>
      ) : (
        <button onClick={connect} disabled={connecting} class="btn btn-primary">
          {connecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
}
