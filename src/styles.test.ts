import { GAME_SHELL_CSS, injectStyles } from './styles';

describe('styles', () => {
  it('places the desktop card from --gs-card-bottom, defaulting to 60px', () => {
    expect(GAME_SHELL_CSS).toContain('--gs-card-bottom:60px');
    expect(GAME_SHELL_CSS).toContain('bottom:calc(var(--gs-card-bottom,60px) + var(--gs-safe-bottom))');
  });

  it('D25 places a top-right card from --gs-card-top (default 16px) inside the safe area', () => {
    expect(GAME_SHELL_CSS).toContain('--gs-card-top:16px');
    expect(GAME_SHELL_CSS).toContain(
      '.gs-install[data-layout=card][data-placement=top-right]{top:calc(var(--gs-card-top,16px) + var(--gs-safe-top));bottom:auto}',
    );
  });

  it('injects the stylesheet once', () => {
    injectStyles(document);
    injectStyles(document);
    expect(document.querySelectorAll('#gs-styles')).toHaveLength(1);
  });
});
