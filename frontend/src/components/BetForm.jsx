import { useState } from 'react'
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'
import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base'
import { ALEO_CONFIG, getExplorerUrl } from '../config'
import aleoService from '../services/AleoService'

export default function BetForm({ market, onBetPlaced }) {
    const { connected, publicKey, requestTransaction } = useWallet()
    const [selectedOutcome, setSelectedOutcome] = useState(null)
    const [amount, setAmount] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [txStatus, setTxStatus] = useState(null)

    const handlePlaceBet = async () => {
        if (!connected) {
            setError('Please connect your wallet first')
            return
        }

        if (selectedOutcome === null) {
            setError('Please select an outcome')
            return
        }

        const betAmount = parseInt(amount)
        if (!betAmount || betAmount <= 0) {
            setError('Please enter a valid amount')
            return
        }

        setIsLoading(true)
        setError('')
        setTxStatus('Building transaction...')

        try {
            // Build transaction inputs using AleoService
            const inputs = aleoService.buildPlaceBetInputs(
                market.id,
                selectedOutcome,
                betAmount
            )

            setTxStatus('Requesting wallet signature...')

            // Use Leo Wallet's requestTransaction format
            const txId = await requestTransaction({
                transitions: [{
                    program: ALEO_CONFIG.programId,
                    functionName: 'place_bet',
                    inputs: inputs,
                }],
                fee: ALEO_CONFIG.fees.placeBet,
                wait: true,  // Wait for transaction confirmation
            })

            console.log('Bet transaction submitted:', txId)
            setTxStatus('Transaction submitted!')

            if (onBetPlaced) {
                onBetPlaced({
                    outcome: selectedOutcome,
                    amount: betAmount,
                    txId: txId,
                    explorerUrl: getExplorerUrl('transaction', txId),
                })
            }

            // Reset form
            setSelectedOutcome(null)
            setAmount('')

        } catch (err) {
            console.error('Error placing bet:', err)

            // Handle specific wallet errors
            if (err.message?.includes('User rejected')) {
                setError('Transaction cancelled by user')
            } else if (err.message?.includes('Insufficient')) {
                setError('Insufficient balance for transaction')
            } else {
                setError(err.message || 'Failed to place bet. Make sure the program is deployed.')
            }
            setTxStatus(null)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bet-form">
            <h3 className="bet-form-title">
                <span className="privacy-indicator private">Private Bet</span>
                Place Your Bet
            </h3>

            {error && (
                <div style={{
                    color: 'var(--color-no)',
                    marginBottom: 'var(--spacing-md)',
                    padding: 'var(--spacing-sm)',
                    background: 'var(--color-no-bg)',
                    borderRadius: 'var(--radius-md)'
                }}>
                    {error}
                </div>
            )}

            {txStatus && !error && (
                <div style={{
                    color: 'var(--color-accent)',
                    marginBottom: 'var(--spacing-md)',
                    padding: 'var(--spacing-sm)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: 'var(--radius-md)'
                }}>
                    {txStatus}
                </div>
            )}

            <div className="bet-form-outcomes">
                <button
                    className={`outcome-btn yes ${selectedOutcome === 1 ? 'selected' : ''}`}
                    onClick={() => setSelectedOutcome(1)}
                    disabled={isLoading}
                >
                    YES
                </button>
                <button
                    className={`outcome-btn no ${selectedOutcome === 0 ? 'selected' : ''}`}
                    onClick={() => setSelectedOutcome(0)}
                    disabled={isLoading}
                >
                    NO
                </button>
            </div>

            <div className="bet-amount-input input-group">
                <label>Bet Amount (microcredits)</label>
                <input
                    type="number"
                    className="input"
                    placeholder="100000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isLoading}
                    min="1"
                />
                <small style={{ color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>
                    1 credit = 1,000,000 microcredits
                </small>
            </div>

            <button
                className="btn btn-primary bet-submit"
                onClick={handlePlaceBet}
                disabled={isLoading || !connected}
            >
                {isLoading ? 'Processing...' : connected ? 'Place Private Bet' : 'Connect Wallet to Bet'}
            </button>

            <div className="bet-privacy-note">
                Your bet amount and choice are encrypted on-chain. Only you can decrypt them.
            </div>

            {/* Transaction Details (for developers) */}
            {connected && (
                <details style={{ marginTop: 'var(--spacing-md)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <summary style={{ cursor: 'pointer' }}>Transaction Details</summary>
                    <pre style={{
                        marginTop: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm)',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'auto'
                    }}>
                        {`Program: ${ALEO_CONFIG.programId}
Function: place_bet
Inputs: [
  "${market.id}field",   // market_id
  "${selectedOutcome ?? '?'}u8",        // outcome (private)
  "${amount || '?'}u64"   // amount (private)
]
Fee: ${ALEO_CONFIG.fees.placeBet} microcredits`}
                    </pre>
                </details>
            )}
        </div>
    )
}
