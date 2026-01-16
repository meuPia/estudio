<script lang="ts">
  import type { Block } from '$lib/services/block-engine';
  
  interface Props {
    from: Block;
    to: Block;
    socketId: string;
  }
  
  let { from, to, socketId }: Props = $props();
  
  // Calcula posição do socket no bloco FROM
  const socketIndex = $derived(
    from.definition.inputs.findIndex(s => s.id === socketId)
  );
  
  // Posições - AJUSTADAS para ficarem visíveis
  const x1 = $derived(from.position.x + 140); // Dentro do bloco from, lado direito
  const y1 = $derived(from.position.y + 50 + (socketIndex * 50)); // Alinha com socket
  
  const x2 = $derived(to.position.x + 10); // Lado esquerdo do bloco to
  const y2 = $derived(to.position.y + 20); // Topo do bloco to
  
  // Path para linha Bezier (curva suave)
  const path = $derived(() => {
    const midX = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  });
  
  const color = '#7ED321'; // Verde para conexões de dados
</script>

<svg 
  class="connection-line" 
  style="
    pointer-events: none; 
    position: absolute; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%; 
    z-index: 5;
    overflow: visible;
  "
>
  <defs>
    <marker
      id="arrowhead-{from.uuid}-{socketId}"
      markerWidth="8"
      markerHeight="8"
      refX="7"
      refY="3"
      orient="auto"
    >
      <polygon points="0 0, 8 3, 0 6" fill={color} />
    </marker>
    
    <filter id="glow-{from.uuid}-{socketId}">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <path
    d={path()}
    stroke={color}
    stroke-width="3"
    fill="none"
    stroke-linecap="round"
    marker-end="url(#arrowhead-{from.uuid}-{socketId})"
    filter="url(#glow-{from.uuid}-{socketId})"
    class="connection-path"
  />
</svg>

<style>
  .connection-line {
    pointer-events: none;
  }
  
  .connection-path {
    opacity: 0.8;
    transition: opacity 0.2s;
    animation: dash 20s linear infinite;
  }
  
  @keyframes dash {
    to {
      stroke-dashoffset: -100;
    }
  }
</style>
