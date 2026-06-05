import { useJoin, useLocalMicrophoneTrack, useLocalCameraTrack, usePublish, useRemoteUsers, RemoteUser } from "agora-rtc-react";
export function Room() {
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(true);
  const { localCameraTrack } = useLocalCameraTrack(true);
  useJoin({ appid: "1", channel: "2", token: "3" });
  usePublish([localMicrophoneTrack, localCameraTrack]);
  const remoteUsers = useRemoteUsers();
  return remoteUsers.map(user => <RemoteUser key={user.uid} user={user} />);
}
