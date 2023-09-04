import React from 'react';
import { Revision } from '../types';
import { Link } from '@backstage/core-components';
import { GitHubCommitLink } from '../GitHubCommitLink/GitHubCommitLink';

type PropTypes = {
  branchName: string;
  revision?: Revision;
};

const isValidUrl = (urlString: string): boolean => {
  const urlPattern = new RegExp('(?:https)://');
  return !!urlPattern.test(urlString);
};

const isGithubUrl = (urlString: string): boolean => {
  const urlPattern = new RegExp('(?:https?)://(github.com)');
  return !!urlPattern.test(urlString);
};

export const TeamcitySource = (props: PropTypes) => {
  const buildBranchLink = (branchName: string, revision?: Revision) => {
    if (revision && revision['vcs-root-instance']) {
      const isUrl = isValidUrl(revision['vcs-root-instance'].name);
      const isGithub = isGithubUrl(revision['vcs-root-instance'].name);

      if (isUrl) {
        return (
          <>
            <Link to={revision['vcs-root-instance'].name} target="_blank">
              {branchName}
            </Link>
            {isGithub ? (
              <GitHubCommitLink
                revision={revision?.version}
                repoUrl={revision['vcs-root-instance'].name}
              />
            ) : (
              revision?.version
            )}
          </>
        );
      }
    }

    return (
      <>
        {branchName} {revision?.version && <>({revision.version})</>}
      </>
    );
  };

  return buildBranchLink(props.branchName, props.revision);
};
