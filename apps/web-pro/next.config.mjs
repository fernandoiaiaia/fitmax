/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'tamagui',
    '@tamagui/core',
    '@tamagui/config',
    'react-native-web',
    'expo-linear-gradient',
  ],
  experimental: {
    optimizePackageImports: ['tamagui', '@tamagui/core'],
  },
}

export default nextConfig;
