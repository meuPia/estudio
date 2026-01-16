/**
 * Public API da Block Engine
 */

export { Block } from './Block';
export { BlockEngine, blockEngine } from './BlockEngine';
export { 
  BLOCK_CATALOG, 
  CATEGORIES,
  getBlockById, 
  getBlocksByCategory,
  getBlocksByLevel 
} from './BlockCatalog';

export type {
  BlockType,
  DataType,
  BlockCategory,
  BlockSocket,
  BlockDefinition,
  BlockPosition,
  Connection,
  BlockState,
  ValidationResult
} from './types';

