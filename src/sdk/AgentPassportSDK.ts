import { ethers } from "ethers";
import { AgentPassport, AgentMetadata } from "./types";

/**
 * SDK for interacting with the AgentPassport contract.
 * Provides methods to read agent passport data and interact with the contract.
 */
export class AgentPassportSDK {
  private contract: ethers.Contract;

  /**
   * @param address - The address of the AgentPassport contract
   * @param providerOrSigner - An ethers provider or signer
   * @param abi - The ABI of the AgentPassport contract (optional, will use a minimal ABI if not provided)
   */
  constructor(
    address: string,
    providerOrSigner: ethers.Provider | ethers.Signer,
    abi?: any[]
  ) {
    const defaultAbi = [
      // Returns the agentId for a given agent address
      "function agentId(address agent) view returns (string)",
      // Returns the owner of an agentId
      "function owner(string agentId) view returns (address)",
      // Returns the metadata for an agentId
      "function metadata(string agentId) view returns (string name, string description, string[] capabilities, address owner, uint256 createdAt, uint256 updatedAt)",
      // Returns whether an agent is active
      "function isActive(string agentId) view returns (bool)",
      // Returns the creation timestamp of an agent
      "function createdAt(string agentId) view returns (uint256)",
      // Returns the last update timestamp of an agent
      "function updatedAt(string agentId) view returns (uint256)"
    ];

    this.contract = new ethers.Contract(address, abi ?? defaultAbi, providerOrSigner);
  }

  /**
   * Get the agent ID for a given agent address
   * @param agentAddress - The address of the agent
   * @returns The agent ID string
   */
  async getAgentId(agentAddress: string): Promise<string> {
    return await this.contract.agentId(agentAddress);
  }

  /**
   * Get the owner of an agent
   * @param agentId - The agent ID
   * @returns The owner address
   */
  async getOwner(agentId: string): Promise<string> {
    return await this.contract.owner(agentId);
  }

  /**
   * Get the metadata of an agent
   * @param agentId - The agent ID
   * @returns The agent metadata
   */
  async getMetadata(agentId: string): Promise<AgentMetadata> {
    const [name, description, capabilities, owner, createdAt, updatedAt] = await this.contract.metadata(agentId);
    return {
      name,
      description,
      capabilities,
      owner,
      createdAt: createdAt.toNumber(),
      updatedAt: updatedAt.toNumber()
    };
  }

  /**
   * Check if an agent is active
   * @param agentId - The agent ID
   * @returns True if the agent is active
   */
  async isActive(agentId: string): Promise<boolean> {
    return await this.contract.isActive(agentId);
  }

  /**
   * Get the creation timestamp of an agent
   * @param agentId - The agent ID
   * @returns The creation timestamp
   */
  async getCreatedAt(agentId: string): Promise<number> {
    return (await this.contract.createdAt(agentId)).toNumber();
  }

  /**
   * Get the last update timestamp of an agent
   * @param agentId - The agent ID
   * @returns The update timestamp
   */
  async getUpdatedAt(agentId: string): Promise<number> {
    return (await this.contract.updatedAt(agentId)).toNumber();
  }

  /**
   * Get a complete agent passport
   * @param agentId - The agent ID
   * @returns The agent passport
   */
  async getAgentPassport(agentId: string): Promise<AgentPassport> {
    const [owner, metadata, isActive, createdAt, updatedAt] = await Promise.all([
      this.contract.owner(agentId),
      this.contract.metadata(agentId),
      this.contract.isActive(agentId),
      this.contract.createdAt(agentId),
      this.contract.updatedAt(agentId)
    ]);

    const [name, description, capabilities, ownerAddr, createdAtTime, updatedAtTime] = metadata;

    return {
      agentId,
      owner: ownerAddr,
      metadata: {
        name,
        description,
        capabilities,
        owner: ownerAddr,
        createdAt: createdAtTime.toNumber(),
        updatedAt: updatedAtTime.toNumber()
      },
      isActive,
      createdAt: createdAtTime.toNumber(),
      updatedAt: updatedAtTime.toNumber()
    };
  }
}