import { useCallback, useState } from "react";
import { type WalletClient, createWalletClient, custom, parseEventLogs, createPublicClient, http } from "viem";
import { abstractSepolia, CONTRACT_ADDRESS, contractABI, ABSCAN_URL } from "../lib/contract";
import { PLANS, type Plan } from "../lib/plans";
import { WalletConnect } from "./WalletConnect";

function formatBytes(n: bigint): string {
  const gb = Number(n) / 1_000_000_000;
  return gb >= 1 ? `${gb} GB` : `${Number(n) / 1_000_000} MB`;
}

function getClient(): WalletClient {
  return createWalletClient({
    chain: abstractSepolia,
    transport: custom(window.ethereum!),
  });
}

export function MintForm() {
  const [account, setAccount] = useState<`0x${string}` | "">("");
  const [recipient, setRecipient] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [status, setStatus] = useState<"idle" | "minting" | "success" | "error">("idle");
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [error, setError] = useState("");

  const handleAccount = useCallback((addr: `0x${string}`) => {
    setAccount(addr);
    if (!recipient) setRecipient(addr);
  }, [recipient]);

  const mint = useCallback(async () => {
    if (!selectedPlan || !account) return;
    if (!recipient || !recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError("Invalid recipient address");
      return;
    }

    setStatus("minting");
    setError("");

    try {
      const client = getClient();
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: "mint",
        args: [
          recipient as `0x${string}`,
          selectedPlan.provider,
          selectedPlan.id,
          selectedPlan.country,
          selectedPlan.countryCode,
          selectedPlan.dataBytes,
          BigInt(selectedPlan.validityDays),
        ],
        account: account as `0x${string}`,
      });

      const publicClient = createPublicClient({
        chain: abstractSepolia,
        transport: http(),
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const logs = parseEventLogs({
        abi: contractABI,
        logs: receipt.logs,
        eventName: "PlanMinted",
      });

      if (logs.length > 0) {
        setTokenId(logs[0].args.tokenId!);
      }

      setStatus("success");
    } catch (e: any) {
      setStatus("error");
      setError(e?.shortMessage ?? e?.message ?? "Transaction failed");
    }
  }, [selectedPlan, account, recipient]);

  const reset = useCallback(() => {
    setStatus("idle");
    setTokenId(null);
    setError("");
  }, []);

  return (
    <div class="mint-form">
      <header class="header">
        <h1>eSIM NFT Voucher</h1>
        <p class="subtitle">Mint transferable eSIM plan NFTs on Abstract Chain</p>
        <WalletConnect onAccount={handleAccount} />
      </header>

      {!account ? (
        <p class="prompt">Connect your wallet to start minting</p>
      ) : status === "success" ? (
        <div class="card success-card">
          <h2>Minted!</h2>
          <p>Token <strong>#{tokenId?.toString()}</strong> minted to {recipient.slice(0, 6)}...{recipient.slice(-4)}</p>
          <a href={`${ABSCAN_URL}/token/${CONTRACT_ADDRESS}?a=${tokenId?.toString()}`} target="_blank" rel="noopener" class="btn btn-primary">
            View on Abscann
          </a>
          <button onClick={reset} class="btn btn-secondary">Mint Another</button>
        </div>
      ) : (
        <>
          <div class="form-group">
            <label>Recipient</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              class="input"
            />
          </div>

          <div class="plans-grid">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                class={`plan-card ${selectedPlan?.id === plan.id ? "selected" : ""}`}
              >
                <span class="flag">{flagEmoji(plan.countryCode)}</span>
                <strong>{plan.country}</strong>
                <span class="detail">{plan.dataDisplay} &middot; {plan.validityDays}d</span>
                <span class="price">${plan.priceUSD}</span>
              </button>
            ))}
          </div>

          {selectedPlan && (
            <button onClick={mint} disabled={status === "minting"} class="btn btn-primary btn-mint">
              {status === "minting" ? "Minting..." : `Mint ${selectedPlan.country} eSIM`}
            </button>
          )}

          {error && <p class="error">{error}</p>}
        </>
      )}
    </div>
  );
}

function flagEmoji(code: string): string {
  const chars = [...code.toUpperCase()].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65));
  return chars.join("");
}
