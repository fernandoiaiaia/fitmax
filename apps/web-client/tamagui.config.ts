import { config as configBase } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'

export const config = createTamagui({
  ...configBase,
  themeClassNameOnRoot: false,
})

// this makes typescript properly type your tamagui configuration
type Conf = typeof config
declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default config
