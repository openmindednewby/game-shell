import { GAME_SHELL_CSS, injectStyles } from './styles';

describe('styles', () => {
  it('places the desktop card from --gs-card-bottom, defaulting to 60px', () => {
    expect(GAME_SHELL_CSS).toContain('--gs-card-bottom:60px');
    expect(GAME_SHELL_CSS).toContain('bottom:calc(var(--gs-card-bottom,60px) + var(--gs-safe-bottom))');
  });

  it('injects the stylesheet once', () => {
    injectStyles(document);
    injectStyles(document);
    expect(document.querySelectorAll('#gs-styles')).toHaveLength(1);
  });
});
