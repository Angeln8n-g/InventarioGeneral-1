export interface BackgroundImageConfig {
  src: string
  alt: string
  priority: boolean
  quality: number
  overlayOpacity: number
  darkOverlayOpacity: number
}

export const BACKGROUND_IMAGES = {
  login: {
    src: '/images/login-background.jpg',
    alt: 'Login background',
    priority: true,
    quality: 85,
    overlayOpacity: 0.2,
    darkOverlayOpacity: 0.4,
  },
  toolsScan: {
    src: '/images/Solicitar-herramientas-background.jpg',
    alt: 'Tools scan background',
    priority: false,
    quality: 80,
    overlayOpacity: 0.2,
    darkOverlayOpacity: 0.4,
  },
  toolsReturn: {
    src: '/images/Devoluciones-background.jpg',
    alt: 'Tools return background',
    priority: false,
    quality: 80,
    overlayOpacity: 0.2,
    darkOverlayOpacity: 0.4,
  },
  consumablesScan: {
    src: '/images/solicitar-materiales-background.jpg',
    alt: 'Consumables scan background',
    priority: false,
    quality: 80,
    overlayOpacity: 0.4,
    darkOverlayOpacity: 0.5,
  },
  consumablesReturn: {
    src: '/images/solicitar-materiales-background.jpg',
    alt: 'Consumables return background',
    priority: false,
    quality: 80,
    overlayOpacity: 0.03,
    darkOverlayOpacity: 0.02,
  },
} as const satisfies Record<string, BackgroundImageConfig>
