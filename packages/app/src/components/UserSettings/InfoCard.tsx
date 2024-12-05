import React from 'react';

import {
  InfoCard as BSInfoCard,
  CopyTextButton,
} from '@backstage/core-components';

import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import buildMetadata from '../../build-metadata.json';

export const InfoCard = () => {
  const [showBuildInformation, setShowBuildInformation] =
    React.useState<boolean>(
      () =>
        localStorage.getItem('rhdh-infocard-show-build-information') === 'true',
    );

  const toggleBuildInformation = () => {
    setShowBuildInformation(!showBuildInformation);
    try {
      if (showBuildInformation) {
        localStorage.removeItem('rhdh-infocard-show-build-information');
      } else {
        localStorage.setItem('rhdh-infocard-show-build-information', 'true');
      }
    } catch (e) {
      // ignore
    }
  };

  let clipboardText = buildMetadata.title;
  if (buildMetadata.card?.length) {
    clipboardText += '\n\n';
    buildMetadata.card.forEach(text => {
      clipboardText += `${text}\n`;
    });
  }

  const filteredCards = showBuildInformation
    ? buildMetadata.card
    : buildMetadata.card.filter(
        text =>
          text.startsWith('RHDH Version') ||
          text.startsWith('Backstage Version'),
      );
  // Ensure that we show always some information
  const versionInfo =
    filteredCards.length > 0 ? filteredCards.join('\n') : buildMetadata.card[0];

  /**
   * Show all build information and automatically select them
   * when the user selects the version with the mouse.
   */
  const onMouseUp = (event: React.MouseEvent<HTMLSpanElement>) => {
    if (!showBuildInformation) {
      setShowBuildInformation(true);
      window.getSelection()?.selectAllChildren(event.target as Node);
    }
  };

  /**
   * Show all build information and automatically select them
   * when the user selects the version with the keyboard (tab)
   * and presses the space key or the Ctrl+C key combination.
   */
  const onKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (
      event.key === ' ' ||
      (event.key === 'c' && event.ctrlKey) ||
      (event.key === 'C' && event.ctrlKey)
    ) {
      setShowBuildInformation(true);
      window.getSelection()?.selectAllChildren(event.target as Node);
    }
  };

  return (
    <BSInfoCard
      title={buildMetadata.title}
      action={
        // This is a workaround to ensure that the buttons doesn't increase the header size.
        <div style={{ position: 'relative' }}>
          <div
            style={{ position: 'absolute', top: -2, right: 0, display: 'flex' }}
          >
            <CopyTextButton
              text={clipboardText}
              tooltipText="Metadata copied to clipboard"
              arial-label="Copy metadata to your clipboard"
            />
            <IconButton
              title={showBuildInformation ? 'Show less' : 'Show more'}
              onClick={toggleBuildInformation}
              style={{ width: 48 }}
            >
              {showBuildInformation ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
            </IconButton>
          </div>
        </div>
      }
    >
      <Typography
        variant="subtitle1"
        // Allow the user to select the text with the keyboard.
        tabIndex={0}
        onMouseUp={onMouseUp}
        onKeyDown={onKeyDown}
        style={{
          whiteSpace: 'pre-line',
          wordWrap: 'break-word',
          lineHeight: '2.1rem',
        }}
      >
        {versionInfo}
      </Typography>
    </BSInfoCard>
  );
};
