<script lang="ts">
  import type { Block } from '$lib/services/block-engine';
  
  interface Props {
    fromBlock: Block;
    toBlock: Block;
    fromSocketId?: string;
    toSocketId?: string;
    color?: string;
    animated?: boolean;
  }
  
  let { 
    fromBlock, 
    toBlock, 
    fromSocketId, 
    toSocketId,
    color = '#4A90E2',
    animated = true
  }: Props = $props();
  
  // Use $derived to effectively track block definition changes (e.g. idx)
  // And use direct access to .position within derived so Svelte tracks it
  const fromSocketIdx = $derived(fromBlock.definition.inputs.findIndex(s => s.id === fromSocketId));
  const toSocketIdx = $derived(toBlock.definition.inputs.findIndex(s => s.id === toSocketId));

  const pathD = $derived.by(() => {
    // Access position properties directly here to ensure dependency tracking
    const fx = fromBlock.position.x;
    const fy = fromBlock.position.y;
    const tx = toBlock.position.x;
    const ty = toBlock.position.y;

    // Calculate actual anchor points
    let startX = fx + 150; // Output defaults to right side
    let startY = fy + 40; 
    
    // Adjust logic: if fromSocketId is an INPUT, we need to adjust, but usually connections flow Output -> Input.
    // However, if we are drawing Input -> Input, we'd need more logic.
    // Assuming standard Output -> Input flow for curve drawing usually:
    // Source (fromBlock) is usually on the left in conceptual flow, but physically can be anywhere.
    // If fromSocketId is provided and exists in inputs, use that Y. 
    // BUT usually 'fromBlock' is the Output source.
    if (fromSocketId && fromSocketIdx !== -1) {
       // It's an input port acting as source? 
       startY = fy + 55 + fromSocketIdx * 45;
       startX = fx; // Input is on left
    }

    let endX = tx; // Input defaults to left side
    let endY = ty + 40;
    if (toSocketId && toSocketIdx !== -1) {
       endY = ty + 55 + toSocketIdx * 45;
    }

    const distance = Math.abs(endX - startX);
    const curve = Math.min(distance * 0.5, 100);
    
    return `M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`;
  });

  // Unique IDs for SVG refs
  const idSuffix = $derived(`${fromBlock.uuid}-${toBlock.uuid}-${fromSocketId}-${toSocketId}`);

</script>

<svg 
  class="connection-curve" 
  style="
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 5;
    overflow: visible;
  "
>
  <defs>
    <linearGradient id="lineContent-{idSuffix}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color={color} stop-opacity="0.8"/>
      <stop offset="100%" stop-color={color} stop-opacity="1"/>
    </linearGradient>
    
    <filter id="glow-{idSuffix}">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <marker
      id="arrow-{idSuffix}"
      markerWidth="10"
      markerHeight="10"
      refX="8"
      refY="3"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <path d="M0,0 L0,6 L9,3 z" fill={color} />
    </marker>
    
    {#if animated}
      <pattern id="flow-{idSuffix}" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" fill={color} opacity="0.6">
          <animate attributeName="cx" from="2" to="22" dur="2s" repeatCount="indefinite" />
        </circle>
      </pattern>
    {/if}
  </defs>
  
  <path
    d={pathD}
    stroke="#000"
    stroke-width="5"
    fill="none"
    opacity="0.1"
    stroke-linecap="round"
  />
  
  <path
    d={pathD}
    stroke="url(#lineContent-{idSuffix})"
    stroke-width="4"
    fill="none"
    stroke-linecap="round"
    filter="url(#glow-{idSuffix})"
    marker-end="url(#arrow-{idSuffix})"
    class="main-path"
  />
  
  {#if animated}
    <path
      d={pathD}
      stroke="url(#flow-{idSuffix})"
      stroke-width="4"
      fill="none"
      stroke-linecap="round"
      opacity="0.4"
    />
  {/if}
</svg>

<style>
  .connection-curve { pointer-events: none; }
  .main-path { transition: stroke-width 0.2s; }
  .main-path:hover { stroke-width: 6; }
</style>
