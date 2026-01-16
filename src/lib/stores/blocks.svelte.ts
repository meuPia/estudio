/**
 * Store global para gerenciar estado dos blocos (Svelte 5 Runes)
 */

import { blockEngine } from '$lib/services/block-engine';
import type { Block } from '$lib/services/block-engine';
import { GraphTraverser } from '$lib/services/code-generator/GraphTraverser';

export interface BlockConnection {
  fromBlockId: string;
  fromSocketId: string;
  toBlockId: string;
  toSocketId: string;
}

class BlocksStore {
  blocks = $state<Block[]>([]);
  connections = $state<BlockConnection[]>([]);
  selectedBlock = $state<Block | null>(null);
  consoleOutput = $state<string[]>([]);
  isRunning = $state(false);

  constructor() {
    this.refresh();
  }

  get blockCount() {
    return this.blocks.length;
  }

  get hasBlocks() {
    return this.blocks.length > 0;
  }

  addBlock(definitionId: string, x: number, y: number) {
    const block = blockEngine.createBlock(definitionId, { x, y });
    if (block) {
      this.refresh();
      return block;
    }
    return null;
  }

  removeBlock(uuid: string) {
    this.connections = this.connections.filter(
      conn => conn.fromBlockId !== uuid && conn.toBlockId !== uuid
    );
    blockEngine.deleteBlock(uuid);
    this.refresh();

    if (this.selectedBlock?.uuid === uuid) {
      this.selectedBlock = null;
    }
  }

  selectBlock(block: Block | null) {
    this.selectedBlock = block;
  }

  updateBlockPosition(uuid: string, x: number, y: number) {
    const index = this.blocks.findIndex(b => b.uuid === uuid);
    if (index !== -1) {
      const block = this.blocks[index];
      block.setPosition(x, y);
      this.blocks[index] = block;
    }
  }

  connectBlocks(fromBlockId: string, fromSocketId: string, toBlockId: string, toSocketId: string) {
    const fromBlock = blockEngine.getBlock(fromBlockId);
    const toBlock = blockEngine.getBlock(toBlockId);

    if (!fromBlock || !toBlock) {
      return { valid: false, error: "Blocks not found" };
    }

    // Call internal block validation
    const result = toBlock.connect(toSocketId, fromBlock);

    if (result.valid) {
      // Add connection
      this.connections.push({
        fromBlockId,
        fromSocketId,
        toBlockId,
        toSocketId
      });
      this.refresh();
      return { valid: true };
    }

    return result;
  }

  clearAll() {
    blockEngine.clear();
    this.blocks = [];
    this.connections = [];
    this.selectedBlock = null;
    this.consoleOutput = [];
  }

  refresh() {
    this.blocks = [...blockEngine.getAllBlocks()];
  }

  // --- Code Generation via Graph Traversal ---
  generateCode(): string {
    // Clone arrays to prevent mutation issues outside
    return GraphTraverser.generateCode([...this.blocks], [...this.connections]);
  }

  async runCode() {
    this.isRunning = true;
    this.consoleOutput = [];
    const code = this.generateCode();

    try {
      const response = await fetch('http://localhost:8000/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.consoleOutput = result.output || ["No output"];

    } catch (e: any) {
      console.error(e);
      this.consoleOutput = [`Erro de execução: ${e.message}`];
      this.consoleOutput.push("--- SPROCKET MODE (Simulação Local) ---");
      this.consoleOutput.push(...code.split('\n').map(l => `> ${l}`));
    } finally {
      this.isRunning = false;
    }
  }
}

export const blocksStore = new BlocksStore();
