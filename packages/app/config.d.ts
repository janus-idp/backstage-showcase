export interface Config {
  /** Configurations for the backstage(janus) instance */
  developerHub?: {
    /**
     * The url of json data for customization.
     * @visibility frontend
     */
    proxyPath?: string;
  };
}
