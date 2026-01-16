<script lang="ts">
  import { BLOCK_CATALOG, CATEGORIES } from '$lib/services/block-engine';
  import type { BlockCategory } from '$lib/services/block-engine';
  
  interface Props {
    onBlockSelect?: (definitionId: string) => void;
  }
  
  let { onBlockSelect }: Props = $props();
  
  let selectedCategory = $state<BlockCategory | 'all'>('all');
  
  const categoryLabels = {
    all: 'Todos',
    io: 'Entrada/Saída',
    variables: 'Variáveis',
    operators: 'Operadores',
    control: 'Controle',
    functions: 'Funções'
  };
  
  const filteredBlocks = $derived(
    selectedCategory === 'all' 
      ? BLOCK_CATALOG 
      : BLOCK_CATALOG.filter(b => b.category === selectedCategory)
  );
  
  function handleDragStart(e: DragEvent, blockId: string) {
    if (!e.dataTransfer) return;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', blockId);
  }
</script>

<aside class="block-palette">
  <header class="palette-header">
    <h2>Blocos</h2>
  </header>
  
  <nav class="category-tabs">
    <button 
      class="tab"
      class:active={selectedCategory === 'all'}
      onclick={() => selectedCategory = 'all'}
    >
      {categoryLabels.all}
    </button>
    {#each CATEGORIES as category}
      <button 
        class="tab"
        class:active={selectedCategory === category}
        onclick={() => selectedCategory = category}
      >
        {categoryLabels[category]}
      </button>
    {/each}
  </nav>
  
  <div class="blocks-list">
    {#each filteredBlocks as blockDef}
      <div 
        class="palette-block"
        style="--block-color: {blockDef.color}"
        draggable="true"
        ondragstart={(e) => handleDragStart(e, blockDef.id)}
        onclick={() => onBlockSelect?.(blockDef.id)}
        role="button"
        tabindex="0"
        title={blockDef.helpText}
      >
        <div class="palette-block-icon" style="background: {blockDef.color}">
          <span class="level-badge">{blockDef.pedagogyLevel}</span>
        </div>
        <div class="palette-block-info">
          <div class="palette-block-label">{blockDef.label}</div>
          <div class="palette-block-type">{blockDef.type}</div>
        </div>
      </div>
    {/each}
  </div>
</aside>

<style>
  .block-palette {
    width: 280px;
    background: #f8f9fa;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .palette-header {
    padding: 16px;
    border-bottom: 1px solid #e0e0e0;
    background: white;
  }
  
  .palette-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  .category-tabs {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px;
    background: #f8f9fa;
  }
  
  .tab {
    padding: 8px 12px;
    border: none;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    text-align: left;
    transition: all 0.2s;
  }
  
  .tab:hover {
    background: #e3f2fd;
  }
  
  .tab.active {
    background: #2196F3;
    color: white;
    font-weight: 600;
  }
  
  .blocks-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .palette-block {
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px;
    cursor: grab;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s;
  }
  
  .palette-block:hover {
    border-color: var(--block-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateX(4px);
  }
  
  .palette-block:active {
    cursor: grabbing;
    opacity: 0.7;
  }
  
  .palette-block-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    position: relative;
  }
  
  .level-badge {
    background: rgba(0, 0, 0, 0.2);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
  }
  
  .palette-block-info {
    flex: 1;
  }
  
  .palette-block-label {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 2px;
  }
  
  .palette-block-type {
    font-size: 11px;
    color: #666;
    text-transform: uppercase;
  }
</style>

