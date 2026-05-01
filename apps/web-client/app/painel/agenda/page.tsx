//@ts-nocheck
"use client";

import { YStack, H2, Text } from "tamagui";

export default function AgendaPage() {
  return (
    <YStack flex={1} backgroundColor="$background" padding="$4" gap="$4">
      <H2 color="$color12" size="$6" fontWeight="bold">Agenda</H2>
      <Text color="$color11">Em breve...</Text>
    </YStack>
  );
}
