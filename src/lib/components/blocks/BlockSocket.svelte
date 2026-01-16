<script lang="ts">
  import type { BlockSocket as SocketType } from '$lib/services/block-engine';
  
  interface Props {
    socket: SocketType;
    connected?: boolean;
    isInput?: boolean;
  }
  
  let { socket, connected = false, isInput = true }: Props = $props();
  
  const typeColors = {
    number: '#4A90E2',
    text: '#E27A3F',
    boolean: '#F5A623',
    void: '#9B9B9B',
    any: '#7ED321'
  };
  
  const color = typeColors[socket.type] || '#9B9B9B';
</script>

<div 
  class="socket"
  class:input={isInput}
  class:output={!isInput}
  class:connected
  style="--socket-color: {color}"
  title="{socket.label} ({socket.type})"
>
  <div class="socket-dot"></div>
  {#if socket.label}
    <span class="socket-label">{socket.label}</span>
  {/if}
</div>

<style>
  .socket {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    position: relative;
  }
  
  .socket-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid var(--socket-color);
    background: white;
    transition: all 0.2s;
    cursor: pointer;
  }
  
  .socket-dot:hover {
    transform: scale(1.2);
    box-shadow: 0 0 8px var(--socket-color);
  }
  
  .socket.connected .socket-dot {
    background: var(--socket-color);
  }
  
  .socket-label {
    font-size: 11px;
    color: #666;
    user-select: none;
  }
  
  .input {
    flex-direction: row;
  }
  
  .output {
    flex-direction: row-reverse;
  }
</style>

