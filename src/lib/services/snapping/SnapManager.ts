// src/lib/services/snapping/SnapManager.ts
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
 * Gerenciador de snapping para blocos
 */
export class SnapManager {
  private readonly SOCKET_SNAP_DISTANCE = 60;

  /**
   * Encontra snapping de socket (para expressões)
   */
  findSocketSnap(
    draggedBlock: Block,
    position: BlockPosition,
    allBlocks: Block[]
  ): SnapResult {
    // Só blocos com OUTPUT podem conectar em sockets
    if (!draggedBlock.definition.output) {
      return { snapped: false };
    }

    const candidates: SnapTarget[] = [];

    for (const targetBlock of allBlocks) {
      if (targetBlock.uuid === draggedBlock.uuid) continue;

      // 🔄 NOVO: aceita QUALQUER bloco que tenha inputs (statement ou expression)
      if (!targetBlock.definition.inputs || targetBlock.definition.inputs.length === 0) {
        continue;
      }

      for (const socket of targetBlock.definition.inputs) {
        // Verifica compatibilidade de tipo
        const accepts = socket.accepts && socket.accepts.length > 0
          ? socket.accepts
          : [socket.type];

        const draggedOutputType = draggedBlock.definition.output.type;

        if (!accepts.includes(draggedOutputType) && !accepts.includes('any')) {
          continue;
        }

        // Verifica se socket já está conectado
        if (targetBlock.getConnection && targetBlock.getConnection(socket.id)) {
          continue;
        }

        // Calcula posição do socket (à direita do bloco, alinhado com o input)
        const socketIndex = targetBlock.definition.inputs.findIndex(s => s.id === socket.id);
        const socketPos = {
          x: targetBlock.position.x + 200,        // À direita do bloco
          y: targetBlock.position.y + 50 + socketIndex * 50 // Alinhado com a linha do input
        };

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
      // Escolhe o socket mais próximo
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
   * Distância euclidiana entre dois pontos
   */
  private distance(p1: BlockPosition, p2: BlockPosition): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export const snapManager = new SnapManager();

