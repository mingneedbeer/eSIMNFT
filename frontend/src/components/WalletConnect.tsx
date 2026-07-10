import { useCallback, useEffect, useState } from "react";

interface Props {
  onAccount: (account: `0x${string}`) => void;
}

export function WalletConnect({ onAccount }: Props) {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [connecting, setConnecting] = useState(false);

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
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const addr = accounts[0] as `0x${string}`;
      setAccount(addr);
      localStorage.setItem("esim_wallet", addr);
      onAccount(addr);
    } catch (e: any) {
      alert(e.message ?? "Failed to connect");
    } finally {
      setConnecting(false);
    }
  }, [onAccount]);

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
