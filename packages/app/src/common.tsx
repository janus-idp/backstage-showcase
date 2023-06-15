import React from 'react';
import { CodeSnippet, WarningPanel } from '@backstage/core-components';

export const fetcher = async <T,>(urls: Parameters<typeof fetch>[]) => {
  const responses = await Promise.all(urls.map(args => fetch(...args)));

  const result = responses.find(response => response.ok);

  if (!result) {
    throw new Error('Could not fetch');
  }

  return result.json() as Promise<T[]>;
};

export const ErrorReport = ({
  title,
  errorText,
}: {
  title: string;
  errorText: string;
}) => (
  <WarningPanel severity="error" title={title}>
    <CodeSnippet language="text" text={errorText} />
  </WarningPanel>
);
