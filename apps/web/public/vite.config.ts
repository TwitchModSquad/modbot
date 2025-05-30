import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from "path";

export default defineConfig({
	plugins: [sveltekit()],

	server: {
		port: 3010,
	},
	resolve: {
		alias: {
			'@modbot/ui': path.resolve(__dirname, '../../../packages/ui')
		}
	},
});
