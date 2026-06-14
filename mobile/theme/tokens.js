// Design tokens — mirrors the web theme exactly
export const Colors = {
  bg:          '#F5EBE6',
  bgSoft:      '#FAF6F3',
  surface:     '#FFFFFF',
  surfaceWarm: '#FDF9F7',
  border:      '#CFC0B4',
  borderLight: '#E5D9D0',
  text:        '#2D1B0E',
  textSoft:    '#3D2616',
  textMuted:   '#7A6055',
  olive:       '#4A5E28',
  oliveDark:   '#34421C',
  oliveBg:     'rgba(74,94,40,0.09)',
  oliveBorder: 'rgba(74,94,40,0.20)',
  amber:       '#B87C2A',
  amberBg:     'rgba(184,124,42,0.10)',
  terracotta:  '#B85C38',
  terracBg:    'rgba(184,92,56,0.10)',
  dangerBg:    'rgba(184,56,56,0.09)',
  dangerText:  '#7D1F1F',
  dangerBorder:'rgba(184,56,56,0.22)',
  successBg:   'rgba(74,94,40,0.09)',
  successText: '#34421C',
  white:       '#FFFFFF',
  black:       '#000000',
}

export const FontFamily = {
  displayBlack:  'Fraunces_900Black',
  displayBold:   'Fraunces_700Bold',
  displayMedium: 'Fraunces_500Medium',
  bodyRegular:   'PlusJakartaSans_400Regular',
  bodyMedium:    'PlusJakartaSans_500Medium',
  bodySemiBold:  'PlusJakartaSans_600SemiBold',
  bodyBold:      'PlusJakartaSans_700Bold',
  mono:          'monospace',
}

export const FontSize = {
  xs:   11,
  sm:   12,
  base: 14,
  md:   15,
  lg:   17,
  xl:   20,
  '2xl':24,
  '3xl':30,
  '4xl':36,
}

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl':24,
  '3xl':32,
  '4xl':40,
}

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl':24,
  full: 999,
}

export const Shadow = {
  sm: {
    shadowColor: '#2D1B0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#2D1B0E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 6,
  },
}
