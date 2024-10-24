import { MarkdownContent } from '@backstage/core-components';

import { makeStyles } from '@material-ui/core/styles';

export interface MarkdownProps {
  title?: string;
  content?: string;
}

const useStyles = makeStyles({
  // Make card content scrollable (so that cards don't overlap)
  card: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  content: {
    overflow: 'auto',
  },
});

export const Markdown = (props: MarkdownProps) => {
  const classes = useStyles();
  return (
    <div className={classes.card}>
      {props.title ? <h1>{props.title}</h1> : null}
      <MarkdownContent
        dialect="gfm"
        content={props.content ?? ''}
        className={classes.content}
      />
    </div>
  );
};
