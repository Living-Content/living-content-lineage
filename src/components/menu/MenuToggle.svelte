<script lang="ts">
  /**
   * Menu toggle button with animated hamburger icon.
   * Uses CSS transforms for hamburger → arrow animation.
   */
  import { menuStore } from '../../stores/menuStore.svelte.js';

  function handleClick() {
    menuStore.handleToggle();
  }
</script>

<button
  class="menu-toggle"
  class:menu-open={menuStore.isOpen}
  class:sub-panel={menuStore.isSubPanel}
  onclick={handleClick}
  aria-label={menuStore.isOpen ? 'Close menu' : 'Open menu'}
>
  <span class="menu-toggle__line menu-toggle__line--top"></span>
  <span class="menu-toggle__line menu-toggle__line--bottom"></span>
  <span class="menu-toggle__line menu-toggle__line--arrow"></span>
</button>

<style>
  .menu-toggle {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 36px;
    height: 36px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .menu-toggle:focus {
    outline: none;
  }

  .menu-toggle__line {
    display: block;
    width: 18px;
    height: 2px;
    background: white;
    transition:
      transform 150ms ease,
      opacity 150ms ease;
  }

  /* Top line: rotates around right edge */
  .menu-toggle__line--top {
    transform-origin: right center;
  }

  /* Bottom line: overshoot animation */
  .menu-toggle__line--bottom {
    transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 150ms ease;
  }

  /* Arrow line: hidden until sub-panel */
  .menu-toggle__line--arrow {
    position: absolute;
    transform-origin: left center;
    transform: translate(6px, 8px) rotate(-45deg);
    opacity: 0;
    transition: transform 300ms ease;
  }

  /* Menu open: bottom line slides up and hides */
  .menu-toggle.menu-open .menu-toggle__line--bottom {
    transform: translateY(-10px);
    opacity: 0;
    transition: transform 150ms ease, opacity 150ms ease;
  }

  /* Sub-panel: top rotates to form \ */
  .menu-toggle.sub-panel .menu-toggle__line--top {
    transform: rotate(-45deg);
    transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Sub-panel: arrow swings to form / */
  .menu-toggle.sub-panel .menu-toggle__line--arrow {
    transform: translate(5px, 5px) rotate(45deg);
    opacity: 1;
    transition:
      transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1) 150ms,
      opacity 0s 150ms;
  }
</style>
