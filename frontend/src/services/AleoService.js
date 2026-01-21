/**
 * AleoService - Handles all Aleo blockchain interactions
 * 
 * This service provides:
 * - Network client for reading public state (mappings)
 * - Transaction building helpers
 * - Program execution utilities
 */

import { ALEO_CONFIG } from '../config'

class AleoService {
    constructor() {
        this.rpcUrl = ALEO_CONFIG.rpcUrl
        this.programId = ALEO_CONFIG.programId
    }

    /**
     * Read a mapping value from the program
     * @param {string} mappingName - Name of the mapping (e.g., 'markets', 'pools')
     * @param {string} key - The key to look up
     * @returns {Promise<string|null>} - The mapping value or null if not found
     */
    async getMappingValue(mappingName, key) {
        try {
            // Correct testnet API format
            const url = `${this.rpcUrl}/testnet/program/${this.programId}/mapping/${mappingName}/${key}`
            const response = await fetch(url)

            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`Mapping ${mappingName}[${key}] not found`)
                    return null // Key not found
                }
                throw new Error(`Failed to fetch mapping: ${response.statusText}`)
            }

            const data = await response.text()
            // Aleo API returns plain text Leo format, not JSON
            return data || null
        } catch (error) {
            console.error(`Error reading mapping ${mappingName}[${key}]:`, error)
            return null
        }
    }

    /**
     * Get market info from the markets mapping
     * @param {string} marketId - The market ID (field value)
     * @returns {Promise<Object|null>} - Parsed market info or null
     */
    async getMarket(marketId) {
        const value = await this.getMappingValue(ALEO_CONFIG.mappings.markets, marketId)
        if (!value) return null

        return this.parseMarketInfo(value)
    }

    /**
     * Get pool state from the pools mapping
     * @param {string} marketId - The market ID (field value)
     * @returns {Promise<Object|null>} - Parsed pool state or null
     */
    async getPool(marketId) {
        const value = await this.getMappingValue(ALEO_CONFIG.mappings.pools, marketId)
        if (!value) return null

        return this.parsePoolState(value)
    }

    /**
     * Parse MarketInfo struct from Aleo format
     * Format: { creator: address, resolution_time: u64, resolved: bool, winning_outcome: u8 }
     */
    parseMarketInfo(value) {
        try {
            // Aleo struct format: "{ field1: value1, field2: value2 }"
            const cleaned = value.replace(/\s/g, '')
            // Updated for resolution_height (u32) instead of resolution_time (u64)
            const match = cleaned.match(/\{creator:(aleo1[\w]+),resolution_height:(\d+)u32,resolved:(true|false),winning_outcome:(\d+)u8\}/)

            if (!match) {
                console.warn('Could not parse MarketInfo:', value)
                console.warn('Expected format: {creator:aleo1...,resolution_height:NNNu32,resolved:true/false,winning_outcome:Nu8}')
                return null
            }

            return {
                creator: match[1],
                resolutionHeight: parseInt(match[2]),
                resolved: match[3] === 'true',
                winningOutcome: parseInt(match[4]),
            }
        } catch (error) {
            console.error('Error parsing MarketInfo:', error)
            return null
        }
    }

    /**
     * Parse PoolState struct from Aleo format
     * Format: { total_yes: u64, total_no: u64, total_pool: u64 }
     */
    parsePoolState(value) {
        try {
            const cleaned = value.replace(/\s/g, '')
            const match = cleaned.match(/\{total_yes:(\d+)u64,total_no:(\d+)u64,total_pool:(\d+)u64\}/)

            if (!match) {
                console.warn('Could not parse PoolState:', value)
                return null
            }

            return {
                totalYes: parseInt(match[1]),
                totalNo: parseInt(match[2]),
                totalPool: parseInt(match[3]),
            }
        } catch (error) {
            console.error('Error parsing PoolState:', error)
            return null
        }
    }

    /**
     * Check if the program exists on the network
     * @returns {Promise<boolean>}
     */
    async programExists() {
        try {
            const url = `${this.rpcUrl}/testnet/program/${this.programId}`
            console.log('Checking program at:', url)
            const response = await fetch(url)
            console.log('Program exists:', response.ok)
            return response.ok
        } catch (error) {
            console.error('Error checking program:', error)
            return false
        }
    }

    /**
     * Get recent transactions for the program
     * @param {number} limit - Number of transactions to fetch
     * @returns {Promise<Array>}
     */
    async getRecentTransactions(limit = 10) {
        try {
            const url = `${this.rpcUrl}/program/${this.programId}/transactions?limit=${limit}`
            const response = await fetch(url)

            if (!response.ok) {
                return []
            }

            return await response.json()
        } catch (error) {
            console.error('Error fetching transactions:', error)
            return []
        }
    }

    /**
     * Get transaction details
     * @param {string} txId - Transaction ID
     * @returns {Promise<Object|null>}
     */
    async getTransaction(txId) {
        try {
            const url = `${this.rpcUrl}/transaction/${txId}`
            const response = await fetch(url)

            if (!response.ok) {
                return null
            }

            return await response.json()
        } catch (error) {
            console.error('Error fetching transaction:', error)
            return null
        }
    }

    /**
     * Build transaction inputs for place_bet
     * @param {string} marketId - Market ID
     * @param {number} outcome - 0 for NO, 1 for YES
     * @param {number} amount - Bet amount in microcredits
     * @returns {Array<string>}
     */
    buildPlaceBetInputs(marketId, outcome, amount) {
        return [
            `${marketId}field`,
            `${outcome}u8`,
            `${amount}u64`,
        ]
    }

    /**
     * Build transaction inputs for create_market
     * @param {string} marketId - Market ID
     * @param {number} resolutionTime - Unix timestamp for resolution
     * @returns {Array<string>}
     */
    buildCreateMarketInputs(marketId, resolutionHeight) {
        return [
            `${marketId}field`,
            `${resolutionHeight}u32`, // Changed to u32 to match contract
        ]
    }

    /**
     * Build transaction inputs for resolve_market
     * @param {string} marketId - Market ID
     * @param {number} winningOutcome - 0 for NO, 1 for YES
     * @returns {Array<string>}
     */
    buildResolveMarketInputs(marketId, winningOutcome) {
        return [
            `${marketId}field`,
            `${winningOutcome}u8`,
        ]
    }
}

// Singleton instance
export const aleoService = new AleoService()
export default aleoService
