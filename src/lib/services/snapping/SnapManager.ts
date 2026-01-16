import type { Block, BlockPosition } from '$lib/services/block-engine';

export interface SnapTarget {
  block: Block;
  type: 'next' | 'previous' | 'socket';
  socketId?: string;
  position: BlockPosition;
  distance: number;
}

export interface SnapResult {
  snapped: boolean;
  target?: SnapTarget;
  position?: BlockPosition;
}

/**
 * Gerenciador de snapping (imantação) entre blocos
 */
export class SnapManager {
  private readonly SNAP_DISTANCE = 30; // pixels
  private readonly VERTICAL_SNAP_TOLERANCE = 50;
  private readonly SOCKET_SNAP_DISTANCE = 40;

  /**
   * Calcula snapping vertical (previous/next)
   */
  findVerticalSnap(
    draggedBlock: Block,
    position: BlockPosition,
    allBlocks: Block[]
  ): SnapResult {
    if (!draggedBlock.definition.hasPrevious && !draggedBlock.definition.hasNext) {
      return { snapped: false };
    }

    const candidates: SnapTarget[] = [];

    for (const targetBlock of allBlocks) {
      if (targetBlock.uuid === draggedBlock.uuid) continue;

      // Verifica se pode conectar ABAIXO do target (target.next → dragged)
      if (
        targetBlock.definition.hasNext &&
        draggedBlock.definition.hasPrevious &&
        !targetBlock.nextBlock
      ) {
        const snapPos = this.calculateNextPosition(targetBlock);
        const distance = this.distance(position, snapPos);

        if (distance < this.SNAP_DISTANCE) {
          candidates.push({
            block: targetBlock,
            type: 'next',
            position: snapPos,
            distance
          });
        }
      }

      // Verifica se pode conectar ACIMA do target (dragged.next → target)
      if (
        draggedBlock.definition.hasNext &&
        targetBlock.definition.hasPrevious &&
        !targetBlock.previousBlock
      ) {
        const snapPos = this.calculatePreviousPosition(targetBlock, draggedBlock);
        const distance = this.distance(position, snapPos);

        if (distance < this.SNAP_DISTANCE) {
          candidates.push({
            block: targetBlock,
            type: 'previous',
            position: snapPos,
            distance
          });
        }
      }
    }

    // Retorna o mais próximo
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.distance - b.distance);
      const best = candidates[0];
      return {
        snapped: true,
        target: best,
        position: best.position
      };
    }

    return { snapped: false };
  }

  /**
   * Calcula snapping de sockets (conexão de expressões)
   */
  findSocketSnap(
    draggedBlock: Block,
    position: BlockPosition,
    allBlocks: Block[]
  ): SnapResult {
    if (!draggedBlock.definition.output) {
      return { snapped: false }; // Só blocos com output podem conectar em sockets
    }

    const candidates: SnapTarget[] = [];

    for (const targetBlock of allBlocks) {
      if (targetBlock.uuid === draggedBlock.uuid) continue;

      for (const socket of targetBlock.definition.inputs) {
        // Verifica se o socket aceita o tipo do output
        const accepts = socket.accepts || [socket.type];
        if (
          !accepts.includes(draggedBlock.definition.output.type) &&
          !accepts.includes('any')
        ) {
          continue;
        }

        // Verifica se já está conectado
        if (targetBlock.getConnection(socket.id)) {
          continue;
        }

        const socketPos = this.calculateSocketPosition(targetBlock, socket.id);
        const distance = this.distance(position, socketPos);

        if (distance < this.SOCKET_SNAP_DISTANCE) {
          candidates.push({
            block: targetBlock,
            type: 'socket',
            socketId: socket.id,
            position: socketPos,
            distance
          });
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.distance - b.distance);
      const best = candidates[0];
      return {
        snapped: true,
        target: best,
        position: best.position
      };
    }

    return { snapped: false };
  }

  /**
   * Calcula posição onde bloco deve ficar se conectar como next
   */
  private calculateNextPosition(block: Block): BlockPosition {
    return {
      x: block.position.x,
      y: block.position.y + 80 // Altura aproximada de um bloco
    };
  }

  /**
   * Calcula posição onde bloco deve ficar se conectar como previous
   */
  private calculatePreviousPosition(targetBlock: Block, draggedBlock: Block): BlockPosition {
    return {
      x: targetBlock.position.x,
      y: targetBlock.position.y - 80
    };
  }

  /**
   * Calcula posição do socket na tela
   */
  private calculateSocketPosition(block: Block, socketId: string): BlockPosition {
    const socketIndex = block.definition.inputs.findIndex(s => s.id === socketId);
    
    return {
      x: block.position.x + 150, // Largura do bloco + offset
      y: block.position.y + 40 + (socketIndex * 30) // Header + espaçamento
    };
  }

  /**
   * Distância euclidiana entre dois pontos
   */
  private distance(p1: BlockPosition, p2: BlockPosition): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Verifica se posição está próxima (para highlight visual)
   */
  isNearSnapTarget(
    position: BlockPosition,
    targetPosition: BlockPosition,
    tolerance: number = this.SNAP_DISTANCE
  ): boolean {
    return this.distance(position, targetPosition) < tolerance;
  }
}

export const snapManager = new SnapManager();

