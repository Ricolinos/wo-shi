// src/types/config.types.ts
// Tipos del config de Once UI — mismo patrón que portfolio-dev, recortado
// a lo que wo-shi usa (sin mailchimp/schema/sameAs/socialSharing).

import {
  BorderStyle,
  ChartMode,
  ChartVariant,
  NeutralColor,
  ScalingSize,
  Schemes,
  SolidStyle,
  SolidType,
  SurfaceStyle,
  Theme,
  TransitionStyle,
} from "@once-ui-system/core"

export type DisplayConfig = {
  themeSwitcher: boolean
}

export type RoutesConfig = Record<`/${string}`, boolean>

export type StyleConfig = {
  theme: Theme
  neutral: NeutralColor
  brand: Schemes
  accent: Schemes
  solid: SolidType
  solidStyle: SolidStyle
  border: BorderStyle
  surface: SurfaceStyle
  transition: TransitionStyle
  scaling: ScalingSize
}

export type DataStyleConfig = {
  variant: ChartVariant
  mode: ChartMode
  height: number
  axis: { stroke: string }
  tick: { fill: string; fontSize: number; line: boolean }
}

export type EffectsConfig = {
  mask: { cursor: boolean; x: number; y: number; radius: number }
  gradient: {
    display: boolean
    opacity: number
    x: number
    y: number
    width: number
    height: number
    tilt: number
    colorStart: string
    colorEnd: string
  }
  dots: { display: boolean; opacity: number; size: string; color: string }
  grid: { display: boolean; opacity: number; color: string; width: string; height: string }
  lines: {
    display: boolean
    opacity: number
    color: string
    size: string
    thickness: number
    angle: number
  }
}
