<script lang="ts">
  import { blocksStore } from '$lib/stores/blocks.svelte';
  import BlockRenderer from './BlockRenderer.svelte';
  
  let canvasRef: HTMLElement;
  
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer || !canvasRef) return;
    
    const blockId = e.dataTransfer.getData('text/plain');
    if (!blockId) return;
    
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left - 75; // Centraliza o bloco no cursor
    const y = e.clientY - rect.top - 20;
    
    blocksStore.addBlock(blockId, x, y);
  }
  
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }
  
  function handleCanvasClick(e: MouseEvent) {
    // Desseleciona se clicar no canvas vazio
    if (e.target === canvasRef) {
      blocksStore.selectBlock(null);
    }
  }
</script>

<div 
  class="block-canvas"
  bind:this={canvasRef}
  ondrop={handleDrop}
  ondragover={handleDragOver}
  onclick={handleCanvasClick}
  role="main"
>
  {#if blocksStore.blocks.length === 0}
    <div class="canvas-empty">
      <div class="empty-icon">🧩</div>
      <h3>Arraste blocos aqui para começar</h3>
      <p>Selecione um bloco da paleta à esquerda e arraste para o canvas</p>
    </div>
  {/if}
  
  {#each blocksStore.blocks as block (block.uuid)}
    <BlockRenderer {block} />
  {/each}
</div>

<style>
  .block-canvas {
    flex: 1;
    background: 
      linear-gradient(90deg, #f0f0f0 1px, transparent 1px),
      linear-gradient(180deg, #f0f0f0 1px, transparent 1px);
    background-size: 20px 20px;
    background-position: -1px -1px;
    position: relative;
    overflow: auto;
    min-height: 100%;
  }
  
  .canvas-empty {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: #999;
    pointer-events: none;
  }
  
  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  .canvas-empty h3 {
    font-size: 20px;
    margin: 0 0 8px 0;
    color: #666;
  }
  
  .canvas-empty p {
    font-size: 14px;
    margin: 0;
  }
</style>

