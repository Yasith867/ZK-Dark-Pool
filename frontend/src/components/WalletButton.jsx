import { useCallback, useMemo, useState } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";

export default function WalletButton() {
    const {
        wallets,
        wallet,
        publicKey,
        select,
        connect,
        disconnect,
        connecting,
        connected,
    } = useWallet();

    const [showModal, setShowModal] = useState(false);

    const publicKeyStr = useMemo(() => {
        if (!publicKey) return "";
        try {
            return typeof publicKey === "string" ? publicKey : publicKey.toString();
        } catch {
            return "";
        }
    }, [publicKey]);

    const truncateAddress = (addr) => {
        if (!addr) return "";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const handleConnect = useCallback(
        async (walletName) => {
            try {
                // Ensure wallet exists
                const chosen = wallets.find((w) => w?.adapter?.name === walletName);
                if (!chosen) {
                    console.error("Wallet adapter not found:", walletName);
                    return;
                }

                // Select only if not already selected
                if (!wallet || wallet.adapter?.name !== walletName) {
                    select(walletName);

                    // Let selection state apply before connect()
                    await new Promise((r) => setTimeout(r, 50));
                }

                // Connect with NO arguments
                await connect();

                setShowModal(false);
            } catch (error) {
                console.error("Connection error:", error);
            }
        },
        [wallets, wallet, select, connect]
    );

    const handleDisconnect = useCallback(async () => {
        try {
            await disconnect();
        } catch (error) {
            console.error("Disconnect error:", error);
        }
    }, [disconnect]);

    if (connected && publicKeyStr) {
        return (
            <button className="wallet-button connected" onClick={handleDisconnect}>
                {truncateAddress(publicKeyStr)}
            </button>
        );
    }

    return (
        <>
            <button
                className="wallet-button"
                onClick={() => setShowModal(true)}
                disabled={connecting}
            >
                {connecting ? "Connecting..." : "Select Wallet"}
            </button>

            {showModal && (
                <div
                    className="wallet-modal-overlay"
                    onClick={() => setShowModal(false)}
                >
                    <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="wallet-modal-header">
                            <h3>Select Wallet</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                ×
                            </button>
                        </div>

                        <div className="wallet-modal-body">
                            {wallets && wallets.length > 0 ? (
                                <div className="wallet-list">
                                    {wallets.map((w) => (
                                        <button
                                            key={w.adapter.name}
                                            className="wallet-option"
                                            onClick={() => handleConnect(w.adapter.name)}
                                            disabled={connecting}
                                        >
                                            <span>{w.adapter.name}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="wallet-empty">
                                    <p>No wallets detected</p>
                                    <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                                        Install{" "}
                                        <a href="https://leo.app/" target="_blank" rel="noopener noreferrer">
                                            Leo Wallet
                                        </a>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
