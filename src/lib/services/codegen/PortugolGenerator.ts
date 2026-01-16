import type {
  Program,
  Statement,
  Expression,
  BinaryOperation,
  Literal,
  Identifier,
  VariableDeclaration,
  Assignment,
  WriteStatement,
  ReadExpression,
  IfStatement,
  WhileLoop
} from './ASTBuilder';

/**
 * Gerador de código Portugol a partir da AST
 */
export class PortugolGenerator {
  private indentLevel = 0;
  private readonly INDENT = '  '; // 2 espaços

  /**
   * Gera o código Portugol completo
   */
  generate(ast: Program): string {
    const lines: string[] = [
      'programa {',
      '  funcao inicio() {'
    ];

    this.indentLevel = 2;

    if (ast.body.length === 0) {
      lines.push(this.indent('// Arraste blocos para o canvas para começar'));
    } else {
      for (const stmt of ast.body) {
        const stmtLines = this.generateStatement(stmt);
        lines.push(...stmtLines);
      }
    }

    this.indentLevel = 1;
    lines.push('  }');
    lines.push('}');

    return lines.join('\n');
  }

  /**
   * Gera código para um statement
   */
  private generateStatement(stmt: Statement): string[] {
    switch (stmt.type) {
      case 'WriteStatement':
        return this.generateWrite(stmt);

      case 'VariableDeclaration':
        return this.generateVarDeclaration(stmt);

      case 'Assignment':
        return this.generateAssignment(stmt);

      case 'IfStatement':
        return this.generateIf(stmt);

      case 'WhileLoop':
        return this.generateWhile(stmt);

      default:
        return [this.indent('// Statement desconhecido')];
    }
  }

  /**
   * Gera: escreva(valor)
   */
  private generateWrite(stmt: WriteStatement): string[] {
    const value = this.generateExpression(stmt.value);
    return [this.indent(`escreva(${value})`)];
  }

  /**
   * Gera: var nome = valor
   * ou: var nome (se sem valor inicial)
   */
  private generateVarDeclaration(stmt: VariableDeclaration): string[] {
    const name = stmt.name;
    
    if (stmt.initialValue) {
      const value = this.generateExpression(stmt.initialValue);
      return [this.indent(`var ${name} = ${value}`)];
    } else {
      return [this.indent(`var ${name}`)];
    }
  }

  /**
   * Gera: nome = valor
   */
  private generateAssignment(stmt: Assignment): string[] {
    const name = stmt.name;
    const value = this.generateExpression(stmt.value);
    return [this.indent(`${name} = ${value}`)];
  }

  /**
   * Gera: se (condicao) entao { ... }
   */
  private generateIf(stmt: IfStatement): string[] {
    const lines: string[] = [];
    const condition = this.generateExpression(stmt.condition);
    
    lines.push(this.indent(`se (${condition}) entao {`));
    
    this.indentLevel++;
    if (stmt.consequent.length === 0) {
      lines.push(this.indent('// Adicione blocos aqui'));
    } else {
      stmt.consequent.forEach((s: Statement) => {
        lines.push(...this.generateStatement(s));
      });
    }
    this.indentLevel--;

    // Bloco senao (opcional)
    if (stmt.alternate && stmt.alternate.length > 0) {
      lines.push(this.indent('} senao {'));
      this.indentLevel++;
      stmt.alternate.forEach((s: Statement) => {
        lines.push(...this.generateStatement(s));
      });
      this.indentLevel--;
    }

    lines.push(this.indent('}'));
    
    return lines;
  }

  /**
   * Gera: enquanto (condicao) faca { ... }
   */
  private generateWhile(stmt: WhileLoop): string[] {
    const lines: string[] = [];
    const condition = this.generateExpression(stmt.condition);
    
    lines.push(this.indent(`enquanto (${condition}) faca {`));
    
    this.indentLevel++;
    if (stmt.body.length === 0) {
      lines.push(this.indent('// Adicione blocos aqui'));
    } else {
      stmt.body.forEach((s: Statement) => {
        lines.push(...this.generateStatement(s));
      });
    }
    this.indentLevel--;
    
    lines.push(this.indent('}'));
    
    return lines;
  }

  /**
   * Gera código para uma expressão
   */
  private generateExpression(expr: Expression): string {
    switch (expr.type) {
      case 'Literal':
        return this.generateLiteral(expr);

      case 'Identifier':
        return this.generateIdentifier(expr);

      case 'ReadExpression':
        return this.generateRead(expr);

      case 'BinaryOperation':
        return this.generateBinaryOp(expr);

      default:
        return '???';
    }
  }

  /**
   * Gera literal: "texto", 42, verdadeiro
   */
  private generateLiteral(lit: Literal): string {
    if (lit.dataType === 'text') {
      // Escapa aspas duplas se necessário
      const escaped = String(lit.value).replace(/"/g, '\\"');
      return `"${escaped}"`;
    } else if (lit.dataType === 'boolean') {
      return lit.value ? 'verdadeiro' : 'falso';
    } else {
      return String(lit.value);
    }
  }

  /**
   * Gera identificador: nomeVariavel
   */
  private generateIdentifier(id: Identifier): string {
    return id.name;
  }

  /**
   * Gera: leia() ou leia("prompt")
   */
  private generateRead(expr: ReadExpression): string {
    if (expr.prompt) {
      const escaped = expr.prompt.replace(/"/g, '\\"');
      return `leia("${escaped}")`;
    } else {
      return 'leia()';
    }
  }

  /**
   * Gera operação binária: (esquerda op direita)
   */
  private generateBinaryOp(op: BinaryOperation): string {
    const left = this.generateExpression(op.left);
    const right = this.generateExpression(op.right);
    
    // Mapeia operadores para Portugol
    const operatorMap: Record<string, string> = {
      '==': '==',
      '>': '>',
      '<': '<',
      '>=': '>=',
      '<=': '<=',
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/'
    };

    const operator = operatorMap[op.operator] || op.operator;
    
    // Adiciona parênteses para clareza
    return `(${left} ${operator} ${right})`;
  }

  /**
   * Adiciona indentação
   */
  private indent(text: string): string {
    return this.INDENT.repeat(this.indentLevel) + text;
  }
}

