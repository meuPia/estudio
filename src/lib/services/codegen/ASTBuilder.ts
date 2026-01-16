import type { Block } from '$lib/services/block-engine';

/**
 * AST (Abstract Syntax Tree) para código Portugol
 */

export type ASTNodeType =
  | 'Program'
  | 'VariableDeclaration'
  | 'Assignment'
  | 'IfStatement'
  | 'WhileLoop'
  | 'WriteStatement'
  | 'ReadExpression'
  | 'BinaryOperation'
  | 'Literal'
  | 'Identifier';

export interface ASTNode {
  type: ASTNodeType;
  blockId?: string; // Para rastreamento visual
}

export interface Program extends ASTNode {
  type: 'Program';
  body: Statement[];
}

export interface VariableDeclaration extends ASTNode {
  type: 'VariableDeclaration';
  name: string;
  initialValue?: Expression;
}

export interface Assignment extends ASTNode {
  type: 'Assignment';
  name: string;
  value: Expression;
}

export interface WriteStatement extends ASTNode {
  type: 'WriteStatement';
  value: Expression;
}

export interface ReadExpression extends ASTNode {
  type: 'ReadExpression';
  prompt?: string;
}

export interface IfStatement extends ASTNode {
  type: 'IfStatement';
  condition: Expression;
  consequent: Statement[];
  alternate?: Statement[];
}

export interface WhileLoop extends ASTNode {
  type: 'WhileLoop';
  condition: Expression;
  body: Statement[];
}

export interface BinaryOperation extends ASTNode {
  type: 'BinaryOperation';
  operator: '+' | '-' | '*' | '/' | '==' | '>' | '<' | '>=' | '<=';
  left: Expression;
  right: Expression;
}

export interface Literal extends ASTNode {
  type: 'Literal';
  value: string | number | boolean;
  dataType: 'number' | 'text' | 'boolean';
}

export interface Identifier extends ASTNode {
  type: 'Identifier';
  name: string;
}

export type Statement = 
  | VariableDeclaration 
  | Assignment 
  | WriteStatement 
  | IfStatement 
  | WhileLoop;

export type Expression = 
  | ReadExpression 
  | BinaryOperation 
  | Literal 
  | Identifier;

/**
 * Builder que converte blocos em AST
 */
export class ASTBuilder {
  private blockMap: Map<string, Block>;

  constructor(blocks: Block[]) {
    this.blockMap = new Map(blocks.map(b => [b.uuid, b]));
  }

  /**
   * Constrói o programa completo
   */
  build(): Program {
    const rootBlocks = this.getRootBlocks();
    const body: Statement[] = [];

    for (const root of rootBlocks) {
      const statements = this.buildStatementChain(root);
      body.push(...statements);
    }

    return {
      type: 'Program',
      body
    };
  }

  /**
   * Blocos raiz são aqueles sem predecessor
   */
  private getRootBlocks(): Block[] {
    return Array.from(this.blockMap.values()).filter(
      block => !block.previousBlock && block.definition.type === 'statement'
    );
  }

  /**
   * Constrói uma cadeia de statements seguindo o fluxo next
   */
  private buildStatementChain(startBlock: Block): Statement[] {
    const statements: Statement[] = [];
    let current: Block | null = startBlock;

    while (current) {
      try {
        const stmt = this.buildStatement(current);
        if (stmt) {
          statements.push(stmt);
        }
      } catch (error) {
        console.error(`Erro ao processar bloco ${current.uuid}:`, error);
      }
      
      current = current.nextBlock;
    }

    return statements;
  }

  /**
   * Constrói um statement a partir de um bloco
   */
  private buildStatement(block: Block): Statement | null {
    const def = block.definition;

    switch (def.id) {
      case 'io.write':
        return this.buildWrite(block);
      
      case 'var.declare':
        return this.buildVarDeclaration(block);
      
      case 'var.set':
        return this.buildAssignment(block);
      
      case 'control.if':
        return this.buildIf(block);
      
      case 'control.while':
        return this.buildWhile(block);
      
      default:
        console.warn(`Bloco statement desconhecido: ${def.id}`);
        return null;
    }
  }

  /**
   * Constrói uma expressão a partir de um bloco ou valor
   */
  private buildExpression(block: Block): Expression {
    const def = block.definition;

    switch (def.id) {
      case 'io.read':
        return this.buildRead(block);
      
      case 'var.get':
        return this.buildIdentifier(block);
      
      case 'op.add':
      case 'op.subtract':
      case 'op.compare.equal':
      case 'op.compare.greater':
        return this.buildBinaryOp(block);
      
      case 'literal.number':
      case 'literal.text':
        return this.buildLiteral(block);
      
      default:
        // Fallback: trata como literal do valor direto
        const value = block.getValue('value');
        return this.createLiteral(value ?? '');
    }
  }

  // ========== Builders Específicos ==========

