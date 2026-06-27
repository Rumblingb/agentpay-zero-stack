/**
 * Type definitions for the Hashkey Horizon Passport SDK
 */

/**
 * Metadata for an agent
 */
export interface AgentMetadata {
  name: string;
  description: string;
  capabilities: string[];
  owner: string;
  createdAt: number;
  updatedAt: number;
  [key: string]: any; // Allow for extensible metadata
}

/**
 * Agent passport data structure
 */
export interface AgentPassport {
  agentId: string;
  owner: string;
  metadata: AgentMetadata;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Deposit information
 */
export interface DepositInfo {
  user: string;
  asset: string;
  amount: bigint;
  timestamp: number;
  txHash: string;
}

/**
 * Withdrawal information
 */
export interface WithdrawalInfo {
  user: string;
  asset: string;
  amount: bigint;
  timestamp: number;
  txHash: string;
  recipient: string;
}

/**
 * Payment vault data structure
 */
export interface PaymentVault {
  owner: string;
  totalDeposits: Record<string, bigint>; // asset => amount
  totalWithdrawals: Record<string, bigint>; // asset => amount
}

/**
 * Guardrail rule structure
 */
export interface GuardrailRule {
  id: string;
  name: string;
  description: string;
  contractAddress: string;
  functionSelector: string;
  action: 'ALLOW' | 'DENY' | 'MODIFY';
  parameters: Record<string, any>;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

/**
 * Guardrail registry data structure
 */
export interface GuardrailRegistry {
  owner: string;
  rules: GuardrailRule[];
  totalRules: number;
  lastUpdated: number;
}