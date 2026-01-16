<script lang="ts">
  import { BLOCK_CATALOG, CATEGORIES } from '$lib/services/block-engine';
  import type { BlockCategory } from '$lib/services/block-engine';

  const DRAG_BLOCK_TYPE = 'meupia-block-type';

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

  function handleDragStart(blockId: string, event: DragEvent) {
    if (!event.dataTransfer) return;
    
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(DRAG_BLOCK_TYPE, blockId);
    
    // Define a imagem do drag (opcional mas melhora UX)
    const dragImage = new Image();
    dragImage.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="%234A90E2" width="40" height="40" rx="4"/></svg>';
    event.dataTransfer.setDragImage(dragImage, 20, 20);
  }
</script>

<aside class="block-palette">
  <header class="palette-header">
    <h2>🧩 Blocos</h2>
  </header>

  <!-- Abas de categorias -->
  <nav class="category-tabs">
    <button
      class="tab"
      class:active={selectedCategory === 'all'}
      onclick={() => (selectedCategory = 'all')}
    >
      {categoryLabels.all}
    </button>
    {#each CATEGORIES as category}
      <button
        class="tab"
        class:active={selectedCategory === category}
        onclick={() => (selectedCategory = category)}
      >
        {categoryLabels[category]}
      </button>
    {/each}
  </nav>

  <!-- Lista de blocos -->
  <div class="blocks-list">
    {#each filteredBlocks as blockDef}
      <div
        class="palette-block"
        style="--block-color: {blockDef.color}"
        draggable="true"
        ondragstart={(event) => handleDragStart(blockDef.id, event)}
        role="button"
        tabindex="0"
        title={blockDef.helpText}
      >
        <div class="palette-block-icon">
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
    user-select: none;
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
    color: #333;
  }

  .category-tabs {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px;
    background: #f8f9fa;
    border-bottom: 1px solid #e0e0e0;
  }

  .tab {
    padding: 10px 12px;
    border: none;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    text-align: left;
    transition: all 0.2s;
    color: #666;
    font-weight: 500;
  }

  .tab:hover {
    background: #e3f2fd;
    color: #2196F3;
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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .palette-block:active {
    cursor: grabbing;
    opacity: 0.7;
  }

  .palette-block-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: var(--block-color);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    flex-shrink: 0;
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
    min-width: 0;
  }

  .palette-block-label {
    font-weight: 600;
    font-size: 13px;
    color: #333;
    margin-bottom: 2px;
  }

  .palette-block-type {
    font-size: 11px;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Scrollbar customizado */
  .blocks-list::-webkit-scrollbar {
    width: 6px;
  }

  .blocks-list::-webkit-scrollbar-track {
    background: #f0f0f0;
    border-radius: 3px;
  }

  .blocks-list::-webkit-scrollbar-thumb {
    background: #d0d0d0;
    border-radius: 3px;
  }

  .blocks-list::-webkit-scrollbar-thumb:hover {
    background: #b0b0b0;
  }
</style>
