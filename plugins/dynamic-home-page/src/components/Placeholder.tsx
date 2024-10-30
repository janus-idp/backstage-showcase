import { makeStyles } from 'tss-react/mui';

export interface PlaceholderProps {
  showBorder?: boolean;
  debugContent?: string;
}

const useStyles = makeStyles()({
  centerDebugContent: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Make card content scrollable (so that cards don't overlap)
  showBorder: {
    border: '1px solid gray',
    width: '100%',
    height: '100%',
  },
});

export const Placeholder = (props: PlaceholderProps) => {
  const { classes } = useStyles();
  const className = [
    props.debugContent ? classes.centerDebugContent : undefined,
    props.showBorder ? classes.showBorder : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div data-testid="placeholder" className={className}>
      {props.debugContent}
    </div>
  );
};
