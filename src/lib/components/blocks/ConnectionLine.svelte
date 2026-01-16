<script lang="ts">
  import type { Block } from '$lib/services/block-engine';
  
  interface Props {
    from: Block;
    to: Block;
    type?: 'flow' | 'data';
  }
  
  let { from, to, type = 'flow' }: Props = $props();
  
  // Calcula pontos da linha
  const fromPos = $derived(from.position);
  const toPos = $derived(to.position);
  
  // Posições inicial e final
  const x1 = $derived(fromPos.x + 75); // Centro do bloco (150px / 2)
  const y1 = $derived(fromPos.y + 80); // Bottom do bloco
  const x2 = $derived(toPos.x + 75);
  const y2 = $derived(toPos.y); // Top do bloco
  
  // Path para linha curva (Bezier)
  const path = $derived(() => {
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  });
  
  const color = type === 'flow' ? '#4A90E2' : '#7ED321';
</script>

<svg class="connection-line" style="pointer-events: none;">
  <path
    d={path()}
    stroke={color}
    stroke-width="3"
    fill="none"
    stroke-linecap="round"
    class="connection-path"
  />
  
  <!-- Seta no final -->
  <polygon
    points="{x2-5},{y2-5} {x2+5},{y2-5} {x2},{y2}"
    fill={color}
    class="connection-arrow"
  />
</svg>

<style>
  .connection-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }
  
  .connection-path {
    opacity: 0.8;
    transition: stroke-width 0.2s;
  }
  
  .connection-path:hover {
    stroke-width: 4;
    opacity: 1;
  }
  
  .connection-arrow {
    opacity: 0.8;
  }
</style>

