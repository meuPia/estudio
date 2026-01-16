import type { Block } from '../block-engine/types';
import type { BlockConnection } from '../../stores/blocks.svelte';

export class GraphTraverser {
  /**
   * Realiza uma ordenação topológica (DAG) nos blocos para determinar a ordem de execução.
   * Começa pelos blocos que não têm dependências de entrada (como 'Variáveis' ou 'Eventos')
   * e segue o fluxo de conexões.
   */
  static sortBlocks(blocks: Block[], connections: BlockConnection[]): Block[] {
    const visited = new Set<string>();
    const sorted: Block[] = [];
    const visiting = new Set<string>(); // Para detecção de ciclos (opcional aqui, mas bom para debug)

    // Mapa de Adjacência: BlockID -> Array de Conexões de Saída
    const adjacency = new Map<string, string[]>();

    // Identificar dependências (In-Degree): BlockID -> Quantas conexões entram nele
    const inDegree = new Map<string, number>();

    // Inicializa
    blocks.forEach(b => {
      adjacency.set(b.uuid, []);
      inDegree.set(b.uuid, 0);
    });

    // Popula grafo
    connections.forEach(conn => {
      // fromBlock = Output (Source)
      // toBlock = Input (Target)
      // Aresta: Source -> Target
      const outputs = adjacency.get(conn.fromBlockId) || [];
      outputs.push(conn.toBlockId);
      adjacency.set(conn.fromBlockId, outputs);

      const currentIn = inDegree.get(conn.toBlockId) || 0;
      inDegree.set(conn.toBlockId, currentIn + 1);
    });

    // Kahn's Algorithm para Topological Sort
    // 1. Encontrar nós com in-degree 0 (sem dependências)
    const queue: string[] = [];
    inDegree.forEach((count, id) => {
      if (count === 0) {
        queue.push(id);
      }
    });

    const resultIds: string[] = [];

    while (queue.length > 0) {
      // Ordena queue para determinismo (ex: por posição Y ou nome) se necessário
      // Aqui pegamos o primeiro (fila)
      const currentId = queue.shift()!;
      resultIds.push(currentId);

      const neighbors = adjacency.get(currentId) || [];
      for (const neighborId of neighbors) {
        const d = inDegree.get(neighborId)! - 1;
        inDegree.set(neighborId, d);
        if (d === 0) {
          queue.push(neighborId);
        }
      }
    }

    // Se resultIds.length < blocks.length, existe ciclo (grafo não é DAG)
    // Mas para geração de código, retornamos o que foi possível ou tratamos ciclos.

    // Mapeia IDs de volta para objetos Block
    return resultIds
      .map(id => blocks.find(b => b.uuid === id))
      .filter((b): b is Block => !!b);
  }

  /**
   * Gera o código a partir da lista ordenada
   */
  static generateCode(blocks: Block[], connections: BlockConnection[]): string {
    const sortedBlocks = this.sortBlocks(blocks, connections);
    const lines: string[] = [];

    // Contexto para armazenar valores de variáveis/expressões resolvidas
    // Mapa: BlockID -> Expressão/Nome da Variável
    const expressionMap = new Map<string, string>();

    for (const block of sortedBlocks) {
      const def = block.definition;

      // 1. Variáveis (Declaração)
      if (def.type === 'variable') {
        const varName = block.definition.label.replace(/\s+/g, '_'); // Simples sanitização

        // Busca valor inicial (conexão no input 'initialValue')
        const inputConn = connections.find(c => c.toBlockId === block.uuid && c.toSocketId === 'initialValue');
        let initialVal = '0';

        if (inputConn) {
          // Se conectado, usa o valor do bloco fonte (que já deve ter sido processado ou é expressão)
          // Mas cuidado: se for uma expressão complexa, talvez precisemos resolver recursivamente.
          // Com topological sort, o bloco fonte já apareceu?
          // Depende. Variáveis geralmente são raízes ou dependem de constantes.
          // Se for "Setar Variável" (comando), é diferente de "Declarar Variável".
          // Assumindo "Declarar":
          if (expressionMap.has(inputConn.fromBlockId)) {
            initialVal = expressionMap.get(inputConn.fromBlockId)!;
          }
        } else {
          // Valor literal do bloco
          // Assumindo que Block tem método getValue ou _values
          // Como Block.ts é privado, acessamos via values map se exposto, ou método
          // Aqui usamos block.getValue mockado na mente
          const val = (block as any).getValue('initialValue');
          if (val !== null) initialVal = String(val);
        }

        expressionMap.set(block.uuid, varName); // Variável pode ser usada por outros
        lines.push(`var ${varName} = ${initialVal}`);
      }

      // 2. Constantes (Número/Texto)
      else if (def.type === 'number' || def.type === 'text') {
        const val = (block as any).getValue('value') || (def.type === 'number' ? '0' : '""');
        const expr = def.type === 'text' ? `"${val}"` : String(val);
        expressionMap.set(block.uuid, expr);
      }

      // 3. Operadores (+, -, *, /)
      else if (['+', '-', '*', '/'].includes(def.label)) {
        // Busca operandos
        const leftConn = connections.find(c => c.toBlockId === block.uuid && c.toSocketId === 'left'); // supondo id 'left'
        const rightConn = connections.find(c => c.toBlockId === block.uuid && c.toSocketId === 'right'); // supondo id 'right'

        const left = leftConn && expressionMap.has(leftConn.fromBlockId)
          ? expressionMap.get(leftConn.fromBlockId)
          : '0';
        const right = rightConn && expressionMap.has(rightConn.fromBlockId)
          ? expressionMap.get(rightConn.fromBlockId)
          : '0';

        const expr = `(${left} ${def.label} ${right})`;
        expressionMap.set(block.uuid, expr);
      }

      // 4. Funções de Saída (Escreva)
      else if (def.type === 'function' && def.label.toLowerCase() === 'escreva') {
        const inputConn = connections.find(c => c.toBlockId === block.uuid); // pega qualquer input (value)
        let content = '""';
        if (inputConn && expressionMap.has(inputConn.fromBlockId)) {
          content = expressionMap.get(inputConn.fromBlockId)!;
        } else {
          const val = (block as any).getValue('value');
          if (val) content = `"${val}"`;
        }

        lines.push(`escreva(${content})`);
      }
    }

    return lines.join('\n');
  }
}
