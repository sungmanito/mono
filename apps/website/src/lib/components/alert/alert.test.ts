import { render } from '@testing-library/svelte';
import Alert from './alert.svelte';
import { describe, it, expect } from 'vitest';

describe('Alert component', () => {
  it('renders successfully', () => {
    const { getByText } = render(Alert);

    expect(getByText('I am the alert component')).toBeTruthy();
  });
});
