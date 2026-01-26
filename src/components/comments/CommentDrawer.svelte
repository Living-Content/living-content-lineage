<script lang="ts">
  /**
   * Slide-out comment drawer.
   * Opened via COMMENTS link in NodeContent.
   */
  import { fly } from 'svelte/transition';
  import CommentSection from './CommentSection.svelte';

  let { nodeId, isOpen = $bindable(false) }: { nodeId: string; isOpen?: boolean } = $props();

  function close() {
    isOpen = false;
  }
</script>

{#if isOpen}
  <div
    class="drawer"
    transition:fly={{ x: -40, duration: 200 }}
  >
    <CommentSection {nodeId} />
  </div>
{/if}

<style>
  .drawer {
    position: absolute;
    left: calc(100% - 4px);
    top: 0;
    bottom: 0;
    width: 320px;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(8px);
    border-radius: var(--radius-sm);
    box-shadow: 8px 0 32px rgba(0, 0, 0, 0.12);
    overflow: hidden;
  }

  @media (max-width: 900px) {
    .drawer {
      left: 0;
      right: 0;
      top: auto;
      bottom: 100%;
      width: 100%;
      max-height: 50vh;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
    }
  }
</style>
