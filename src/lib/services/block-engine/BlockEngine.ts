import { Block } from './Block';
import { getBlockById, BLOCK_CATALOG } from './BlockCatalog';
import type { BlockDefinition, BlockPosition, BlockState } from './types';

/**
 * Gerenciador central da Block Engine
 * Responsável por criar, gerenciar e persistir blocos
 */
export class BlockEngine {
  private blocks: Map<string, Block> = new Map();

  // ========== Criação de Blocos ==========

  createBlock(
    definitionId: string, 
    position: BlockPosition = { x: 0, y: 0 }
  ): Block | null {
    const definition = getBlockById(definitionId);
    if (!definition) {
      console.error(`Definição de bloco não encontrada: ${definitionId}`);
      return null;
    }

    const block = new Block(definition, position);
    this.blocks.set(block.uuid, block);
    return block;
  }

  createBlockFromDefinition(
    definition: BlockDefinition,
    position: BlockPosition = { x: 0, y: 0 }
  ): Block {
    const block = new Block(definition, position);
    this.blocks.set(block.uuid, block);
    return block;
  }

  // ========== Gerenciamento ==========

  getBlock(uuid: string): Block | undefined {
    return this.blocks.get(uuid);
  }

  getAllBlocks(): Block[] {
    return Array.from(this.blocks.values());
  }

  deleteBlock(uuid: string): boolean {
    const block = this.blocks.get(uuid);
    if (!block) return false;

    // Remove conexões
    block.getAllConnections().forEach(conn => {
      const target = this.blocks.get(conn.targetBlockId);
      if (target) {
        // Cleanup necessário
      }
    });

    // Remove do fluxo
    if (block.previousBlock) {
      block.previousBlock.nextBlock = block.nextBlock;
    }
    if (block.nextBlock) {
      // A propriedade previousBlock é privada, mas o setter cuida disso
    }

    return this.blocks.delete(uuid);
  }

  clear(): void {
    this.blocks.clear();
  }

  // ========== Consultas ==========

  getRootBlocks(): Block[] {
    return this.getAllBlocks().filter(block => 
      !block.previousBlock && block.definition.hasPrevious
    );
  }

  getBlocksAt(x: number, y: number, tolerance: number = 20): Block[] {
    return this.getAllBlocks().filter(block => {
      const pos = block.position;
      return Math.abs(pos.x - x) <= tolerance && 
             Math.abs(pos.y - y) <= tolerance;
    });
  }

  // ========== Serialização ==========

  serialize(): BlockState[] {
    return this.getAllBlocks().map(block => block.toJSON());
  }

  deserialize(states: BlockState[]): void {
    this.clear();

    // Fase 1: Criar todos os blocos
    const blockMap = new Map<string, Block>();
    states.forEach(state => {
      const definition = getBlockById(state.definitionId);
      if (!definition) {
        console.error(`Definição não encontrada: ${state.definitionId}`);
        return;
      }

      const block = new Block(definition, state.position);
      // Restaura UUID original
      (block as any).uuid = state.uuid;
      
      // Restaura valores
      state.values.forEach((value, key) => {
        block.setValue(key, value);
      });

      blockMap.set(block.uuid, block);
      this.blocks.set(block.uuid, block);
    });

    // Fase 2: Reconectar
    states.forEach(state => {
      const block = blockMap.get(state.uuid);
      if (!block) return;

      // Reconecta inputs
      state.connections.forEach(conn => {
        const target = blockMap.get(conn.targetBlockId);
        if (target) {
          block.connect(conn.socketId, target);
        }
      });

      // Reconecta fluxo
      if (state.nextBlockId) {
        const nextBlock = blockMap.get(state.nextBlockId);
        if (nextBlock) {
          block.nextBlock = nextBlock;
        }
      }
    });
  }

  // ========== Debug ==========

  printStructure(): void {
    console.log('=== Block Engine Structure ===');
    console.log(`Total blocks: ${this.blocks.size}`);
    
    this.getRootBlocks().forEach(root => {
      this.printBlockChain(root, 0);
    });
  }

  private printBlockChain(block: Block, indent: number): void {
    const prefix = '  '.repeat(indent);
    console.log(`${prefix}${block.toString()}`);
    
    if (block.nextBlock) {
      this.printBlockChain(block.nextBlock, indent + 1);
    }
  }
}

// Singleton para facilitar acesso
export const blockEngine = new BlockEngine();

