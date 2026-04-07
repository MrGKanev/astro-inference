import type { PageEntry } from '../types.js';

/**
 * Builds a flat list of PageEntry objects from Astro content collections.
 *
 * Called at request-time inside endpoints so it always reflects current content.
 * Uses dynamic import so it works with Astro's build pipeline without
 * requiring a direct dependency on 'astro:content'.
 */
export async function getPageEntries(
  baseUrl: string,
  exclude: string[] = []
): Promise<PageEntry[]> {
  const entries: PageEntry[] = [];

  try {
    // Dynamically resolve Astro content collections at runtime.
    // This import is only valid inside an Astro project - the integration
    // is a peer, so we can safely rely on the host project's module graph.
    // @ts-ignore - astro:content is a virtual module resolved inside the host Astro project
    const { getCollection } = await import('astro:content');

    // Astro exposes all collection names via import.meta.glob on the host,
    // but we can't enumerate them statically here. Instead we attempt a
    // well-known set of collection names and gracefully skip missing ones.
    const commonCollections = [
      'blog', 'posts', 'articles', 'pages', 'docs',
      'work', 'projects', 'portfolio', 'news', 'events',
    ];

    for (const collectionName of commonCollections) {
      try {
        const items = await getCollection(collectionName as never);
        for (const item of items) {
          const slug = item.slug ?? item.id;
          const url = `/${collectionName}/${slug}`;

          if (isExcluded(url, exclude)) continue;

          entries.push({
            url,
            title: item.data?.title ?? slug,
            description: item.data?.description ?? item.data?.summary ?? undefined,
            collection: collectionName,
          });
        }
      } catch {
        // Collection doesn't exist in this project - skip silently
      }
    }
  } catch {
    // astro:content not available (e.g. project has no content collections)
  }

  // Always add root page if not excluded
  if (!isExcluded('/', exclude)) {
    entries.unshift({ url: '/', title: 'Home', collection: 'pages' });
  }

  return entries;
}

function isExcluded(url: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('/*')) {
      return url.startsWith(pattern.slice(0, -2));
    }
    return url === pattern;
  });
}
