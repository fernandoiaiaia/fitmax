//@ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Avatar,
  Button,
  Separator,
  Text,
  Paragraph,
  H1,
  H2,
  XStack,
  YStack,
  ZStack,
  Circle,
  Input,
  Image,
  ScrollView,
} from "tamagui";

const menuItems = [
  { label: "Consultas",     href: "/painel/consultas",   icon: "heart-pulse" },
  { label: "Publicações",   href: "/painel/publicacoes", icon: "megaphone" },
  { label: "Usuários",      href: "/painel/usuarios",    icon: "users" },
  { label: "Relatórios",    href: "/painel/relatorios",  icon: "clipboard" },
  { label: "Assinatura",     href: "/painel/assinatura",     icon: "coin" },
  { label: "Configurações",  href: "/painel/configuracoes",  icon: "settings" },
];

function SidebarIcon({ name, color = "$color11" }: { name: string; color?: string }) {
  const icons: Record<string, React.ReactNode> = {
    home: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    grid: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    "heart-pulse": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
      </svg>
    ),
    megaphone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 11 18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </svg>
    ),
    users: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    clipboard: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    coin: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <line x1="12" y1="18" x2="12" y2="6" />
      </svg>
    ),
    settings: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    "arrow-left": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
      </svg>
    ),
    "arrow-right": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
      </svg>
    ),
    "log-out": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  };
  return <div style={{ color }}>{icons[name]}</div>;
}

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Modal Drawer state
  const [desktopCollapsed, setDesktopCollapsed] = useState(false); // Desktop Rail state
  const pathname = usePathname();

  return (
    <XStack height="100vh" overflow="hidden" backgroundColor="$background">
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <ZStack
          position="absolute"
          top={0} left={0} right={0} bottom={0}
          backgroundColor="rgba(0,0,0,0.6)"
          zIndex={40}
          onPress={() => setSidebarOpen(false)}
          $gtSm={{ display: 'none' }}
        />
      )}

      {/* Sidebar Architecture */}
      <YStack
        width={280}
        $gtSm={{ width: desktopCollapsed ? 84 : 280, position: "relative", left: 0, borderRightWidth: 1 }}
        backgroundColor="$color2"
        borderRightWidth={1}
        borderColor="$borderColor"
        position="absolute"
        top={0} bottom={0}
        zIndex={50}
        left={sidebarOpen ? 0 : -280}
        style={{ transition: 'all 0.2s ease-in-out' }}
      >
        <ScrollView flex={1} width="100%" showsVerticalScrollIndicator={false}>
          {/* Internal constraints for the rail format vs full format */}
          <YStack paddingVertical="$4" paddingHorizontal={desktopCollapsed ? "$2" : "$4"} flex={1} alignItems={desktopCollapsed ? "center" : "stretch"}>
            
            {/* Topbar Actions */}
            <XStack justifyContent={desktopCollapsed ? "center" : "flex-end"} alignItems="center" marginBottom="$4">
               {/* Mobile Close Button (Hidden on Desktop) */}
               <Button circular size="$3" chromeless icon={<SidebarIcon name="arrow-left" color="white" />} onPress={() => setSidebarOpen(false)} $gtSm={{ display: 'none' }} />
               
               {/* Desktop Collapse Toggle (Hidden on Mobile) */}
               <Button circular size="$3" chromeless icon={<SidebarIcon name={desktopCollapsed ? "arrow-right" : "arrow-left"} color="white" />} onPress={() => setDesktopCollapsed(!desktopCollapsed)} $sm={{ display: 'none' }} />
            </XStack>

            {/* Logo Wrapper */}
            <YStack marginBottom="$4" alignItems="center" justifyContent="center" width="100%" overflow="hidden" height={desktopCollapsed ? 30 : 60}>
              {!desktopCollapsed ? (
                <Image src="/brand-logo.png" width={180} height={60} objectFit="contain" alignSelf="center" />
              ) : (
                <SidebarIcon name="grid" color="white" />
              )}
            </YStack>

            {/* Profile Block */}
            <YStack alignItems="center" marginTop="$2" marginBottom="$5">
              <Avatar circular size={desktopCollapsed ? "$4" : "$8"} backgroundColor="$color4" borderWidth={2} borderColor="$green8">
                <Avatar.Image src="https://picsum.photos/200/200?random=40" />
                <Avatar.Fallback alignItems="center" justifyContent="center">
                  <Text color="$color12" fontSize={desktopCollapsed ? 16 : 24} fontWeight="bold">A</Text>
                </Avatar.Fallback>
              </Avatar>
              
              {!desktopCollapsed && (
                <>
                  <Text color="$color12" fontSize={16} fontWeight="bold" marginTop="$3">Admin FitMax</Text>

                  <XStack gap="$4" marginTop="$4" alignSelf="stretch" justifyContent="center">
                    <YStack alignItems="center">
                        <Text color="$color12" fontSize={14} fontWeight="bold">12k</Text>
                        <Text color="$color11" fontSize={10}>Usuários</Text>
                    </YStack>
                    <Separator vertical borderColor="$borderColor" />
                    <YStack alignItems="center">
                        <Text color="$color12" fontSize={14} fontWeight="bold">450</Text>
                        <Text color="$color11" fontSize={10}>Pro</Text>
                    </YStack>
                  </XStack>
                  
                  <YStack marginTop="$4" alignSelf="flex-start" paddingHorizontal="$2">
                      <Paragraph color="$color11" fontSize={12} marginTop="$1">
                        Acesso total · Nível 5 🔐
                      </Paragraph>
                  </YStack>
                </>
              )}
            </YStack>

            <Separator marginVertical="$2" borderColor="$borderColor" />

            {/* Navigation Menu */}
            <YStack gap="$1" flex={1} marginTop="$4" paddingBottom="$4" width="100%">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'flex' }}>
                    <XStack
                      width="100%"
                      justifyContent={desktopCollapsed ? "center" : "flex-start"}
                      alignItems="center"
                      gap={desktopCollapsed ? 0 : "$3"}
                      paddingVertical="$3"
                      paddingHorizontal={desktopCollapsed ? 0 : "$3"}
                      borderRadius="$4"
                      backgroundColor={isActive ? "$color4" : "transparent"}
                      hoverStyle={!isActive ? { backgroundColor: "$color3" } : {}}
                      cursor="pointer"
                    >
                      <SidebarIcon name={item.icon} color="white" />
                      {!desktopCollapsed && (
                        <Text color="white" fontSize={14} fontWeight={isActive ? "bold" : "500"}>
                          {item.label}
                        </Text>
                      )}
                    </XStack>
                  </Link>
                );
              })}
              
              {/* Logout Button */}
              <Link href="/" style={{ textDecoration: 'none', display: 'flex' }}>
                <XStack
                  width="100%"
                  justifyContent={desktopCollapsed ? "center" : "flex-start"}
                  alignItems="center"
                  gap={desktopCollapsed ? 0 : "$3"}
                  paddingVertical="$3"
                  paddingHorizontal={desktopCollapsed ? 0 : "$3"}
                  borderRadius="$4"
                  hoverStyle={{ backgroundColor: "$red4" }}
                  cursor="pointer"
                  marginTop="$4"
                >
                  <SidebarIcon name="log-out" color="white" />
                  {!desktopCollapsed && (
                    <Text color="white" fontSize={14} fontWeight="bold">Sair</Text>
                  )}
                </XStack>
              </Link>
            </YStack>

          </YStack>
        </ScrollView>
      </YStack>

      {/* Main Content Area */}
      <YStack flex={1} overflow="hidden">
        
        {/* Global Topbar */}
        <XStack 
           alignItems="center" 
           paddingHorizontal="$4" 
           $gtSm={{ paddingHorizontal: "$6" }} 
           paddingVertical="$4"
           borderBottomWidth={1}
           borderColor="$borderColor"
           backgroundColor="$background"
           gap="$4"
           flexShrink={0}
        >
          <Button
            size="$3"
            circular
            chromeless
            icon={<SidebarIcon name="grid" color="$color12" />}
            onPress={() => setSidebarOpen(true)}
            $gtSm={{ display: "none" }}
          />
          
          <XStack flex={1} alignItems="center" gap="$4">
             <Input 
                placeholder="Pesquisar..."
                width={240}
                backgroundColor="$color3"
                borderWidth={0}
                borderRadius="$10"
                paddingHorizontal="$4"
                color="$color12"
                $sm={{ display: "none" }}
             />
          </XStack>
        </XStack>

        {/* Page Children */}
        <YStack flex={1} overflow="hidden">
          {children}
        </YStack>

      </YStack>
    </XStack>
  );
}
