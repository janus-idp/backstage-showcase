import React from 'react';
import { EntityLayout } from '@backstage/plugin-catalog';
import { dynamicEntityTab, DynamicEntityTabProps } from './DynamicEntityTab';
import { defaultTabs, tabRules, tabChildren } from './defaultTabs';

/**
 * Displays the tabs and content for a catalog entity
 * *Note:* do not convert convert this to a component or wrap the return value
 * @param entityTabOverrides
 * @returns
 */
export const entityPage = (
  entityTabOverrides: Record<
    string,
    Omit<DynamicEntityTabProps, 'path' | 'if' | 'children'>
  > = {},
) => {
  return (
    <EntityLayout>
      {Object.entries({ ...defaultTabs, ...entityTabOverrides }).map(
        ([path, config]) => {
          return dynamicEntityTab({
            ...config,
            path,
            ...(tabRules[path] ? tabRules[path] : {}),
            ...(tabChildren[path] ? tabChildren[path] : {}),
          } as DynamicEntityTabProps);
        },
      )}
    </EntityLayout>
  );
};
