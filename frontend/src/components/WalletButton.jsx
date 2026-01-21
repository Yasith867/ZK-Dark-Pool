import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import { useState, useEffect } from 'react'

export default function WalletButton() {
    const { wallets, wallet, publicKey, select, connect, disconnect, connecting } = useWallet()
    const [showModal, setShowModal] = useState(false)
    const [shouldConnect, setShouldConnect] = useState(false)

    // Auto-connect when wallet is selected
    useEffect(() => {
        const doConnect = async () => {
            if (shouldConnect && wallet && !publicKey && !connecting) {
                try {
                    await connect()
                    setShouldConnect(false)
                } catch (error) {
                    console.error('Error connecting to wallet:', error)
                    setShouldConnect(false)
                }
            }
        }
        doConnect()
    }, [wallet, shouldConnect, publicKey, connecting, connect])

    const handleConnect = async (walletToConnect) => {
        try {
            // Select the wallet
            await select(walletToConnect.adapter.name)
            setShowModal(false)
            // Set flag to trigger connection in useEffect
            setShouldConnect(true)
        } catch (error) {
            console.error('Error selecting wallet:', error)
        }
    }

    const handleDisconnect = async () => {
        try {
            await disconnect()
        } catch (error) {
            console.error('Failed to disconnect:', error)
        }
    }

    const truncateAddress = (addr) => {
        if (!addr) return ''
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    if (publicKey) {
        return (
            <button
                className="wallet-button connected"
                onClick={handleDisconnect}
            >
                {truncateAddress(publicKey)}
            </button>
        )
    }

    return (
        <>
            <button
                className="wallet-button"
                onClick={() => setShowModal(true)}
                disabled={connecting}
            >
                {connecting ? 'Connecting...' : 'Select Wallet'}
            </button>

            {showModal && (
                <div className="wallet-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="wallet-modal-header">
                            <h3>Select Wallet</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="wallet-modal-body">
                            {wallets && wallets.length > 0 ? (
                                <div className="wallet-list">
                                    {wallets.map((w) => (
                                        <button
                                            key={w.adapter.name}
                                            className="wallet-option"
                                            onClick={() => handleConnect(w)}
                                        >
                                            <span>{w.adapter.name}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="wallet-empty">
                                    <p>No Aleo wallets detected</p>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        Please install <a href="https://leo.app/" target="_blank" rel="noopener">Leo Wallet</a>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
