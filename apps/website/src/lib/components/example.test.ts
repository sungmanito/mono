// This test should be deleted once we get into actuall unit testing the components
import { it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import ComponentName from './hero.svelte';
it('renders correctly', () => {
  const { getByText } = render(ComponentName, {});

  expect(getByText('Sungmanito')).toBeInTheDocument();
});
