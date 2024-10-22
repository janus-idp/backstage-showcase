export interface Config {
  auth?: {
    providers?: {
      /** @visibility frontend */
      rhaap?: {
        [authEnv: string]: {
          clientId: string;
          /**
           * @visibility secret
           */
          clientSecret: string;
          host: string;
          callbackUrl?: string;
        };
      };
    };
  };
}
