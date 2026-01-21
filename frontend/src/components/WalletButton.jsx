import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import { useState } from 'react'

export default function WalletButton() {
    const { wallets, wallet, publicKey, connect, disconnect, connecting } = useWallet()
    const [showModal, setShowModal] = useState(false)

    const handleConnect = async (walletToConnect) => {
        try {
            await connect(walletToConnect.adapter.name)
            setShowModal(false)
        } catch (error) {
            console.error('Failed to connect:', error)
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
