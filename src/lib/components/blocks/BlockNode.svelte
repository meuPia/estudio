<script lang="ts">
  import type { Block } from '$lib/services/block-engine';
  import BlockPort from './BlockPort.svelte';
  import BlockInput from './BlockInput.svelte';
  import { blocksStore } from '$lib/stores/blocks.svelte';

  interface Props {
    block: Block;
    onPortDragStart?: (socketId: string, e: MouseEvent) => void;
  }

  let { block, onPortDragStart }: Props = $props();

  let isDragging = $state(false);
  let dragOffset = $state({ x: 0, y: 0 });

  const isSelected = $derived(blocksStore.selectedBlock?.uuid === block.uuid);

  function handleMouseDown(e: MouseEvent) {
    // Check if target is inside a port or control
    if ((e.target as HTMLElement).closest('.block-port, .block-input-field, button')) return;

    e.stopPropagation();
    blocksStore.selectBlock(block);

    isDragging = true;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;

    const canvas = document.querySelector('.block-canvas') as HTMLElement;
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;

    blocksStore.updateBlockPosition(block.uuid, x, y);
  }

  function handleMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    blocksStore.removeBlock(block.uuid);
  }

  function handlePortMouseDown(socketId: string, e: MouseEvent) {
    // Only stop propagation for drag start logic here if needed, 
    // but usually BlockPort stops it or we handle it in global listener.
    e.stopPropagation();
    onPortDragStart?.(socketId, e);
  }
</script>

<div
  class="block-node"
  class:selected={isSelected}
  class:dragging={isDragging}
  style="
    left: {block.position.x}px; 
    top: {block.position.y}px;
    --node-color: {block.definition.color};
  "
  onmousedown={handleMouseDown}
  role="button"
  tabindex="0"
>
  <div class="node-header">
    <div class="node-icon">🧩</div>
    <span class="node-label">{block.definition.label}</span>
    <button class="node-delete" onclick={handleDelete} aria-label="Remover">×</button>
  </div>

  <div class="node-body">
    <div class="node-row">
      <div class="node-inputs">
        {#each block.definition.inputs as socket}
          <div class="input-row">
            <!-- Simplified Wrapper: Attributes are now inside BlockPort -->
            <!-- We still need onmousedown here OR in BlockPort. BlockPort handles it now. -->
            <div class="port-container">
              <BlockPort
                {socket}
                blockId={block.uuid}
                isInput={true}
                connected={block.getConnection(socket.id) !== undefined}
                onDragStart={(e) => handlePortMouseDown(socket.id, e)}
              />
            </div>
            
            <div class="input-content">
              {#if !block.getConnection(socket.id)}
                 <BlockInput {block} {socket} />
              {:else}
                 <span class="socket-label">{socket.label}</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      {#if block.definition.output}
        <div class="node-output">
           <span class="socket-label">{block.definition.output.label || ''}</span>
           <div class="port-container">
            <BlockPort
              socket={block.definition.output}
              blockId={block.uuid}
              isInput={false}
              connected={false} 
              onDragStart={(e) => handlePortMouseDown('output', e)}
            />
            </div>
        </div>
      {/if}

    </div>
  </div>
</div>

<style>
  .block-node {
    position: absolute;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    min-width: 140px;
    border: 2px solid transparent;
    transition: box-shadow 0.2s, border-color 0.2s;
    user-select: none;
    z-index: 10;
    cursor: default;
  }
  .block-node:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  .block-node.selected { border-color: #2196F3; z-index: 20; }
  .block-node.dragging { opacity: 0.9; cursor: grabbing; z-index: 30; box-shadow: 0 8px 16px rgba(0,0,0,0.2); }

  .node-header {
    background: var(--node-color);
    padding: 8px 12px;
    border-radius: 6px 6px 0 0;
    display: flex;
    align-items: center;
    gap: 8px;
    color: white;
  }
  .node-icon { font-size: 16px; }
  .node-label { flex: 1; font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; }
  .node-delete {
    background: rgba(0,0,0,0.1); border: none; color: white; width: 20px; height: 20px;
    border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;
  }
  .node-delete:hover { background: rgba(0,0,0,0.3); }

  .node-body { padding: 12px; }
  .node-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .node-inputs { display: flex; flex-direction: column; gap: 12px; }
  .input-row { display: flex; align-items: center; gap: 8px; height: 24px; }
  .input-content { display: flex; align-items: center; }
  .socket-label { font-size: 12px; color: #666; font-weight: 500; }
  .node-output { display: flex; align-items: center; gap: 8px; height: 24px; margin-left: auto; }

  .port-container {
    display: flex; align-items: center; justify-content: center;
    min-width: 24px; min-height: 24px;
    /* Wrapper styling only for layout, interaction handled by BlockPort */
    position: relative;
    z-index: 5;
  }
</style>
