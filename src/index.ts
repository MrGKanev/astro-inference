import type { AstroIntegration } from 'astro';
import type { AstroInferenceOptions } from './types.js';

export type { AstroInferenceOptions, PageEntry } from './types.js';

export default function astroInference(
  options: AstroInferenceOptions = {}
): AstroIntegration {
  const {
    llmsTxtPath = '/llms.txt',
    machineSuffix = 'machine.txt',
  } = options;

  return {
    name: 'astro-inference',
    hooks: {
      'astro:config:setup': ({ injectRoute, addMiddleware, updateConfig }) => {
        // Pass options to routes via Astro virtual module config
        updateConfig({
          vite: {
            plugins: [viteInferenceOptions(options)],
          },
        });

        // /llms.txt
        injectRoute({
          pattern: llmsTxtPath,
          entrypoint: 'astro-inference/routes/llms.txt.ts',
        });

        // Intercept */machine.txt via middleware — more reliable than injectRoute
        // with rest+literal patterns across Astro versions
        addMiddleware({
          entrypoint: 'astro-inference/middleware',
          order: 'pre',
        });
      },
    },
  };
}

/** Vite virtual module so routes can read options without importing Node APIs */
function viteInferenceOptions(options: AstroInferenceOptions) {
  const virtualModuleId = 'virtual:astro-inference/options';
  const resolvedId = '\0' + virtualModuleId;

  return {
    name: 'vite-plugin-astro-inference-options',
    resolveId(id: string) {
      if (id === virtualModuleId) return resolvedId;
    },
    load(id: string) {
      if (id === resolvedId) {
        return `export const options = ${JSON.stringify(options)};`;
      }
    },
  };
}
