import { useState, useEffect } from 'react'

export default function WalletButton() {
    const [publicKey, setPublicKey] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [connecting, setConnecting] = useState(false)

    // Check if wallet is already connected on mount
    useEffect(() => {
        const checkConnection = async () => {
            if (window.leoWallet) {
                try {
                    const account = await window.leoWallet.getAccount()
                    if (account) {
                        setPublicKey(account)
                    }
                } catch (error) {
                    // Not connected yet
                }
            }
        }
        checkConnection()
    }, [])

    const handleConnect = async () => {
        if (!window.leoWallet) {
            alert('Leo Wallet not found! Please install it from https://leo.app/')
            return
        }

        setConnecting(true)
        try {
            // Use Leo Wallet's requestConnection method
            await window.leoWallet.requestConnection({
                dappName: 'ZK Dark Pool',
                chainID: 'testnet'
            })

            // Get the account after connection
            const account = await window.leoWallet.getAccount()
            setPublicKey(account)
            setShowModal(false)
            console.log('Connected to Leo Wallet:', account)
        } catch (error) {
            console.error('Failed to connect to Leo Wallet:', error)
            alert(`Failed to connect: ${error.message || 'Please try again'}`)
        } finally {
            setConnecting(false)
        }
    }

    const handleDisconnect = async () => {
        if (window.leoWallet) {
            try {
                await window.leoWallet.disconnect()
                setPublicKey(null)
            } catch (error) {
                console.error('Failed to disconnect:', error)
            }
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
                            {window.leoWallet ? (
                                <div className="wallet-list">
                                    <button
                                        className="wallet-option"
                                        onClick={handleConnect}
                                        disabled={connecting}
                                    >
                                        <span>Leo Wallet</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="wallet-empty">
                                    <p>Leo Wallet not detected</p>
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
