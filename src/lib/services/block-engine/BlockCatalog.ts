import type { BlockDefinition } from './types';

/**
 * Catálogo de blocos disponíveis para o MVP
 * Organizado por categoria e nível pedagógico
 */

const COLOR_SCHEME = {
  io: '#4A90E2',         // Azul
  variables: '#E27A3F',  // Laranja
  control: '#F5A623',    // Amarelo
  operators: '#7ED321',  // Verde
  functions: '#BD10E0'   // Roxo
} as const;

export const BLOCK_CATALOG: BlockDefinition[] = [
  // ==================== ENTRADA/SAÍDA ====================
  {
    id: 'io.write',
    category: 'io',
    type: 'statement',
    label: 'escreva',
    color: COLOR_SCHEME.io,
    inputs: [
      { 
        id: 'value', 
        label: 'valor', 
        type: 'any', 
        required: true,
        accepts: ['text', 'number', 'boolean']
      }
    ],
    hasNext: true,
    hasPrevious: true,
    pedagogyLevel: 1,
    helpText: 'Exibe uma mensagem ou valor na tela',
    examples: ['escreva("Olá, mundo!")', 'escreva(42)'],
    codeTemplate: 'escreva({value})'
  },

  {
    id: 'io.read',
    category: 'io',
    type: 'expression',
    label: 'leia',
    color: COLOR_SCHEME.io,
    inputs: [
      { 
        id: 'prompt', 
        label: 'mensagem', 
        type: 'text', 
        required: false 
      }
    ],
    output: { 
      id: 'result', 
      label: '', 
      type: 'text' 
    },
    hasNext: false,
    hasPrevious: false,
    pedagogyLevel: 1,
    helpText: 'Recebe um valor digitado pelo usuário',
    examples: ['nome = leia("Digite seu nome:")'],
    codeTemplate: 'leia({prompt})'
  },

  // ==================== VARIÁVEIS ====================
  {
    id: 'var.declare',
    category: 'variables',
    type: 'statement',
    label: 'criar variável',
    color: COLOR_SCHEME.variables,
    inputs: [
      { 
        id: 'name', 
        label: 'nome', 
        type: 'text', 
        required: true 
      },
      { 
        id: 'value', 
        label: 'valor inicial', 
        type: 'any', 
        required: false,
        accepts: ['number', 'text', 'boolean']
      }
    ],
    hasNext: true,
    hasPrevious: true,
    pedagogyLevel: 1,
    helpText: 'Cria uma variável para guardar informações',
    examples: ['var idade: inteiro = 10', 'var nome: texto = "João"'],
    codeTemplate: 'var {name} = {value}'
  },

  {
    id: 'var.get',
    category: 'variables',
    type: 'expression',
    label: 'obter variável',
    color: COLOR_SCHEME.variables,
    inputs: [
      { 
        id: 'name', 
        label: 'nome', 
        type: 'text', 
        required: true 
      }
    ],
    output: { 
      id: 'value', 
      label: '', 
      type: 'any' 
    },
    hasNext: false,
    hasPrevious: false,
    pedagogyLevel: 1,
    helpText: 'Obtém o valor armazenado em uma variável',
    examples: ['minhaIdade', 'contador'],
    codeTemplate: '{name}'
  },

  {
    id: 'var.set',
    category: 'variables',
    type: 'statement',
    label: 'alterar variável',
    color: COLOR_SCHEME.variables,
    inputs: [
      { 
        id: 'name', 
        label: 'nome', 
        type: 'text', 
        required: true 
      },
      { 
        id: 'value', 
        label: 'novo valor', 
        type: 'any', 
        required: true,
        accepts: ['number', 'text', 'boolean']
      }
    ],
    hasNext: true,
    hasPrevious: true,
    pedagogyLevel: 1,
    helpText: 'Altera o valor de uma variável existente',
    examples: ['idade = 11', 'contador = contador + 1'],
    codeTemplate: '{name} = {value}'
  },

  // ==================== OPERADORES ====================
  {
    id: 'op.add',
    category: 'operators',
    type: 'expression',
    label: '+',
    color: COLOR_SCHEME.operators,
    inputs: [
      { id: 'left', label: 'esquerda', type: 'number', required: true },
      { id: 'right', label: 'direita', type: 'number', required: true }
    ],
    output: { id: 'result', label: '', type: 'number' },
    hasNext: false,
    hasPrevious: false,
    pedagogyLevel: 1,
    helpText: 'Soma dois números',
    examples: ['5 + 3 = 8'],
    codeTemplate: '({left} + {right})'
  },

  {
    id: 'op.subtract',
    category: 'operators',
    type: 'expression',
    label: '-',
    color: COLOR_SCHEME.operators,
    inputs: [
      { id: 'left', label: 'esquerda', type: 'number', required: true },
      { id: 'right', label: 'direita', type: 'number', required: true }
    ],
    output: { id: 'result', label: '', type: 'number' },
    hasNext: false,
    hasPrevious: false,
    pedagogyLevel: 1,
    helpText: 'Subtrai dois números',
    examples: ['10 - 3 = 7'],
    codeTemplate: '({left} - {right})'
  },

  {
    id: 'op.compare.equal',
    category: 'operators',
    type: 'expression',
    label: '=',
    color: COLOR_SCHEME.operators,
    inputs: [
      { id: 'left', label: 'esquerda', type: 'any', required: true },
      { id: 'right', label: 'direita', type: 'any', required: true }
    ],
    output: { id: 'result', label: '', type: 'boolean' },
    hasNext: false,
    hasPrevious: false,
    pedagogyLevel: 2,
    helpText: 'Verifica se dois valores são iguais',
    examples: ['5 = 5 → verdadeiro', '3 = 7 → falso'],
    codeTemplate: '({left} == {right})'
  },

  {
    id: 'op.compare.greater',
    category: 'operators',
    type: 'expression',
    label: '>',
    color: COLOR_SCHEME.operators,
    inputs: [
      { id: 'left', label: 'esquerda', type: 'number', required: true },
      { id: 'right', label: 'direita', type: 'number', required: true }
    ],
    output: { id: 'result', label: '', type: 'boolean' },
    hasNext: false,
    hasPrevious: false,
    pedagogyLevel: 2,
    helpText: 'Verifica se o primeiro número é maior que o segundo',
    examples: ['8 > 5 → verdadeiro'],
    codeTemplate: '({left} > {right})'
  },

  // ==================== CONTROLE ====================
  {
    id: 'control.if',
    category: 'control',
    type: 'control',
    label: 'se',
    color: COLOR_SCHEME.control,
    inputs: [
      { 
        id: 'condition', 
        label: 'condição', 
        type: 'boolean', 
        required: true 
      }
    ],
    hasNext: true,
    hasPrevious: true,
    pedagogyLevel: 2,
    helpText: 'Executa comandos apenas se a condição for verdadeira',
    examples: ['se (idade > 18) entao', '  escreva("Maior de idade")', 'fimse'],
    codeTemplate: 'se ({condition}) entao\n  {body}\nfimse'
  },

  {
    id: 'control.while',
    category: 'control',
    type: 'control',
    label: 'enquanto',
    color: COLOR_SCHEME.control,
    inputs: [
      { 
        id: 'condition', 
        label: 'condição', 
        type: 'boolean', 
        required: true 
      }
    ],
    hasNext: true,
    hasPrevious: true,
    pedagogyLevel: 3,
    helpText: 'Repete comandos enquanto a condição for verdadeira',
    examples: ['enquanto (contador < 10) faca', '  contador = contador + 1', 'fimenquanto'],
    codeTemplate: 'enquanto ({condition}) faca\n  {body}\nfimenquanto'
  },

  // ==================== LITERAIS ====================
  {
    id: 'literal.number',
    category: 'operators',
    type: 'expression',
    label: 'número',
    color: COLOR_SCHEME.operators,
    inputs: [
      { id: 'value', label: '', type: 'number', required: true }
    ],
    output: { id: 'result', label: '', type: 'number' },
    hasNext: false,
    hasPrevious: false,
    pedagogyLevel: 1,
    helpText: 'Um valor numérico',
    examples: ['42', '3.14', '-10'],
    codeTemplate: '{value}'
  },

  {
    id: 'literal.text',
    category: 'operators',
    type: 'expression',
    label: 'texto',
    color: COLOR_SCHEME.operators,
    inputs: [
      { id: 'value', label: '', type: 'text', required: true }
    ],
    output: { id: 'result', label: '', type: 'text' },
    hasNext: false,
    hasPrevious: false,
    pedagogyLevel: 1,
    helpText: 'Um texto ou mensagem',
    examples: ['"Olá"', '"Bem-vindo!"'],
    codeTemplate: '"{value}"'
  }
];

// ========== Utilitários ==========

export function getBlockById(id: string): BlockDefinition | undefined {
  return BLOCK_CATALOG.find(block => block.id === id);
}

export function getBlocksByCategory(category: BlockCategory): BlockDefinition[] {
  return BLOCK_CATALOG.filter(block => block.category === category);
}

export function getBlocksByLevel(level: number): BlockDefinition[] {
  return BLOCK_CATALOG.filter(block => block.pedagogyLevel <= level);
}

export const CATEGORIES = ['io', 'variables', 'operators', 'control'] as const;

