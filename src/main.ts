import { mount } from 'svelte';
import App from './App.svelte';
import './themes/index.css';
import './styles/variables.css';
import './styles/menu.css';
import './styles/panels.css';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Missing app mount element');
}

const app = mount(App, { target });

export default app;
