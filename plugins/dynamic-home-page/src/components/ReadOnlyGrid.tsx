// This complete read-only home page grid picks up the idea and styles from
// https://github.com/backstage/backstage/blob/master/plugins/home
// Esp. from the CustomHomepageGrid component:
// https://github.com/backstage/backstage/blob/master/plugins/home/src/components/CustomHomepage/CustomHomepageGrid.tsx
// but without the drag and drop functionality.

import { useMemo } from 'react';
import {
  Layout,
  Layouts,
  Responsive,
  ResponsiveProps,
} from 'react-grid-layout';

import { ErrorBoundary } from '@backstage/core-components';

import { makeStyles } from '@material-ui/core/styles';

// Removes the doubled scrollbar
import 'react-grid-layout/css/styles.css';

import useMeasure from 'react-use/lib/useMeasure';

import { HomePageCardMountPoint } from '../types';

interface Card {
  id: string;
  Component: React.ComponentType<any>;
  props?: Record<string, any>;
  layouts: Record<string, Layout>;
}

const gridGap = 16;

const defaultProps: ResponsiveProps = {
  // Aligned with the 1.0-1.2 home page gap.
  margin: [gridGap, gridGap],
  // Same as in home-plugin CustomHomepageGrid
  rowHeight: 60,

  // We use always a 12-column grid, but each cards can define
  // their number of columns (width) and start column (x) per breakpoint.
  breakpoints: {
    xl: 1600,
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0,
  },
  cols: {
    xl: 12,
    lg: 12,
    md: 12,
    sm: 12,
    xs: 12,
    xxs: 12,
  },

  isDraggable: false,
  isResizable: false,
  compactType: null,
};

const useStyles = makeStyles({
  // Make card content scrollable (so that cards don't overlap)
  cardWrapper: {
    '& > div[class*="MuiCard-root"]': {
      width: '100%',
      height: '100%',
    },
    '& div[class*="MuiCardContent-root"]': {
      overflow: 'auto',
    },
  },
});

export interface ReadOnlyGridProps {
  mountPoints: HomePageCardMountPoint[];
  breakpoints?: Record<string, number>;
  cols?: Record<string, number>;
}

export const ReadOnlyGrid = (props: ReadOnlyGridProps) => {
  const classes = useStyles();
  const [measureRef, measureRect] = useMeasure<HTMLDivElement>();

  const cards = useMemo<Card[]>(() => {
    return props.mountPoints.map<Card>((mountPoint, index) => {
      const id = (index + 1).toString();
      const layouts: Record<string, Layout> = {};

      if (mountPoint.config?.layouts) {
        for (const [breakpoint, layout] of Object.entries(
          mountPoint.config.layouts,
        )) {
          layouts[breakpoint] = {
            i: id,
            x: layout.x ?? 0,
            y: layout.y ?? 0,
            w: layout.w ?? 12,
            h: layout.h ?? 4,
            isDraggable: false,
            isResizable: false,
          };
        }
      } else {
        // Default layout for cards without a layout configuration
        ['xl', 'lg', 'md', 'sm', 'xs', 'xxs'].forEach(breakpoint => {
          layouts[breakpoint] = {
            i: id,
            x: 0,
            y: 0,
            w: 12,
            h: 4,
            isDraggable: false,
            isResizable: false,
          };
        });
      }

      return {
        id,
        Component: mountPoint.Component,
        props: mountPoint.config?.props,
        layouts,
      };
    });
  }, [props.mountPoints]);

  const layouts = useMemo<Layouts>(() => {
    const result: Layouts = {};
    for (const card of cards) {
      for (const [breakpoint, layoutPerBreakpoint] of Object.entries(
        card.layouts,
      )) {
        if (!result[breakpoint]) {
          result[breakpoint] = [];
        }
        result[breakpoint].push(layoutPerBreakpoint);
      }
    }
    return result;
  }, [cards]);

  const children = useMemo(() => {
    return cards.map(card => (
      <div
        key={card.id}
        data-cardid={card.id}
        data-testid={`home-page card ${card.id}`}
        data-layout={JSON.stringify(card.layouts)}
        className={classes.cardWrapper}
      >
        <ErrorBoundary>
          <card.Component {...card.props} />
        </ErrorBoundary>
      </div>
    ));
  }, [cards, classes.cardWrapper]);

  return (
    <div style={{ margin: -gridGap }}>
      <div ref={measureRef} />
      {measureRect.width ? (
        <Responsive
          {...defaultProps}
          width={measureRect.width}
          layouts={layouts}
        >
          {children}
        </Responsive>
      ) : null}
    </div>
  );
};
