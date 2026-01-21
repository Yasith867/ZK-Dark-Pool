import { Link, useLocation } from 'react-router-dom'
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui'
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react'

export default function Header() {
    const location = useLocation()
    const { connected, publicKey } = useWallet()

    const isActive = (path) => location.pathname === path ? 'active' : ''

    const truncateAddress = (addr) => {
        if (!addr) return ''
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    return (
        <header className="header">
            <Link to="/" className="header-logo">
                <div className="logo-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                </div>
                <h1>ZK <span className="text-gradient">Dark Pool</span></h1>
            </Link>

            <nav className="header-nav">
                <Link to="/markets" className={isActive('/markets')}>Markets</Link>
                <Link to="/create" className={isActive('/create')}>Create</Link>
                <Link to="/portfolio" className={isActive('/portfolio')}>Portfolio</Link>
            </nav>

            <div className="header-actions">
                {connected && (
                    <span className="privacy-indicator private">
                        {truncateAddress(publicKey)}
                    </span>
                )}
                <WalletMultiButton />
            </div>
        </header>
    )
}
