import type { 
  BlockDefinition, 
  BlockPosition, 
  BlockSocket, 
  Connection,
  ValidationResult 
} from './types';

/**
 * Classe principal que representa um bloco visual
 */
export class Block {
  public readonly uuid: string;
  public readonly definition: BlockDefinition;
  
  private _position: BlockPosition;
  private _values: Map<string, any>;
  private _connections: Map<string, Connection>;
  private _nextBlock: Block | null = null;
  private _previousBlock: Block | null = null;

  constructor(definition: BlockDefinition, position: BlockPosition = { x: 0, y: 0 }) {
    this.uuid = crypto.randomUUID();
    this.definition = definition;
    this._position = position;
    this._values = new Map();
    this._connections = new Map();
    
    // Inicializa valores padrão para inputs
    this.definition.inputs.forEach(input => {
      if (!input.required) {
        this._values.set(input.id, null);
      }
    });
  }

  // ========== Getters e Setters ==========
  
  get position(): BlockPosition {
    return { ...this._position };
  }

  setPosition(x: number, y: number): void {
    this._position = { x, y };
  }

  getValue(socketId: string): any {
    return this._values.get(socketId);
  }

  setValue(socketId: string, value: any): ValidationResult {
    const socket = this.definition.inputs.find(s => s.id === socketId);
    if (!socket) {
      return { valid: false, error: `Socket "${socketId}" não encontrado` };
    }

    // Validação de tipo básica
    if (!this.isTypeCompatible(value, socket.type)) {
      return { 
        valid: false, 
        error: `Tipo incompatível: esperado ${socket.type}` 
      };
    }

    this._values.set(socketId, value);
    return { valid: true };
  }

  // ========== Sistema de Conexões ==========

  canConnect(socketId: string, targetBlock: Block): ValidationResult {
    const socket = this.definition.inputs.find(s => s.id === socketId);
    if (!socket) {
      return { valid: false, error: 'Socket não encontrado' };
    }

    const targetOutput = targetBlock.definition.output;
    if (!targetOutput) {
      return { 
        valid: false, 
        error: 'Bloco de destino não possui saída' 
      };
    }

    // Validação de tipo
    const acceptedTypes = socket.accepts || [socket.type];
    if (!acceptedTypes.includes(targetOutput.type) && !acceptedTypes.includes('any')) {
      return { 
        valid: false, 
        error: `Tipo incompatível: ${targetOutput.type} não aceito em ${socket.type}` 
      };
    }

    // Previne ciclos
    if (this.wouldCreateCycle(targetBlock)) {
      return { valid: false, error: 'Conexão criaria um ciclo' };
    }

    return { valid: true };
  }

  connect(socketId: string, targetBlock: Block): ValidationResult {
    const validation = this.canConnect(socketId, targetBlock);
    if (!validation.valid) {
      return validation;
    }

    const connection: Connection = {
      sourceBlockId: this.uuid,
      socketId,
      targetBlockId: targetBlock.uuid
    };

    this._connections.set(socketId, connection);
    return { valid: true };
  }

  disconnect(socketId: string): void {
    this._connections.delete(socketId);
  }

  getConnection(socketId: string): Connection | undefined {
    return this._connections.get(socketId);
  }

  getAllConnections(): Connection[] {
    return Array.from(this._connections.values());
  }

  // ========== Controle de Fluxo (Next/Previous) ==========

  get nextBlock(): Block | null {
    return this._nextBlock;
  }

  set nextBlock(block: Block | null) {
    if (block && !this.definition.hasNext) {
      throw new Error('Este bloco não suporta conexão "next"');
    }
    this._nextBlock = block;
    if (block) {
      block._previousBlock = this;
    }
  }

  get previousBlock(): Block | null {
    return this._previousBlock;
  }

  // ========== Validações ==========

  private wouldCreateCycle(targetBlock: Block): boolean {
    let current: Block | null = targetBlock;
    const visited = new Set<string>();

    while (current) {
      if (current.uuid === this.uuid) {
        return true;
      }
      
      if (visited.has(current.uuid)) {
        break; // Já visitamos este bloco
      }
      
      visited.add(current.uuid);
      
      // Verifica todas as conexões
      const connections = current.getAllConnections();
      if (connections.length > 0) {
        // Simplificado: verifica primeira conexão
        // Em produção, percorreria todas
        break;
      }
      
      current = current.nextBlock;
    }

    return false;
  }

  private isTypeCompatible(value: any, expectedType: DataType): boolean {
    if (expectedType === 'any') return true;

    const valueType = typeof value;
    
    switch (expectedType) {
      case 'number':
        return valueType === 'number' && !isNaN(value);
      case 'text':
        return valueType === 'string';
      case 'boolean':
        return valueType === 'boolean';
      case 'void':
        return value === null || value === undefined;
      default:
        return false;
    }
  }

  // ========== Serialização ==========

  toJSON(): BlockState {
    return {
      uuid: this.uuid,
      definitionId: this.definition.id,
      position: this.position,
      values: this._values,
      connections: this.getAllConnections(),
      nextBlockId: this._nextBlock?.uuid,
      previousBlockId: this._previousBlock?.uuid
    };
  }

  // ========== Debug ==========

  toString(): string {
    return `Block(${this.definition.label}, id=${this.uuid.slice(0, 8)})`;
  }
}

