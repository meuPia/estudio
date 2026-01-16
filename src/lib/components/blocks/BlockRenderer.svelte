<script lang="ts">
import type { Block } from '$lib/services/block-engine';
import BlockSocket from './BlockSocket.svelte';
import { blocksStore } from '$lib/stores/blocks.svelte';
import BlockInput from './BlockInput.svelte';

interface Props {
block: Block;
}

let { block }: Props = $props();

let isDragging = $state(false);
let dragOffset = $state({ x: 0, y: 0 });
let snapPreview = $state<{ type: 'above' | 'below'; target: Block } | null>(null);

const isSelected = $derived(blocksStore.selectedBlock?.uuid === block.uuid);

// Constantes de snapping
const SNAP_DISTANCE = 40;
const BLOCK_HEIGHT = 80;

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
	const canvasRect = canvas.getBoundingClientRect();

	let x = e.clientX - canvasRect.left - dragOffset.x;
	let y = e.clientY - canvasRect.top - dragOffset.y;

	// 🧲 SISTEMA DE SNAPPING SIMPLIFICADO
	snapPreview = null;

	const otherBlocks = blocksStore.blocks.filter(b => b.uuid !== block.uuid);

	for (const targetBlock of otherBlocks) {
		// Verifica distância horizontal (precisa estar alinhado)
		const deltaX = Math.abs(x - targetBlock.position.x);
		if (deltaX > 50) continue; // Não está alinhado horizontalmente

		// Verifica snapping ABAIXO do target
		if (targetBlock.definition.hasNext && block.definition.hasPrevious) {
			const targetBottomY = targetBlock.position.y + BLOCK_HEIGHT;
			const distanceBelow = Math.abs(y - targetBottomY);

			if (distanceBelow < SNAP_DISTANCE) {
				// SNAP! Ajusta posição
				x = targetBlock.position.x;
				y = targetBottomY;
				snapPreview = { type: 'below', target: targetBlock };
				break;
			}
		}

		// Verifica snapping ACIMA do target
		if (block.definition.hasNext && targetBlock.definition.hasPrevious) {
			const targetTopY = targetBlock.position.y;
			const myBottomY = y + BLOCK_HEIGHT;
			const distanceAbove = Math.abs(myBottomY - targetTopY);

			if (distanceAbove < SNAP_DISTANCE) {
				// SNAP! Ajusta posição
				x = targetBlock.position.x;
				y = targetTopY - BLOCK_HEIGHT;
				snapPreview = { type: 'above', target: targetBlock };
				break;
			}
		}
	}

	blocksStore.updateBlockPosition(block.uuid, x, y);
}

function handleMouseUp() {
	// 🔗 CONECTA OS BLOCOS SE HOUVE SNAP
	if (snapPreview) {
		const { type, target } = snapPreview;

		if (type === 'below') {
			// Este bloco vai ABAIXO do target
			target.nextBlock = block;
			console.log(`✅ Conectado: ${target.definition.label} → ${block.definition.label}`);
		} else if (type === 'above') {
			// Este bloco vai ACIMA do target
			block.nextBlock = target;
			console.log(`✅ Conectado: ${block.definition.label} → ${target.definition.label}`);
		}

		blocksStore.refresh();
	}

	isDragging = false;
	snapPreview = null;
	document.removeEventListener('mousemove', handleMouseMove);
	document.removeEventListener('mouseup', handleMouseUp);
}

function handleDelete(e: MouseEvent) {
	e.stopPropagation();

	// Desconecta antes de deletar
	if (block.previousBlock) {
		block.previousBlock.nextBlock = block.nextBlock;
	}

	blocksStore.removeBlock(block.uuid);
}

// Verifica se este bloco está conectado a outro
const isConnectedBelow = $derived(block.nextBlock !== null);
const isConnectedAbove = $derived(block.previousBlock !== null);
</script>

