<script lang="ts">
  import type { Block } from '$lib/services/block-engine';
  import BlockSocket from './BlockSocket.svelte';
  import BlockInput from './BlockInput.svelte';
  import ConnectionLine from './ConnectionLine.svelte';
  import { blocksStore } from '$lib/stores/blocks.svelte';
  import { snapManager } from '$lib/services/snapping';
  
  interface Props {
    block: Block;
  }
  
  let { block }: Props = $props();
  
  let isDragging = $state(false);
  let dragOffset = $state({ x: 0, y: 0 });
  let snapTarget = $state<Block | null>(null);
  let socketSnapInfo = $state<{ block: Block; socketId: string } | null>(null);
  
  const isSelected = $derived(blocksStore.selectedBlock?.uuid === block.uuid);
  
  function handleMouseDown(e: MouseEvent) {
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
    let x = e.clientX - canvasRect.left - dragOffset.x;
    let y = e.clientY - canvasRect.top - dragOffset.y;
    
    // Reset snap states
    snapTarget = null;
    socketSnapInfo = null;
    
    const otherBlocks = blocksStore.blocks.filter(b => b.uuid !== block.uuid);
    
    // 1️⃣ PRIORIDADE: SOCKET SNAP (para blocos com output)
    if (block.definition.output) {
      const socketSnap = snapManager.findSocketSnap(block, { x, y }, otherBlocks);
      
      if (socketSnap.snapped && socketSnap.position && socketSnap.target) {
        x = socketSnap.position.x;
        y = socketSnap.position.y;
        socketSnapInfo = {
          block: socketSnap.target.block,
          socketId: socketSnap.target.socketId!
        };
        blocksStore.updateBlockPosition(block.uuid, x, y);
        return;
      }
    }
    
    // 2️⃣ FALLBACK: VERTICAL SNAP (para statements)
    if (block.definition.type === 'statement') {
      for (const targetBlock of otherBlocks) {
        if (targetBlock.definition.type !== 'statement') continue;
        
        // Verifica alinhamento horizontal
        if (Math.abs(x - targetBlock.position.x) > 60) continue;
        
        // Snap ABAIXO
        const targetBottom = targetBlock.position.y + 80;
        if (Math.abs(y - targetBottom) < 50 && !targetBlock.nextBlock) {
          x = targetBlock.position.x;
          y = targetBottom;
          snapTarget = targetBlock;
          break;
        }
        
        // Snap ACIMA
        const myBottom = y + 80;
        if (Math.abs(myBottom - targetBlock.position.y) < 50 && !targetBlock.previousBlock) {
          x = targetBlock.position.x;
          y = targetBlock.position.y - 80;
          snapTarget = targetBlock;
          break;
        }
      }
    }
    
    blocksStore.updateBlockPosition(block.uuid, x, y);
  }
  
  function handleMouseUp() {
    // SOCKET CONNECTION
    if (socketSnapInfo) {
      const result = socketSnapInfo.block.connect(socketSnapInfo.socketId, block);
      if (result.valid) {
        console.log(`✅ Socket conectado: ${block.definition.label} → ${socketSnapInfo.block.definition.label}.${socketSnapInfo.socketId}`);
      } else {
        console.error('❌ Erro ao conectar socket:', result.error);
      }
      blocksStore.refresh();
    }
    // VERTICAL CONNECTION
    else if (snapTarget) {
      if (block.position.y < snapTarget.position.y) {
        block.nextBlock = snapTarget;
        snapTarget.previousBlock = block;
        console.log('✅ Conectado vertical ACIMA:', block.definition.label, '→', snapTarget.definition.label);
      } else {
        snapTarget.nextBlock = block;
        block.previousBlock = snapTarget;
        console.log('✅ Conectado vertical ABAIXO:', snapTarget.definition.label, '→', block.definition.label);
      }
      blocksStore.refresh();
    }
    
    isDragging = false;
    snapTarget = null;
    socketSnapInfo = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
  
  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    
    if (block.previousBlock) {
      block.previousBlock.nextBlock = block.nextBlock;
    }
    if (block.nextBlock) {
      block.nextBlock.previousBlock = block.previousBlock;
    }
    
    blocksStore.removeBlock(block.uuid);
  }
  
  const isConnectedBelow = $derived(!!block.nextBlock);
  const isConnectedAbove = $derived(!!block.previousBlock);
</script>

