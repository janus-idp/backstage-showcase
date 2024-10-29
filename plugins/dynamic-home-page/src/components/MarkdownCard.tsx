import { InfoCard, MarkdownContent } from '@backstage/core-components';

export interface MarkdownCardProps {
  title?: string;
  content?: string;
}

export const MarkdownCard = (props: MarkdownCardProps) => {
  return (
    <InfoCard title={props.title}>
      <MarkdownContent dialect="gfm" content={props.content ?? ''} />
    </InfoCard>
  );
};
