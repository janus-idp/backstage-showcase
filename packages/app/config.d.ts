export interface Config {
  /** Configurations for the backstage(janus) instance */
  developerHub?: {
    /**
     * The url of json data for customization.
     * @visibility frontend
     */
    proxyPath?: string;
  };
  app: {
    branding?: {
      /**
       * Base64 URI for the full logo
       * @visibility frontend
       */
      fullLogo?: string;
      /**
       * Base64 URI for the icon logo
       * @visibility frontend
       */
      iconLogo?: string;
      theme?: {
        [key: string]: {
          /**
           * primaryColor Configuration for the instance
           * The following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
           * @visibility frontend
           */
          primaryColor?: string;
          /**
           * Header Theme color Configuration for the instance
           * The following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
           * @visibility frontend
           */
          headerColor1?: string;
          /**
           * Header Theme color Configuration for the instance
           * The following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
           * @visibility frontend
           */
          headerColor2?: string;
          /**
           * Navigation Side Bar Indicator color Configuration for the instance
           * The following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
           * @visibility frontend
           */
          navigationIndicatorColor?: string;
        };
      };
    };
  };
  /** @deepVisibility frontend */
  dynamicPlugins: {
    /** @deepVisibility frontend */
    frontend: {
      [key: string]: {
        dynamicRoutes: ({
          [key: string]: any;
        } & {
          path: string;
          module: string;
          importName: string;
          menuItem: {
            icon: string;
            text: string;
          };
        })[];
        routeBindings: {
          bindTarget: string;
          bindMap: {
            [key: string]: string;
          };
        }[];
        mountPoints: {
          mountPoint: string;
          module: string;
          importName?: string;
        }[];
      };
    };
  };
}
