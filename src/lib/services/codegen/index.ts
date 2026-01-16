/**
 * Public API do módulo de geração de código
 */

export { ASTBuilder } from './ASTBuilder';
export { PortugolGenerator } from './PortugolGenerator';

export type {
  Program,
  Statement,
  Expression,
  ASTNode,
  VariableDeclaration,
  Assignment,
  WriteStatement,
  ReadExpression,
  IfStatement,
  WhileLoop,
  BinaryOperation,
  Literal,
  Identifier
} from './ASTBuilder';

