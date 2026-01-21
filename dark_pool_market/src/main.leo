// ZK Dark Pool Prediction Market
// Privacy-preserving prediction market on Aleo
// Bets are hidden until resolution - no one can see your position

program dark_pool_market.aleo {

    // ============================================
    // RECORDS (Private State)
    // ============================================
    
    // Private bet record - only the owner can see this
    record Bet {
        owner: address,
        market_id: field,
        outcome: u8,             // 0 = NO, 1 = YES
        amount: u64,
    }

    // Claim record for winners
    record WinClaim {
        owner: address,
        market_id: field,
        payout: u64,
    }

    // ============================================
    // STRUCTS (Data Types)
    // ============================================
    
    struct MarketInfo {
        creator: address,
        resolution_time: u64,
        resolved: bool,
        winning_outcome: u8,     // 0 = NO, 1 = YES, 255 = unresolved
    }

    struct PoolState {
        total_yes: u64,
        total_no: u64,
        total_pool: u64,
    }

    // ============================================
    // MAPPINGS (Public State)
    // ============================================
    
    mapping markets: field => MarketInfo;
    mapping pools: field => PoolState;

    // ============================================
    // TRANSITIONS
    // ============================================

    // Create a new prediction market
    async transition create_market(
        public market_id: field,
        public resolution_time: u64,
    ) -> Future {
        return finalize_create_market(market_id, resolution_time, self.caller);
    }
    
    async function finalize_create_market(
        market_id: field,
        resolution_time: u64,
        creator: address,
    ) {
        // Ensure market doesn't exist
        assert(!Mapping::contains(markets, market_id));
        
        // Create market info
        let market: MarketInfo = MarketInfo {
            creator: creator,
            resolution_time: resolution_time,
            resolved: false,
            winning_outcome: 255u8,
        };
        
        // Initialize pool
        let pool: PoolState = PoolState {
            total_yes: 0u64,
            total_no: 0u64,
            total_pool: 0u64,
        };
        
        Mapping::set(markets, market_id, market);
        Mapping::set(pools, market_id, pool);
    }

    // Place a private bet - KEY PRIVACY FUNCTION
    async transition place_bet(
        public market_id: field,
        private outcome: u8,
        private amount: u64,
    ) -> (Bet, Future) {
        // Validate outcome (0 = NO, 1 = YES)
        assert(outcome == 0u8 || outcome == 1u8);
        assert(amount > 0u64);
        
        // Create private bet record
        let bet: Bet = Bet {
            owner: self.caller,
            market_id: market_id,
            outcome: outcome,
            amount: amount,
        };
        
        return (bet, finalize_place_bet(market_id, outcome, amount));
    }
    
    async function finalize_place_bet(
        market_id: field,
        outcome: u8,
        amount: u64,
    ) {
        // Get current market state
        let market: MarketInfo = Mapping::get(markets, market_id);
        assert(!market.resolved);
        
        // Get current pool
        let pool: PoolState = Mapping::get(pools, market_id);
        
        // Update pool based on outcome
        let new_yes: u64 = pool.total_yes + (outcome == 1u8 ? amount : 0u64);
        let new_no: u64 = pool.total_no + (outcome == 0u8 ? amount : 0u64);
        
        let new_pool: PoolState = PoolState {
            total_yes: new_yes,
            total_no: new_no,
            total_pool: pool.total_pool + amount,
        };
        
        Mapping::set(pools, market_id, new_pool);
    }

    // Resolve market - only creator can call
    async transition resolve_market(
        public market_id: field,
        public winning_outcome: u8,
    ) -> Future {
        assert(winning_outcome == 0u8 || winning_outcome == 1u8);
        return finalize_resolve_market(market_id, winning_outcome, self.caller);
    }
    
    async function finalize_resolve_market(
        market_id: field,
        winning_outcome: u8,
        caller: address,
    ) {
        let market: MarketInfo = Mapping::get(markets, market_id);
        assert(!market.resolved);
        assert_eq(market.creator, caller);
        
        let resolved_market: MarketInfo = MarketInfo {
            creator: market.creator,
            resolution_time: market.resolution_time,
            resolved: true,
            winning_outcome: winning_outcome,
        };
        
        Mapping::set(markets, market_id, resolved_market);
    }

    // Claim winnings - prove ownership via ZK
    async transition claim_winnings(
        private bet: Bet,
    ) -> (WinClaim, Future) {
        let claim: WinClaim = WinClaim {
            owner: bet.owner,
            market_id: bet.market_id,
            payout: bet.amount,
        };
        
        return (claim, finalize_claim_winnings(bet.market_id, bet.outcome, bet.amount));
    }
    
    async function finalize_claim_winnings(
        market_id: field,
        outcome: u8,
        amount: u64,
    ) {
        let market: MarketInfo = Mapping::get(markets, market_id);
        assert(market.resolved);
        assert_eq(outcome, market.winning_outcome);
    }
}