<!-- 📏 Linhas de conexão de SOCKETS (expressões) -->
{#each block.definition.inputs as socket}
  {#if block.getConnection(socket.id)}
    {@const conn = block.getConnection(socket.id)}
    {@const targetBlock = blocksStore.blocks.find(b => b.uuid === conn?.targetBlockId)}
    {#if targetBlock}
      <ConnectionLine from={block} to={targetBlock} socketId={socket.id} />
    {/if}
  {/if}
{/each}

<div 
  class="block"
  class:selected={isSelected}
  class:dragging={isDragging}
  class:snapping={snapTarget !== null || socketSnapInfo !== null}
  style="
    left: {block.position.x}px; 
    top: {block.position.y}px;
    --block-color: {block.definition.color};
  "
  onmousedown={handleMouseDown}
  role="button"
  tabindex="0"
>
  {#if block.definition.hasPrevious}
    <div class="connector-dot top" class:connected={isConnectedAbove}></div>
  {/if}
  
  {#if block.definition.hasNext}
    <div class="connector-dot bottom" class:connected={isConnectedBelow}></div>
  {/if}
  
  <div class="block-header">
    <span class="block-label">{block.definition.label}</span>
    <button class="block-delete" onclick={handleDelete}>×</button>
  </div>
  
  {#if block.definition.inputs.length > 0}
    <div class="block-inputs">
      {#each block.definition.inputs as socket}
        <div class="socket-row">
          <BlockSocket 
            {socket} 
            isInput={true} 
            connected={block.getConnection(socket.id) !== undefined} 
          />
          
          {#if !block.getConnection(socket.id)}
            <BlockInput 
              {socket}
              value={block.getValue(socket.id)}
              onValueChange={(val) => {
                block.setValue(socket.id, val);
                blocksStore.refresh();
              }}
            />
          {/if}
        </div>
      {/each}
    </div>
  {/if}
  
  {#if block.definition.output}
    <div class="block-output">
      <BlockSocket socket={block.definition.output} isInput={false} />
    </div>
  {/if}
  
  {#if socketSnapInfo}
    <div class="snap-indicator socket">
      🔌 Conectar ao {socketSnapInfo.block.definition.label}
    </div>
  {:else if snapTarget}
    <div class="snap-indicator">
      🧲 Conectar aqui
    </div>
  {/if}
  
  {#if isSelected}
    <div class="block-tooltip">{block.definition.helpText}</div>
  {/if}
</div>

<!-- Linha de conexão VERTICAL -->
{#if isConnectedBelow && block.nextBlock}
  <svg style="
    position: absolute;
    left: {block.position.x + 75}px;
    top: {block.position.y + 78}px;
    width: 6px;
    height: {block.nextBlock.position.y - block.position.y - 78}px;
    pointer-events: none;
    z-index: 1;
  ">
    <line 
      x1="3" y1="0" 
      x2="3" y2="100%" 
      stroke="{block.definition.color}" 
      stroke-width="5" 
      stroke-linecap="round"
    />
  </svg>
{/if}

<style>
  .block {
    position: absolute;
    background: white;
    border: 2px solid var(--block-color);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    min-width: 150px;
    cursor: move;
    user-select: none;
    z-index: 10;
  }
  
  .block:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); z-index: 20; }
  .block.selected { border-color: #2196F3; border-width: 3px; z-index: 30; }
  .block.dragging { opacity: 0.9; cursor: grabbing; z-index: 40; }
  .block.snapping { 
    box-shadow: 0 0 0 4px rgba(126, 211, 33, 0.5) !important;
    animation: glow 0.5s ease-in-out infinite alternate;
  }
  
  @keyframes glow {
    from { box-shadow: 0 0 0 4px rgba(126, 211, 33, 0.5); }
    to { box-shadow: 0 0 0 8px rgba(126, 211, 33, 0.8); }
  }
  
  .socket-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 4px; }
  
  .connector-dot {
    position: absolute;
    width: 18px;
    height: 18px;
    background: white;
    border: 3px solid #ccc;
    border-radius: 50%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
  }
  
  .connector-dot.top { top: -9px; }
  .connector-dot.bottom { bottom: -9px; }
  .connector-dot.connected { 
    background: var(--block-color); 
    border-color: var(--block-color);
    box-shadow: 0 0 10px var(--block-color);
  }
  
  .snap-indicator {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    background: #7ED321;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: bold;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(126, 211, 33, 0.4);
    animation: bounce 0.5s ease-in-out infinite;
    z-index: 100;
  }
  
  .snap-indicator.socket {
    background: #FF9500;
    box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50% { transform: translateX(-50%) translateY(-5px); }
  }
  
  .block-header {
    background: var(--block-color);
    color: white;
    padding: 10px 12px;
    border-radius: 6px 6px 0 0;
    font-weight: 600;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .block-label { flex: 1; }
  
  .block-delete {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
  }
  
  .block-delete:hover { background: rgba(255, 255, 255, 0.3); }
  
  .block-inputs, .block-output { padding: 10px; }
  
  .block-tooltip {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 10px;
    background: #333;
    color: white;
    padding: 10px 12px;
    border-radius: 6px;
    font-size: 12px;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
</style>
