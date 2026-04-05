// src/components/bonds/BondAvatar.tsx
// Avatar reutilizable para vínculos.
// Personas → círculo. Conceptos/ideas/creencias/otros → cuadrado redondeado.
// Muestra foto de perfil si hay avatar, si no: color del tipo + iniciales.

import Image from "next/image"
import { BOND_TYPE_COLOR } from "@/lib/bond-subtypes"
import type { BondType } from "@prisma/client"

interface BondAvatarProps {
  name:     string
  type:     BondType
  avatar?:  string | null
  size?:    number   // px, default 36
  className?: string
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const PERSON_TYPES: BondType[] = ["PERSON"]

export function BondAvatar({ name, type, avatar, size = 36, className = "" }: BondAvatarProps) {
  const isPerson    = PERSON_TYPES.includes(type)
  const color       = BOND_TYPE_COLOR[type]
  const initials    = getInitials(name)
  const borderRadius = isPerson ? "9999px" : "8px"
  const sizeStyle   = { width: size, height: size, minWidth: size, minHeight: size }

  if (avatar) {
    return (
      <div
        className={`overflow-hidden flex-shrink-0 ${className}`}
        style={{ ...sizeStyle, borderRadius }}
      >
        <Image
          src={avatar}
          alt={name}
          width={size}
          height={size}
          className="object-cover w-full h-full"
        />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        ...sizeStyle,
        borderRadius,
        background: color,
        color: "#fff",
        fontSize: size * 0.33,
        fontWeight: 500,
      }}
    >
      {initials}
    </div>
  )
}
