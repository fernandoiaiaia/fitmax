"use client";

import { useServerInsertedHTML } from "next/navigation";
import { TamaguiProvider } from "tamagui";
import config from "../tamagui.config";

export function Providers({ children }: { children: React.ReactNode }) {
  useServerInsertedHTML(() => {
    // @ts-ignore
    return <style dangerouslySetInnerHTML={{ __html: config.getCSS() }} />;
  });

  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      {children}
    </TamaguiProvider>
  );
}
