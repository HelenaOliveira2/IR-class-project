import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // REQ-F91: Ambiente necessário para renderizar componentes React
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js', 
  },
});