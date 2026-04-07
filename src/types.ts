export interface AstroInferenceOptions {
  /** Site name - used as the # heading in llms.txt */
  siteName?: string;
  /** One-line description of the site */
  siteDescription?: string;
  /**
   * URL paths to exclude from indexing.
   * Supports exact strings and glob-style wildcards (e.g. "/admin/*").
   */
  exclude?: string[];
  /** Path where llms.txt is served. Default: "/llms.txt" */
  llmsTxtPath?: string;
  /** Suffix appended to each page route for the machine version.
   *  Default: "machine.txt"
   *  Example: /about/machine.txt
   */
  machineSuffix?: string;
}

/** A single page entry used when building llms.txt */
export interface PageEntry {
  url: string;
  title: string;
  description?: string;
  collection?: string;
}