<div 
class="block"
class:selected={isSelected}
class:dragging={isDragging}
class:snapping={snapPreview !== null}
style="
left: {block.position.x}px; 
top: {block.position.y}px;
--block-color: {block.definition.color};
"
onmousedown={handleMouseDown}
role="button"
tabindex="0"
>
<!-- 🔵 Indicador de conexão ACIMA -->
{#if block.definition.hasPrevious}
<div 
class="connector-dot top"
class:connected={isConnectedAbove}
class:snap-target={snapPreview?.type === 'above' && snapPreview.target.uuid === block.uuid}
></div>
{/if}

<!-- 🔵 Indicador de conexão ABAIXO -->
{#if block.definition.hasNext}
<div 
class="connector-dot bottom"
class:connected={isConnectedBelow}
class:snap-target={snapPreview?.type === 'below'}
></div>
{/if}

<div class="block-header">
<span class="block-label">{block.definition.label}</span>
<button class="block-delete" onclick={handleDelete} title="Remover bloco">×</button>
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
<!-- Mostra input apenas se NÃO houver conexão -->
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

<!-- 🧲 Indicador visual de snap -->
{#if snapPreview}
<div class="snap-indicator">
🧲 {snapPreview.type === 'below' ? 'Encaixar abaixo' : 'Encaixar acima'}
</div>
{/if}

{#if isSelected}
<div class="block-tooltip">
{block.definition.helpText}
</div>
{/if}
</div>

<!-- 📏 Linha de conexão visual -->
{#if isConnectedBelow}
<svg class="connection-line" style="
position: absolute;
left: {block.position.x + 75}px;
top: {block.position.y + 80}px;
width: 4px;
height: {block.nextBlock ? (block.nextBlock.position.y - block.position.y - 80) : 0}px;
pointer-events: none;
z-index: 0;
">
<line
x1="2"
y1="0"
x2="2"
y2="100%"
stroke="{block.definition.color}"
stroke-width="4"
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
transition: box-shadow 0.2s;
	    user-select: none;
	    z-index: 10;
}

.block:hover {
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	z-index: 20;
}

.block.selected {
	border-color: #2196F3;
	border-width: 3px;
	box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2);
	z-index: 30;
}

.block.dragging {
opacity: 0.9;
cursor: grabbing;
	z-index: 40;
}

.block.snapping {
	box-shadow: 0 0 20px rgba(74, 144, 226, 0.8) !important;
animation: snapPulse 0.3s ease-in-out;
}

@keyframes snapPulse {
	0%, 100% { transform: scale(1); }
	50% { transform: scale(1.03); }
}

/* 🔵 Pontos de conexão (next/previous) */
.connector-dot {
position: absolute;
width: 16px;
height: 16px;
background: white;
border: 3px solid #ccc;
	border-radius: 50%;
left: 50%;
transform: translateX(-50%);
	   z-index: 5;
transition: all 0.2s;
}

.connector-dot.top {
top: -8px;
}

.connector-dot.bottom {
bottom: -8px;
}

.connector-dot.connected {
background: var(--block-color);
	    border-color: var(--block-color);
	    box-shadow: 0 0 8px var(--block-color);
}

.connector-dot.snap-target {
background: #4A90E2;
	    border-color: #4A90E2;
	    box-shadow: 0 0 12px #4A90E2;
animation: snapDotPulse 0.5s ease-in-out infinite;
}

@keyframes snapDotPulse {
	0%, 100% { transform: translateX(-50%) scale(1); }
	50% { transform: translateX(-50%) scale(1.3); }
}

/* 🧲 Indicador de snap */
.snap-indicator {
position: absolute;
top: -35px;
left: 50%;
transform: translateX(-50%);
background: #4A90E2;
color: white;
padding: 6px 12px;
	 border-radius: 16px;
	 font-size: 12px;
	 font-weight: 600;
	 white-space: nowrap;
	 box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
animation: fadeInDown 0.2s;
	   z-index: 100;
}

@keyframes fadeInDown {
	from { 
opacity: 0; 
transform: translateX(-50%) translateY(-5px); 
	}
	to { 
opacity: 1; 
transform: translateX(-50%) translateY(0); 
	}
}

.block-header {
background: var(--block-color);
color: white;
padding: 8px 12px;
	 border-radius: 6px 6px 0 0;
	 font-weight: 600;
	 font-size: 14px;
display: flex;
	 justify-content: space-between;
	 align-items: center;
}

.block-label {
flex: 1;
}

.block-delete {
background: rgba(255, 255, 255, 0.2);
border: none;
color: white;
width: 20px;
height: 20px;
	border-radius: 50%;
cursor: pointer;
	font-size: 18px;
	line-height: 1;
transition: background 0.2s;
}

.block-delete:hover {
background: rgba(255, 255, 255, 0.3);
}

.block-inputs,
	.block-output {
padding: 8px;
	}

.block-tooltip {
position: absolute;
top: 100%;
left: 0;
right: 0;
       margin-top: 8px;
background: #333;
color: white;
padding: 8px 12px;
	 border-radius: 4px;
	 font-size: 12px;
	 line-height: 1.4;
	 z-index: 100;
	 box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.block-tooltip::before {
content: '';
position: absolute;
bottom: 100%;
left: 20px;
border: 6px solid transparent;
	border-bottom-color: #333;
}

/* Linha de conexão */
.connection-line {
	pointer-events: none;
}

.socket-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
}
</style>
