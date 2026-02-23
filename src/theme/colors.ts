export const colors = {
  // Brand
  saffron: '#14854A',
  terracotta: '#0F6F3E',

  // Surfaces
  cream: '#ffffff8f',
  charcoalGrill: '#0d0e0e8a',
  warmWhite: '#ffffff8e',

  // Text / supportive
  oliveDark: '#176E43',
  oliveLight: '#69B58F',
  oliveMuted: '#7BAF97',

  // Action
  spiceRed: '#D64646',
  mintFresh: '#1B9A5A',

  // Shared UI tokens
  glassLight: 'rgba(255, 255, 255, 0.25)',
  glassDark: 'rgba(0, 0, 0, 0.25)',
  glassBorder: 'rgba(13, 120, 68, 0.16)',
};

export const lightTheme = {
  background: colors.cream,
  glassBackground: colors.glassLight,
  surface: colors.warmWhite,
  primary: colors.saffron,
  accent: colors.terracotta,
  text: '#0A6C40',
  secondaryText: '#03361fff',
  glass: colors.glassLight,
  border: 'rgba(13, 120, 68, 0.12)',
};

export const darkTheme = {
  background: '#000000f4',
  surface: '#000000b1',
  primary: colors.saffron,
  accent: colors.terracotta,
  text: '#ECF6EF',
  secondaryText: '#cae2d5ff',
  glass: colors.glassDark,
  border: 'rgba(255, 255, 255, 0.12)',
};
