// src/resources/once-ui.config.ts
// Config de tema y rutas — mismo patrón que portfolio-dev.
// Paleta: violet/indigo se acerca al morado histórico de wo-shi (#534AB7).

import type {
  DisplayConfig,
  EffectsConfig,
  RoutesConfig,
  StyleConfig,
  DataStyleConfig,
} from "@/types/config.types"

// Secciones de la app — feature-flag independiente del auth (que ya cubre proxy.ts).
// Apagar una ruta aquí la oculta en RouteGuard sin tocar el resto del código.
const routes: RoutesConfig = {
  "/feed": true,
  "/journal": true,
  "/bonds": true,
  "/groups": true,
  "/settings": true,
}

const display: DisplayConfig = {
  themeSwitcher: true,
}

import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google"

const heading = Space_Grotesk({ variable: "--font-heading", subsets: ["latin"], display: "swap" })
const body = Geist({ variable: "--font-body", subsets: ["latin"], display: "swap" })
const label = Geist({ variable: "--font-label", subsets: ["latin"], display: "swap" })
const code = Geist_Mono({ variable: "--font-code", subsets: ["latin"], display: "swap" })

const fonts = { heading, body, label, code }

const style: StyleConfig = {
  theme: "system",
  neutral: "gray",
  brand: "violet",
  accent: "indigo",
  solid: "contrast",
  solidStyle: "flat",
  border: "rounded",
  surface: "filled",
  transition: "all",
  scaling: "100",
}

const dataStyle: DataStyleConfig = {
  variant: "gradient",
  mode: "categorical",
  height: 24,
  axis: { stroke: "var(--neutral-alpha-weak)" },
  tick: { fill: "var(--neutral-on-background-weak)", fontSize: 11, line: false },
}

const effects: EffectsConfig = {
  mask: { cursor: false, x: 50, y: 0, radius: 100 },
  gradient: {
    display: true,
    opacity: 60,
    x: 50,
    y: 0,
    width: 150,
    height: 80,
    tilt: 0,
    colorStart: "brand-background-strong",
    colorEnd: "page-background",
  },
  dots: { display: false, opacity: 40, size: "2", color: "brand-background-strong" },
  grid: { display: false, opacity: 100, color: "neutral-alpha-medium", width: "0.25rem", height: "0.25rem" },
  lines: { display: false, opacity: 100, color: "neutral-alpha-weak", size: "16", thickness: 1, angle: 45 },
}

export { routes, display, fonts, style, dataStyle, effects }
