'use client';

import { createContext, useContext } from 'react';

// ── Dark (default) — warm editorial gold/green on near-black ──────────────────
export const darkTheme = {
  bg: '#100f0a', nav: '#15130c', panel: '#17150d', panelDark: '#0c0b06',
  border: '#2b2820', borderSoft: '#221f17',
  text: '#efe7d3', textDim: '#b8ad93', muted: '#8a8068', faint: '#6b6450',
  green: '#86b06a', greenBright: '#a7cf86', greenDeep: '#3f5a30',
  gold: '#e3b53f', goldBright: '#f4d57c', goldDeep: '#5c4408',
  accent: '#e3b53f', onAccent: '#1a1400', onGreen: '#06281e', selected: '#f4d57c', accentSoft: '#1c1606',
  critical: '#e0563b', watch: '#e3b53f', normal: '#86b06a',
  critBg: '#1d0d07', critBorder: '#5e271a',
  watchBg: '#1c1606', watchBorder: '#5c4408',
  normBg: '#101a0c', normBorder: '#3f5a30',
  quarantineBg: '#3a1408', cleanBg: '#16240f',
  nodeDim: '#4a4636',
  overlay: 'rgba(3,7,14,0.72)',
};

// ── Light — Lumnia cream paper, antique gold, forest green ────────────────────
export const lightTheme = {
  bg: '#f2efe5', nav: '#ebe7da', panel: '#fcfbf5', panelDark: '#eee9dc',
  border: '#dbd4c3', borderSoft: '#e6e0d1',
  text: '#1d1a12', textDim: '#564e40', muted: '#8a8067', faint: '#a89e86',
  green: '#4e7a3e', greenBright: '#3f7331', greenDeep: '#5c7a48',
  gold: '#b58a2e', goldBright: '#8a6512', goldDeep: '#e6d8b6',
  accent: '#c2a14a', onAccent: '#2a2206', onGreen: '#ffffff', selected: '#9a6b12', accentSoft: '#f3ead2',
  critical: '#b1442a', watch: '#a9781c', normal: '#4e7a3e',
  critBg: '#f7e7e1', critBorder: '#e3b8aa',
  watchBg: '#f5ecd3', watchBorder: '#e3d09c',
  normBg: '#e9f0df', normBorder: '#bdd4a9',
  quarantineBg: '#f3ded1', cleanBg: '#e0eccd',
  nodeDim: '#b8af99',
  overlay: 'rgba(40,33,12,0.42)',
};

export const ThemeContext = createContext(darkTheme);
export const useTheme = () => useContext(ThemeContext);

// Back-compat static export (dark). Prefer useTheme() in components.
export const THEME = darkTheme;
