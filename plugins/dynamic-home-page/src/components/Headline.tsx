export interface HeadlineProps {
  title?: string;
  align?: 'left' | 'center' | 'right';
}

export const Headline = (props: HeadlineProps) => {
  return <h1 style={{ textAlign: props.align }}>{props.title}</h1>;
};
