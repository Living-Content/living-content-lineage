/**
 * Menu Store
 * Manages menu visibility and panel navigation state.
 */

const PANEL_TITLES: Record<string, string> = {
  main: 'Menu',
  settings: 'Settings',
  login: 'Log In',
};

let isOpen = $state(false);
let currentPanel = $state('main');
let panelHistory = $state<string[]>([]);

export const menuStore = {
  get isOpen() {
    return isOpen;
  },

  get currentPanel() {
    return currentPanel;
  },

  get isSubPanel() {
    return isOpen && currentPanel !== 'main';
  },

  get panelTitle() {
    return PANEL_TITLES[currentPanel] || currentPanel;
  },

  open() {
    isOpen = true;
    currentPanel = 'main';
    panelHistory = [];
  },

  close() {
    isOpen = false;
    currentPanel = 'main';
    panelHistory = [];
  },

  toggle() {
    if (isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  navigateTo(panel: string) {
    panelHistory = [...panelHistory, currentPanel];
    currentPanel = panel;
  },

  goBack() {
    const previous = panelHistory.pop() || 'main';
    panelHistory = [...panelHistory];
    currentPanel = previous;
  },

  /**
   * Handle toggle button click - context-aware behavior.
   */
  handleToggle() {
    if (this.isSubPanel) {
      this.goBack();
    } else if (isOpen) {
      this.close();
    } else {
      this.open();
    }
  },
};
