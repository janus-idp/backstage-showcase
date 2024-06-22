import React from 'react';
import { dynamicEntityTab, DynamicEntityTabProps } from './DynamicEntityTab';
import { defaultTabs, tabRules, tabChildren } from './defaultTabs';
import { ContextMenuAwareEntityLayout } from './ContextMenuAwareEntityLayout';

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
    <ContextMenuAwareEntityLayout>
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
    </ContextMenuAwareEntityLayout>
  );
};
