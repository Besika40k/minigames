const root: HTMLDivElement | null = document.querySelector<HTMLDivElement>('#app');
if (!root) {
  throw new Error('Root element #app not found');
}
