"use client"

import { Button, Column, Line, Row, Text } from "@once-ui-system/core"

export type OAuthProviderStrategy = "oauth_google"

interface SocialAuthButtonsProps {
  onSelect: (strategy: OAuthProviderStrategy) => void
  loading?: boolean
  disabled?: boolean
  pending?: OAuthProviderStrategy | null
}

export function SocialAuthButtons({ onSelect, loading = false, disabled = false, pending = null }: SocialAuthButtonsProps) {
  return (
    <Column fillWidth gap="m">
      <Button
        type="button"
        variant="secondary"
        fillWidth
        loading={pending === "oauth_google"}
        disabled={disabled || loading}
        onClick={() => onSelect("oauth_google")}
      >
        Continuar con Google
      </Button>
      <Row fillWidth vertical="center" gap="12">
        <Line background="neutral-alpha-medium" style={{ flex: 1 }} />
        <Text variant="label-default-s" onBackground="neutral-weak">o</Text>
        <Line background="neutral-alpha-medium" style={{ flex: 1 }} />
      </Row>
    </Column>
  )
}
