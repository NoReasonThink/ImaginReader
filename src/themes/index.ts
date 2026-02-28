export * from './types';
export * from './light';
export * from './dark';
export * from './sepia';

import { LightTheme } from './light';
import { DarkTheme } from './dark';
import { SepiaTheme } from './sepia';

export const Themes = {
  light: LightTheme,
  dark: DarkTheme,
  sepia: SepiaTheme
};

export type ThemeType = keyof typeof Themes;
