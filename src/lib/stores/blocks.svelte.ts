/**
 * Store global para gerenciar estado dos blocos (Svelte 5 Runes)
 */

import { blockEngine } from '$lib/services/block-engine';
import type { Block } from '$lib/services/block-engine';

class BlocksStore {
  blocks = $state<Block[]>([]);
  selectedBlock = $state<Block | null>(null);

  get blockCount() {
    return this.blocks.length;
  }

  get hasBlocks() {
    return this.blocks.length > 0;
  }

  addBlock(definitionId: string, x: number, y: number) {
    const block = blockEngine.createBlock(definitionId, { x, y });
    if (block) {
      this.blocks = blockEngine.getAllBlocks();
      return block;
    }
    return null;
  }

  removeBlock(uuid: string) {
    blockEngine.deleteBlock(uuid);
    this.blocks = blockEngine.getAllBlocks();
    
    if (this.selectedBlock?.uuid === uuid) {
      this.selectedBlock = null;
    }
  }

  selectBlock(block: Block | null) {
    this.selectedBlock = block;
  }

  updateBlockPosition(uuid: string, x: number, y: number) {
    const block = blockEngine.getBlock(uuid);
    if (block) {
      block.setPosition(x, y);
      this.blocks = [...this.blocks]; // Força reatividade
    }
  }

  clearAll() {
    blockEngine.clear();
    this.blocks = [];
    this.selectedBlock = null;
  }

  // ✨ IMPORTANTE: Força atualização do estado
  refresh() {
    this.blocks = [...blockEngine.getAllBlocks()];
  }
}

export const blocksStore = new BlocksStore();

