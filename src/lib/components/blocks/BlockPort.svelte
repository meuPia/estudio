<script lang="ts">
  import type { BlockSocket } from '$lib/services/block-engine';
  
  interface Props {
    socket: BlockSocket;
    blockId: string;
    isInput: boolean;
    connected: boolean;
    highlighted?: boolean;
    onDragStart?: (e: MouseEvent) => void;
    onDragEnd?: (e: MouseEvent) => void;
  }
  
  let { 
    socket, 
    blockId, 
    isInput, 
    connected, 
    onDragStart, 
    onDragEnd,
    highlighted = false 
  }: Props = $props();
  
  let showTooltip = $state(false);
  
  const colorMap: Record<string, string> = {
    number: '#7ED321', // Green
    text: '#4A90E2',   // Blue
    boolean: '#F5A623', // Orange
    any: '#9013FE'     // Purple
  };
  
  const portColor = $derived(colorMap[socket.type] || '#999');
  
  function handleMouseDown(e: MouseEvent) {
    if (onDragStart) {
      onDragStart(e);
    }
  }

  function handleMouseUp(e: MouseEvent) {
    if (onDragEnd) {
      onDragEnd(e);
    }
  }
</script>

<!-- Added data attributes as requested for robust ElementFromPoint detection -->
<div 
  class="block-port"
  class:input={isInput}
  class:output={!isInput}
  class:connected={connected}
  class:highlighted={highlighted}
  style="--port-color: {portColor}"
  
  data-block-id={blockId}       
  data-socket-id={socket.id}      
  data-type={socket.type}
  data-is-input={isInput ? 'true' : 'false'}
  
  onmousedown={handleMouseDown}
  onmouseup={handleMouseUp}
  onmouseenter={() => showTooltip = true}
  onmouseleave={() => showTooltip = false}
  role="button"
  tabindex="0"
  aria-label={isInput ? `Input: ${socket.label}` : `Output: ${socket.label}`}
>
  <div class="port-circle"></div>
  
  {#if showTooltip && !connected}
    <div class="port-tooltip">
      {isInput ? 'Arraste para conectar' : 'Arraste para conectar'}
    </div>
  {/if}
</div>

<style>
  .block-port {
    position: relative;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    transition: all 0.2s;
    /* CRITICAL: pointer-events auto needed for elementFromPoint */
    pointer-events: auto;
  }
  
  .block-port:active {
    cursor: grabbing;
  }
  
  .port-circle {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    border: 3px solid var(--port-color);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    /* CRITICAL: pointer-events none to let click pass to parent div with data attributes if circle covers it */
    pointer-events: none; 
  }
  
  /* Hover Effect */
  .block-port:hover .port-circle {
    transform: scale(1.2);
    box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.05);
  }
  
  /* Connected State */
  .block-port.connected .port-circle {
    background: var(--port-color);
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.5);
  }
  
  /* Highlighted State */
  .block-port.highlighted .port-circle {
    background: white;
    box-shadow: 0 0 0 4px var(--port-color);
    animation: pulse 1s infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0px var(--port-color); }
    50% { transform: scale(1.1); box-shadow: 0 0 0 4px rgba(var(--port-color), 0.5); }
    100% { transform: scale(1); box-shadow: 0 0 0 0px var(--port-color); }
  }

  /* Tooltip */
  .port-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-8px);
    background: #333;
    color: white;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    animation: tooltip-in 0.2s forwards;
    z-index: 100;
  }
  
  .port-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -4px;
    border-width: 4px;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
  }
  
  @keyframes tooltip-in {
    from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
    to { opacity: 1; transform: translateX(-50%) translateY(-8px); }
  }
</style>
