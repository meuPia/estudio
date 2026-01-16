<script lang="ts">
  import { blocksStore } from '$lib/stores/blocks.svelte';
  // Import DIRETO dos arquivos (sem usar index.ts)
  import { ASTBuilder } from '$lib/services/codegen/ASTBuilder';
  import { PortugolGenerator } from '$lib/services/codegen/PortugolGenerator';
  
  const generator = new PortugolGenerator();
  
  // Código gerado automaticamente (reativo)
  const generatedCode = $derived.by(() => {
    try {
      if (blocksStore.blocks.length === 0) {
        return `programa {
  funcao inicio() {
    // Arraste blocos para o canvas para começar
  }
}`;
      }
      
      const builder = new ASTBuilder(blocksStore.blocks);
      const ast = builder.build();
      return generator.generate(ast);
    } catch (error) {
      console.error('Erro ao gerar código:', error);
      return `// Erro ao gerar código:\n// ${error}`;
    }
  });
  
  // Conta linhas de código
  const lineCount = $derived(generatedCode.split('\n').length);
  
  function copyToClipboard() {
    navigator.clipboard.writeText(generatedCode);
    const button = document.querySelector('.btn-copy') as HTMLButtonElement;
    if (button) {
      button.textContent = '✅ Copiado!';
      setTimeout(() => {
        button.textContent = '📋';
      }, 2000);
    }
  }
  
  function downloadCode() {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'programa.portugol';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<aside class="code-viewer">
  <header class="viewer-header">
    <div class="header-left">
      <h3>📝 Código Portugol</h3>
      <span class="line-count">{lineCount} linhas</span>
    </div>
    <div class="header-actions">
      <button class="btn-icon btn-copy" onclick={copyToClipboard} title="Copiar código">
        📋
      </button>
      <button class="btn-icon" onclick={downloadCode} title="Baixar arquivo">
        💾
      </button>
    </div>
  </header>
  
  <div class="code-container">
    <pre class="code-display"><code>{generatedCode}</code></pre>
  </div>
</aside>

<style>
  .code-viewer {
    width: 400px;
    background: #1e1e1e;
    border-left: 1px solid #333;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .viewer-header {
    background: #252526;
    color: white;
    padding: 12px 16px;
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .viewer-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }
  
  .line-count {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    color: #aaa;
  }
  
  .header-actions {
    display: flex;
    gap: 8px;
  }
  
  .btn-icon {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .btn-icon:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
  
  .code-container {
    flex: 1;
    overflow: auto;
    padding: 16px;
  }
  
  .code-display {
    margin: 0;
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #d4d4d4;
  }
  
  .code-display code {
    display: block;
    white-space: pre;
  }
</style>

