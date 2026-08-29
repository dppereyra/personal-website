import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ButtonWrapper from './ButtonTestWrapper.svelte';

describe('Button', () => {
  it('renders with slot content', () => {
    render(ButtonWrapper, { props: { text: 'Click me' } });
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
    expect(button.textContent).toBe('Click me');
  });

  it('applies primary variant class by default', () => {
    render(ButtonWrapper, { props: { text: 'Click me' } });
    const button = screen.getByRole('button');
    expect(button.className).toContain('btn-primary');
  });

  it('applies correct variant class', () => {
    render(ButtonWrapper, { props: { variant: 'ghost', text: 'Ghost button' } });
    const button = screen.getByRole('button');
    expect(button.className).toContain('btn-ghost');
  });

  it('calls onclick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(ButtonWrapper, { props: { onclick: handleClick, text: 'Click me' } });

    const button = screen.getByRole('button');
    button.click();

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('sets correct button type', () => {
    render(ButtonWrapper, { props: { type: 'submit', text: 'Submit' } });
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.type).toBe('submit');
  });
});
