import React from 'react';
import { Link } from '@backstage/core-components';

type PropTypes = {
  revision?: string;
  repoUrl?: string;
};

const splitGitUrl = (urlString: string): string => {
  return urlString.split('#')[0];
};

const shortenRevision = (revision: string): string => {
  return revision.substring(0, 8);
};

export const GitHubCommitLink = (props: PropTypes) => {
  const buildLink = (repoUrl: string, revision: string) => {
    const url = `${splitGitUrl(repoUrl)}/commit/${revision}`;

    return (
      <Link to={url} target="_blank">
        ({shortenRevision(revision)})
      </Link>
    );
  };

  if (props?.revision && props?.repoUrl) {
    return buildLink(props.repoUrl, props.revision);
  }

  return <>({shortenRevision(props?.revision || '')})</>;
};
