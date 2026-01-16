<script lang="ts">
  import type { BlockSocket } from '$lib/services/block-engine';
  
  interface Props {
    socket: BlockSocket;
    value?: any;
    onValueChange: (value: any) => void;
  }
  
  let { socket, value = '', onValueChange }: Props = $props();
  
  let inputValue = $state(value ?? '');
  
  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    let newValue: any = target.value;
    
    // Converte para o tipo correto
    if (socket.type === 'number') {
      newValue = parseFloat(target.value) || 0;
    } else if (socket.type === 'boolean') {
      newValue = target.value === 'verdadeiro';
    }
    
    inputValue = newValue;
    onValueChange(newValue);
  }
  
  function handleClick(e: MouseEvent) {
    e.stopPropagation(); // Evita arrastar o bloco ao clicar no input
  }
  
  const placeholder = socket.type === 'number' ? '0' : 
                     socket.type === 'boolean' ? 'verdadeiro/falso' : 
                     socket.label || 'digite...';
</script>

<div class="block-input" onclick={handleClick} role="none">
  {#if socket.type === 'boolean'}
    <select 
      value={inputValue} 
      oninput={handleInput}
      class="input-select"
    >
      <option value="verdadeiro">verdadeiro</option>
      <option value="falso">falso</option>
    </select>
  {:else}
    <input
      type={socket.type === 'number' ? 'number' : 'text'}
      value={inputValue}
      oninput={handleInput}
      placeholder={placeholder}
      class="input-field"
      class:number={socket.type === 'number'}
    />
  {/if}
</div>

<style>
  .block-input {
    margin: 2px 0;
  }
  
  .input-field,
  .input-select {
    width: 100%;
    padding: 6px 8px;
    border: 2px solid #e0e0e0;
    border-radius: 4px;
    font-size: 13px;
    font-family: 'Monaco', 'Menlo', monospace;
    background: #f9f9f9;
    transition: all 0.2s;
  }
  
  .input-field:focus,
  .input-select:focus {
    outline: none;
    border-color: #4A90E2;
    background: white;
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  }
  
  .input-field::placeholder {
    color: #aaa;
    font-style: italic;
  }
  
  .input-field.number {
    text-align: right;
  }
  
  .input-select {
    cursor: pointer;
  }
</style>

