import { renderInTestApp } from '@backstage/test-utils';

import { userEvent } from '@testing-library/user-event';

import { InfoCard } from './InfoCard';

describe('InfoCard', () => {
  it('should render essential versions by default', async () => {
    const renderResult = await renderInTestApp(<InfoCard />);
    expect(renderResult.getByText(/RHDH Version/)).toBeInTheDocument();
    expect(renderResult.getByText(/Backstage Version/)).toBeInTheDocument();
  });

  it('should hide the build time by default and show it on click', async () => {
    const renderResult = await renderInTestApp(<InfoCard />);
    expect(renderResult.queryByText(/Last Commit/)).toBeNull();
    await userEvent.click(renderResult.getByText(/RHDH Version/));
    expect(renderResult.getByText(/Last Commit/)).toBeInTheDocument();
  });
});
