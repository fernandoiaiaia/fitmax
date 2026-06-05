"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import {
  AgoraRTCProvider,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useJoin,
  useRemoteUsers,
  RemoteUser,
  LocalVideoTrack,
} from "agora-rtc-react";
import { api } from "@/lib/api";

interface VideoRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  userName: string;
}

export default function VideoRoomModal({ isOpen, onClose, channelName, userName }: VideoRoomModalProps) {
  const [rtcToken, setRtcToken]               = useState<string | null>(null);
  const [appId, setAppId]                     = useState<string>("");
  const [canalSanitizado, setCanalSanitizado] = useState<string>("");
  const [uid]                                 = useState<number>(() => Math.floor(Math.random() * 65534) + 1);
  const [tokenError, setTokenError]           = useState<string | null>(null);
  // O client Agora só é criado quando o modal abre pela primeira vez
  const clientRef = useRef<IAgoraRTCClient | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Cria o client apenas uma vez, na primeira abertura
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    }

    setRtcToken(null);
    setTokenError(null);

    api.get("/video/token", { params: { canal: channelName } })
      .then((res) => {
        setRtcToken(res.data.token);
        setAppId(res.data.appId);
        setCanalSanitizado(res.data.canal);
      })
      .catch(() => setTokenError("Não foi possível iniciar o atendimento. Tente novamente."));
  }, [isOpen, channelName]);

  const fetchToken = () => {
    setTokenError(null);
    setRtcToken(null);
    api.get("/video/token", { params: { canal: channelName } })
      .then((res) => { setRtcToken(res.data.token); setAppId(res.data.appId); setCanalSanitizado(res.data.canal); })
      .catch(() => setTokenError("Não foi possível iniciar o atendimento. Tente novamente."));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-5xl h-[85vh] bg-[#141414] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#1a1a1a]">
              <div>
                <h2 className="text-white text-lg font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                  Atendimento Online
                </h2>
                <p className="text-zinc-400 text-xs mt-1">Sala: {channelName}</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 border border-transparent transition-all"
                title="Sair da sala"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 relative bg-black">
              {tokenError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-4">
                  <svg className="w-12 h-12 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-sm text-center max-w-xs">{tokenError}</p>
                  <button onClick={fetchToken} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors">
                    Tentar novamente
                  </button>
                </div>
              ) : !rtcToken || !appId || !clientRef.current || !uid ? (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm">Conectando ao atendimento...</p>
                  </div>
                </div>
              ) : (
                <AgoraRTCProvider client={clientRef.current}>
                  <AgoraRoom channelName={canalSanitizado} appId={appId} token={rtcToken} uid={uid} />
                </AgoraRTCProvider>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AgoraRoom({ channelName, appId, token, uid }: {
  channelName: string;
  appId: string;
  token: string;
  uid: number;
}) {
  const [micOn, setMicOn]       = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack }     = useLocalCameraTrack(cameraOn);

  useJoin({ appid: appId, channel: channelName, token, uid });

  usePublish([localMicrophoneTrack, localCameraTrack]);

  const remoteUsers    = useRemoteUsers();
  const mainRemoteUser = remoteUsers.length > 0 ? remoteUsers[0] : null;

  return (
    <div className="w-full h-full relative flex flex-col">
      <div className="flex-1 w-full h-full relative flex items-center justify-center">
        {mainRemoteUser ? (
          <RemoteUser user={mainRemoteUser} className="w-full h-full object-cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-500">
            <svg className="w-16 h-16 mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-lg">Aguardando o paciente entrar...</p>
          </div>
        )}
      </div>

      {/* Local Video PIP */}
      <div className="absolute top-6 right-6 w-48 h-64 bg-zinc-900 border-2 border-zinc-800 rounded-2xl overflow-hidden shadow-2xl z-10 transition-transform hover:scale-105">
        {localCameraTrack ? (
          <LocalVideoTrack track={localCameraTrack} play={true} className="w-full h-full object-cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">Câmera Desligada</div>
        )}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded-md font-medium">Você</div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900/80 backdrop-blur-md px-6 py-4 rounded-full border border-zinc-700/50 shadow-2xl z-20">
        <button onClick={() => setMicOn(v => !v)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${micOn ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}>
          {micOn ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          )}
        </button>
        <button onClick={() => setCameraOn(v => !v)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${cameraOn ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}>
          {cameraOn ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          )}
        </button>
      </div>
    </div>
  );
}
