// src/resources/icons.ts
// Iconos propios de wo-shi, fusionados sobre el iconLibrary default de Once UI
// (que ya trae chevrons, check, close, eye, calendar, search, person, etc.)

import type { IconLibrary } from "@once-ui-system/core"
import {
  HiOutlineHome,
  HiOutlineBookOpen,
  HiOutlineUserGroup,
  HiOutlineCog6Tooth,
  HiOutlinePlus,
  HiOutlinePhoto,
  HiOutlineVideoCamera,
  HiOutlineMicrophone,
  HiOutlineMapPin,
  HiOutlinePlay,
  HiOutlineHeart,
  HiOutlineFaceSmile,
  HiOutlineLightBulb,
  HiOutlineSparkles,
  HiOutlineGlobeAlt,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineListBullet,
  HiOutlinePencilSquare,
} from "react-icons/hi2"

export const iconLibrary: Partial<IconLibrary> = {
  feed: HiOutlineHome,
  journal: HiOutlineBookOpen,
  bonds: HiOutlineSparkles,
  groups: HiOutlineUserGroup,
  settings: HiOutlineCog6Tooth,
  add: HiOutlinePlus,
  photo: HiOutlinePhoto,
  video: HiOutlineVideoCamera,
  mic: HiOutlineMicrophone,
  location: HiOutlineMapPin,
  play: HiOutlinePlay,
  emotion: HiOutlineFaceSmile,
  idea: HiOutlineLightBulb,
  world: HiOutlineGlobeAlt,
  friends: HiOutlineUsers,
  graph: HiOutlineChartBar,
  list: HiOutlineListBullet,
  heart: HiOutlineHeart,
  edit: HiOutlinePencilSquare,
}