  private buildWrite(block: Block): WriteStatement {
    const valueConn = block.getConnection('value');
    let value: Expression;

    if (valueConn) {
      const targetBlock = this.blockMap.get(valueConn.targetBlockId);
      value = targetBlock ? this.buildExpression(targetBlock) : this.createLiteral('');
    } else {
      // Pega valor do input editável
      const directValue = block.getValue('value');
      value = this.createLiteral(directValue ?? '');
    }

    return {
      type: 'WriteStatement',
      value,
      blockId: block.uuid
    };
  }

  private buildRead(block: Block): ReadExpression {
    const promptConn = block.getConnection('prompt');
    let prompt: string | undefined;

    if (promptConn) {
      const targetBlock = this.blockMap.get(promptConn.targetBlockId);
      if (targetBlock) {
        const expr = this.buildExpression(targetBlock);
        if (expr.type === 'Literal') {
          prompt = String(expr.value);
        }
      }
    } else {
      const directValue = block.getValue('prompt');
      prompt = directValue ? String(directValue) : undefined;
    }

    return {
      type: 'ReadExpression',
      prompt,
      blockId: block.uuid
    };
  }

  private buildVarDeclaration(block: Block): VariableDeclaration {
    const name = block.getValue('name') || 'variavel';
    const valueConn = block.getConnection('value');
    let initialValue: Expression | undefined;

    if (valueConn) {
      const targetBlock = this.blockMap.get(valueConn.targetBlockId);
      initialValue = targetBlock ? this.buildExpression(targetBlock) : undefined;
    } else {
      const directValue = block.getValue('value');
      if (directValue !== null && directValue !== undefined && directValue !== '') {
        initialValue = this.createLiteral(directValue);
      }
    }

    return {
      type: 'VariableDeclaration',
      name,
      initialValue,
      blockId: block.uuid
    };
  }

  private buildAssignment(block: Block): Assignment {
    const name = block.getValue('name') || 'variavel';
    const valueConn = block.getConnection('value');
    let value: Expression;

    if (valueConn) {
      const targetBlock = this.blockMap.get(valueConn.targetBlockId);
      value = targetBlock ? this.buildExpression(targetBlock) : this.createLiteral(0);
    } else {
      const directValue = block.getValue('value');
      value = this.createLiteral(directValue ?? 0);
    }

    return {
      type: 'Assignment',
      name,
      value,
      blockId: block.uuid
    };
  }

  private buildIf(block: Block): IfStatement {
    const condConn = block.getConnection('condition');
    let condition: Expression;

    if (condConn) {
      const targetBlock = this.blockMap.get(condConn.targetBlockId);
      condition = targetBlock ? this.buildExpression(targetBlock) : this.createLiteral(true);
    } else {
      // Fallback: condição padrão
      condition = this.createLiteral(true);
    }

    // TODO: Body interno do if (será implementado quando houver blocos aninhados)
    const consequent: Statement[] = [];

    return {
      type: 'IfStatement',
      condition,
      consequent,
      blockId: block.uuid
    };
  }

  private buildWhile(block: Block): WhileLoop {
    const condConn = block.getConnection('condition');
    let condition: Expression;

    if (condConn) {
      const targetBlock = this.blockMap.get(condConn.targetBlockId);
      condition = targetBlock ? this.buildExpression(targetBlock) : this.createLiteral(true);
    } else {
      // Fallback: condição padrão
      condition = this.createLiteral(true);
    }

    // TODO: Body interno do while (será implementado quando houver blocos aninhados)
    const body: Statement[] = [];

    return {
      type: 'WhileLoop',
      condition,
      body,
      blockId: block.uuid
    };
  }

  private buildBinaryOp(block: Block): BinaryOperation {
    const leftConn = block.getConnection('left');
    const rightConn = block.getConnection('right');

    const left = leftConn 
      ? this.buildExpression(this.blockMap.get(leftConn.targetBlockId)!) 
      : this.createLiteral(block.getValue('left') ?? 0);

    const right = rightConn 
      ? this.buildExpression(this.blockMap.get(rightConn.targetBlockId)!) 
      : this.createLiteral(block.getValue('right') ?? 0);

    const operatorMap: Record<string, BinaryOperation['operator']> = {
      'op.add': '+',
      'op.subtract': '-',
      'op.compare.equal': '==',
      'op.compare.greater': '>'
    };

    return {
      type: 'BinaryOperation',
      operator: operatorMap[block.definition.id] || '+',
      left,
      right,
      blockId: block.uuid
    };
  }

  private buildIdentifier(block: Block): Identifier {
    const name = block.getValue('name');
    return {
      type: 'Identifier',
      name: name || 'variavel',
      blockId: block.uuid
    };
  }

  private buildLiteral(block: Block): Literal {
    const value = block.getValue('value');
    return this.createLiteral(value);
  }

  private createLiteral(value: any): Literal {
    if (typeof value === 'number') {
      return { type: 'Literal', value, dataType: 'number' };
    } else if (typeof value === 'boolean') {
      return { type: 'Literal', value, dataType: 'boolean' };
    } else {
      // Tudo vira texto
      const textValue = value === null || value === undefined ? '' : String(value);
      return { type: 'Literal', value: textValue, dataType: 'text' };
    }
  }
}

