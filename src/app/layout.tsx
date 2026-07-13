import "@once-ui-system/core/css/styles.css"
import "@once-ui-system/core/css/tokens.css"
import "@/resources/custom.css"

import classNames from "classnames"
import type { Viewport } from "next"
import Script from "next/script"
import { Background, Column, Flex, Opacity, RevealFx, SpacingToken } from "@once-ui-system/core"
import { Providers } from "@/components/Providers"
import { RouteGuard } from "@/components/RouteGuard"
import { style, effects, fonts } from "@/resources"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const metadata = {
  title: { default: "wo-shi", template: "%s · wo-shi" },
  description: "A social network to find yourself through others",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Flex
      suppressHydrationWarning
      as="html"
      lang="es"
      fillWidth
      data-brand={style.brand}
      data-accent={style.accent}
      data-neutral={style.neutral}
      data-solid={style.solid}
      data-solid-style={style.solidStyle}
      data-border={style.border}
      data-surface={style.surface}
      data-transition={style.transition}
      data-scaling={style.scaling}
      className={classNames(fonts.heading.variable, fonts.body.variable, fonts.label.variable, fonts.code.variable)}
    >
      <head>
        <Script id="theme-init" src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <Providers>
        <Column as="body" background="page" fillWidth style={{ minHeight: "100dvh" }} margin="0" padding="0" suppressHydrationWarning>
          <RevealFx fill position="absolute">
            <Background
              mask={{ x: effects.mask.x, y: effects.mask.y, radius: effects.mask.radius, cursor: effects.mask.cursor }}
              gradient={{
                display: effects.gradient.display,
                opacity: effects.gradient.opacity as Opacity,
                x: effects.gradient.x,
                y: effects.gradient.y,
                width: effects.gradient.width,
                height: effects.gradient.height,
                tilt: effects.gradient.tilt,
                colorStart: effects.gradient.colorStart,
                colorEnd: effects.gradient.colorEnd,
              }}
              dots={{ display: effects.dots.display, opacity: effects.dots.opacity as Opacity, size: effects.dots.size as SpacingToken, color: effects.dots.color }}
            />
          </RevealFx>
          <RouteGuard>{children}</RouteGuard>
        </Column>
      </Providers>
    </Flex>
  )
}
