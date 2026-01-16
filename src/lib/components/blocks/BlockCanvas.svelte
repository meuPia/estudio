<script lang="ts">
  import BlockNode from './BlockNode.svelte';
  import ConnectionCurve from './ConnectionCurve.svelte';
  import { blocksStore } from '$lib/stores/blocks.svelte';
  import type { Block } from '$lib/services/block-engine';

  const DRAG_BLOCK_TYPE = 'meupia-block-type';
  
  // Custom Drag State for Port Logic
  let dragState = $state<{
    active: boolean;
    fromBlock: Block | null;
    fromSocketId: string | null;
    isInput: boolean; // Track directionality
    currentX: number;
    currentY: number;
  }>({
    active: false,
    fromBlock: null,
    fromSocketId: null,
    isInput: false,
    currentX: 0,
    currentY: 0
  });

  let canvasRef: HTMLElement;

  // --- HTML5 Drag Handlers (Palette) ---

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  function handleDrop(event: DragEvent) {
    const blockId = event.dataTransfer?.getData(DRAG_BLOCK_TYPE);
    if (blockId) {
      event.preventDefault();
      const canvas = event.currentTarget as HTMLElement;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX ?? 0) - rect.left - 70;
      const y = (event.clientY ?? 0) - rect.top - 20;

      blocksStore.addBlock(blockId, { x, y });
    }
  }

  // --- Port Connection Logic ---

  function handlePortDragStart(block: Block, socketId: string, event: MouseEvent) {
    dragState.active = true;
    dragState.fromBlock = block;
    dragState.fromSocketId = socketId;
    
    // Determine if we are dragging FROM an input or Output
    // socketId === 'output' is standard for Output ports in my engine logic
    dragState.isInput = socketId !== 'output'; 
    
    dragState.currentX = event.clientX;
    dragState.currentY = event.clientY;
  }

  function handleGlobalMouseMove(event: MouseEvent) {
    if (!dragState.active) return;
    dragState.currentX = event.clientX;
    dragState.currentY = event.clientY;
  }

  function handleGlobalMouseUp(event: MouseEvent) {
    if (!dragState.active) return;

    // Use ElementFromPoint to find target
    const elemBelow = document.elementFromPoint(event.clientX, event.clientY);
    
    // Find closest .block-port (which now has pointer-events: auto and data attributes)
    const targetPortElement = elemBelow?.closest('.block-port') as HTMLElement | null;

    if (targetPortElement && dragState.fromBlock && dragState.fromSocketId) {
      const dataset = targetPortElement.dataset;
      const targetBlockId = dataset.blockId; // data-block-id
      const targetSocketId = dataset.socketId; // data-socket-id
      const targetIsInput = dataset.isInput === 'true';

      if (targetBlockId && targetSocketId && targetBlockId !== dragState.fromBlock.uuid) {
        
        let result = { valid: false, error: 'Invalid Connection' };

        // 1. Output (Drag) -> Input (Drop)
        if (!dragState.isInput && targetIsInput) {
          result = blocksStore.connectBlocks(
             dragState.fromBlock.uuid, 
             dragState.fromSocketId, 
             targetBlockId, 
             targetSocketId
          );
        }
        // 2. Input (Drag) -> Output (Drop)
        else if (dragState.isInput && !targetIsInput) {
           result = blocksStore.connectBlocks(
             targetBlockId, 
             targetSocketId, 
             dragState.fromBlock.uuid, 
             dragState.fromSocketId
           );
        } else {
           console.warn(`❌ Incompatible types: ${dragState.isInput ? 'Input' : 'Output'} to ${targetIsInput ? 'Input' : 'Output'}`);
        }

        if (result && !result.valid) {
          console.warn('❌ Erro na conexão:', result.error);
        } else if (result.valid) {
          console.log('✅ Connection formed!');
        }
      }
    }

    cleanupDrag();
  }

  function cleanupDrag() {
    dragState.active = false;
    dragState.fromBlock = null;
    dragState.fromSocketId = null;
    dragState.isInput = false;
  }

  function handleCanvasClick() {
    blocksStore.selectBlock(null);
  }

  function getDragSourcePosition() {
    if (!dragState.fromBlock || !dragState.fromSocketId) return { x: 0, y: 0 };
    return { 
       x: dragState.fromBlock.position.x + (dragState.fromSocketId === 'output' ? 140 : 0), 
       y: dragState.fromBlock.position.y + 20 
    };
  }
  let dragSourcePos = $derived(dragState.active ? getDragSourcePosition() : { x: 0, y: 0 });

</script>

<svelte:window 
  onmouseup={handleGlobalMouseUp} 
  onmousemove={handleGlobalMouseMove} 
/>

<div
  class="block-canvas"
  class:dragging-connection={dragState.active}
  bind:this={canvasRef}
  onclick={handleCanvasClick}
  ondragover={handleDragOver}
  ondrop={handleDrop}
  role="main"
>
  {#if !blocksStore.hasBlocks}
    <div class="empty-state">
      <div class="empty-icon">🎨</div>
      <h3>Canvas Vazio</h3>
      <p>Arraste blocos da paleta para começar</p>
    </div>
  {/if}

  {#each blocksStore.connections as conn}
    {@const fromBlock = blocksStore.blocks.find(b => b.uuid === conn.fromBlockId)}
    {@const toBlock = blocksStore.blocks.find(b => b.uuid === conn.toBlockId)}
    
    {#if fromBlock && toBlock}
      <ConnectionCurve
        {fromBlock}
        {toBlock}
        fromSocketId={conn.fromSocketId}
        toSocketId={conn.toSocketId}
        color="#4A90E2"
        animated={true}
      />
    {/if}
  {/each}

  {#each blocksStore.blocks as block (block.uuid)}
    <BlockNode
      {block}
      onPortDragStart={(socketId, e) => handlePortDragStart(block, socketId, e)}
    />
  {/each}

  {#if dragState.active}
    <svg class="drag-layer">
      <line
        x1={dragSourcePos.x}
        y1={dragSourcePos.y}
        x2={dragState.currentX}
        y2={dragState.currentY}
        stroke="#4A90E2"
        stroke-width="3"
        stroke-dasharray="5,5"
      />
      <circle
        cx={dragState.currentX}
        cy={dragState.currentY}
        r="10"
        fill="none"
        stroke="#4A90E2"
        stroke-width="2"
        opacity="0.6"
      />
    </svg>
  {/if}

</div>

<style>
  .block-canvas {
    flex: 1;
    position: relative;
    background: radial-gradient(#ccc 1px, transparent 1px);
    background-size: 20px 20px;
    background-color: #fafafa;
    overflow: hidden;
  }
  .block-canvas.dragging-connection { background-color: #f0f8ff; cursor: crosshair; }
  .empty-state {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    text-align: center; color: #999; pointer-events: none;
  }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
  
  .drag-layer {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    /* CRITICAL: Must be none otherwise it blocks elementFromPoint */
    pointer-events: none; 
    z-index: 9999;
  }
</style>
