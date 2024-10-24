import React, { useEffect } from 'react';

import { configApiRef, useApi } from '@backstage/core-plugin-api';

const ConfigUpdater: React.FC = () => {
  const configApi = useApi(configApiRef);

  useEffect(() => {
    const updateConfig = () => {
      const logoIconBase64URI = configApi.getOptionalString(
        'app.branding.iconLogo',
      );

      if (logoIconBase64URI) {
        const favicon = document.getElementById(
          'dynamic-favicon',
        ) as HTMLLinkElement;
        if (favicon) {
          favicon.href = logoIconBase64URI;
        } else {
          const newFavicon = document.createElement('link');
          newFavicon.id = 'dynamic-favicon';
          newFavicon.rel = 'icon';
          newFavicon.href = logoIconBase64URI;
          document.head.appendChild(newFavicon);
        }
      }
    };

    updateConfig();
  }, [configApi]);

  return null;
};

export default ConfigUpdater;
