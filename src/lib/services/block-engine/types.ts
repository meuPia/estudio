// tipos.ts - Definições de tipos base
export type BlockType = 'statement' | 'expression' | 'control' | 'terminal';
export type DataType = 'number' | 'text' | 'boolean' | 'void';
export type BlockCategory = 'io' | 'variables' | 'control' | 'operators' | 'functions';

export interface BlockSocket {
  id: string;
  label: string;
  type: DataType;
  required: boolean;
  accepts?: DataType[];
}

export interface BlockDefinition {
  id: string;
  category: BlockCategory;
  type: BlockType;
  label: string;
  inputs: BlockSocket[];
  output?: BlockSocket;
  hasNext: boolean;
  hasPrevious: boolean;
  pedagogyLevel: 1 | 2 | 3 | 4 | 5;
  helpText: string;
  codeTemplate: string;
}

export interface BlockPosition {
  x: number;
  y: number;
}

export interface Connection {
  sourceBlockId: string;
  socketId: string;
  targetBlockId: string;
}

export interface BlockState {
  uuid: string;
  definitionId: string;
  position: BlockPosition;
  values: Record<string, any>;
  connections: Connection[];
}


