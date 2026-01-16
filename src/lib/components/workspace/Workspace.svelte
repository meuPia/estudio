<script lang="ts">
  import BlockPalette from '../blocks/BlockPalette.svelte';
  import BlockCanvas from '../blocks/BlockCanvas.svelte';
  import CodeViewer from '../code-viewer/CodeViewer.svelte';
  import { blocksStore } from '$lib/stores/blocks.svelte';
  
  import logoImage from '$lib/assets/meuPia-estudio.png';

  function handleClearAll() {
    if (confirm('Deseja remover todos os blocos?')) {
      blocksStore.clearAll();
    }
  }
</script>

<div class="workspace">
  <header class="workspace-header">
    <h1>🇧🇷 meuPiá IDE</h1>
    <div class="header-actions">
      <span class="block-count">{blocksStore.blockCount} blocos</span>
      <button onclick={handleClearAll} class="btn-secondary">
        Limpar Tudo
      </button>
    </div>
  </header>
  
  <div class="workspace-content">
    <BlockPalette />
    <BlockCanvas />
  
    <CodeViewer />
  </div>
</div>

<style>
  .workspace {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }
  
  .workspace-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .workspace-header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
  }
  
  .header-actions {
    display: flex;
    gap: 16px;
    align-items: center;
  }
  
  .block-count {
    background: rgba(255, 255, 255, 0.2);
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
  }
  
  .btn-secondary {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }
  
  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .workspace-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
</style>

