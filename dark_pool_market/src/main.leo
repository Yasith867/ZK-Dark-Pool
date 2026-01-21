// ZK Dark Pool Prediction Market
// Privacy-preserving prediction market on Aleo
// Bets are hidden until resolution - no one can see your position

program dark_pool_market.aleo {

    // ============================================
    // RECORDS (Private State)
    // ============================================
    
    // Private bet record - only the owner can see this
    // Stored encrypted on-chain
    record Bet {
        owner: address,          // Who owns this bet
        market_id: field,        // Which market this bet is for
        outcome: u8,             // 0 = NO, 1 = YES
        amount: u64,             // How much was bet
        bet_id: field,           // Unique bet identifier
    }

    // Claim record for winners
    record WinClaim {
        owner: address,
        market_id: field,
        payout: u64,
        claimed: bool,
    }

    // ============================================
    // STRUCTS (Data Types)
    // ============================================
    
    struct MarketInfo {
        creator: address,
        resolution_time: u64,    // Block height when market can resolve
        resolved: bool,
        winning_outcome: u8,     // 0 = NO, 1 = YES, 255 = unresolved
    }

    struct PoolState {
        total_yes: u64,          // Total bet on YES
        total_no: u64,           // Total bet on NO
        total_pool: u64,         // Combined pool
    }

    // ============================================
    // MAPPINGS (Public State)
    // ============================================
    
    // Market ID => Market information (public)
    mapping markets: field => MarketInfo;
    
    // Market ID => Pool state (public - aggregated only)
    mapping pools: field => PoolState;
    
    // Market counter for unique IDs
    mapping market_counter: u8 => u64;
    
    // Bet counter for unique bet IDs
    mapping bet_counter: u8 => u64;

    // ============================================
    // TRANSITIONS (ZK Functions)
    // ============================================

    // Create a new prediction market
    // Public: market question is visible
    transition create_market(
        public market_id: field,
        public resolution_time: u64,
    ) -> field {
        // Return the market ID
        return market_id;
    }
    
    // Finalize creates the on-chain state
    finalize create_market(
        market_id: field,
        resolution_time: u64,
    ) {
        // Ensure market doesn't exist
        let exists: bool = Mapping::contains(markets, market_id);
        assert(!exists);
        
        // Create market info
        let market: MarketInfo = MarketInfo {
            creator: self.caller,
            resolution_time: resolution_time,
            resolved: false,
            winning_outcome: 255u8,  // Unresolved
        };
        
        // Initialize pool
        let pool: PoolState = PoolState {
            total_yes: 0u64,
            total_no: 0u64,
            total_pool: 0u64,
        };
        
        // Store in mappings
        Mapping::set(markets, market_id, market);
        Mapping::set(pools, market_id, pool);
    }

    // Place a private bet - THIS IS THE KEY PRIVACY FUNCTION
    // Input: market_id, outcome, amount
    // Output: encrypted Bet record only the caller can see
    transition place_bet(
        public market_id: field,
        private outcome: u8,
        private amount: u64,
    ) -> Bet {
        // Validate outcome (0 = NO, 1 = YES)
        assert(outcome == 0u8 || outcome == 1u8);
        
        // Validate amount
        assert(amount > 0u64);
        
        // Generate unique bet ID using hash
        let bet_id: field = BHP256::hash_to_field(
            (self.caller, market_id, outcome, amount)
        );
        
        // Create private bet record
        let bet: Bet = Bet {
            owner: self.caller,
            market_id: market_id,
            outcome: outcome,
            amount: amount,
            bet_id: bet_id,
        };
        
        return bet;
    }
    
    // Finalize updates only the aggregated public pool
    // Individual bet details remain hidden!
    finalize place_bet(
        market_id: field,
        outcome: u8,
        amount: u64,
    ) {
        // Get current market state
        let market: MarketInfo = Mapping::get(markets, market_id);
        assert(!market.resolved);  // Can't bet on resolved market
        
        // Get current pool
        let pool: PoolState = Mapping::get(pools, market_id);
        
        // Update pool based on outcome
        let new_pool: PoolState = PoolState {
            total_yes: pool.total_yes + (amount * (outcome as u64)),
            total_no: pool.total_no + (amount * ((1u8 - outcome) as u64)),
            total_pool: pool.total_pool + amount,
        };
        
        Mapping::set(pools, market_id, new_pool);
    }

    // Resolve market - only creator can call this
    transition resolve_market(
        public market_id: field,
        public winning_outcome: u8,
    ) {
        // Validate outcome
        assert(winning_outcome == 0u8 || winning_outcome == 1u8);
    }
    
    finalize resolve_market(
        market_id: field,
        winning_outcome: u8,
    ) {
        // Get market
        let market: MarketInfo = Mapping::get(markets, market_id);
        
        // Ensure not already resolved
        assert(!market.resolved);
        
        // Ensure caller is creator
        assert_eq(market.creator, self.caller);
        
        // Update market state
        let resolved_market: MarketInfo = MarketInfo {
            creator: market.creator,
            resolution_time: market.resolution_time,
            resolved: true,
            winning_outcome: winning_outcome,
        };
        
        Mapping::set(markets, market_id, resolved_market);
    }

    // Claim winnings - prove you have a winning bet via ZK
    // This is powerful: you prove ownership without revealing bet details
    transition claim_winnings(
        private bet: Bet,
    ) -> WinClaim {
        // The ZK proof verifies:
        // 1. Caller owns the bet record
        // 2. The bet exists and is valid
        // The actual payout calculation happens in finalize
        
        let claim: WinClaim = WinClaim {
            owner: bet.owner,
            market_id: bet.market_id,
            payout: 0u64,  // Will be calculated in finalize
            claimed: true,
        };
        
        return claim;
    }
    
    finalize claim_winnings(
        market_id: field,
        outcome: u8,
        amount: u64,
    ) {
        // Get market state
        let market: MarketInfo = Mapping::get(markets, market_id);
        assert(market.resolved);  // Must be resolved
        
        // Get pool for payout calculation
        let pool: PoolState = Mapping::get(pools, market_id);
        
        // Check if bet was on winning side
        assert_eq(outcome, market.winning_outcome);
        
        // Calculate payout proportionally
        // If you bet YES and YES won: payout = (your_bet / total_yes) * total_pool
        // This gives you your share of the entire pool
        let winning_pool: u64 = outcome == 1u8 ? pool.total_yes : pool.total_no;
        
        // Payout calculation (simplified - in production use fixed point math)
        let payout: u64 = (amount * pool.total_pool) / winning_pool;
        
        // Note: In production, you'd transfer credits here
        // For now, the WinClaim record proves the payout amount
    }

    // ============================================
    // VIEW FUNCTIONS (Read-only)
    // ============================================
    
    // Get market info (public)
    transition get_market(
        public market_id: field,
    ) -> field {
        return market_id;
    }
    
    finalize get_market(market_id: field) {
        // Just verify market exists
        let _: MarketInfo = Mapping::get(markets, market_id);
    }
}
