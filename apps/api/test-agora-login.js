const AgoraRTC = require("agora-rtc-sdk-ng");
const { RtcTokenBuilder, RtcRole } = require("agora-token");

const appId = "bc67fe2d86234b6d89e0cba7389385a2";
const appCertificate = "49087eb587c341dd81561d3ce800eb68";
const channel = "teste_auth_123";
const uid = 12345;

const token = RtcTokenBuilder.buildTokenWithUid(
  appId, appCertificate, channel, uid, RtcRole.PUBLISHER, 3600, 3600
);

console.log("Token:", token);

const client = AgoraRTC.createClient({mode: "rtc", codec: "vp8"});
client.join(appId, channel, token, uid)
  .then(() => {
    console.log("SUCCESS! The credentials are valid.");
    client.leave();
  })
  .catch(e => {
    console.error("FAIL! Error joining:", e.message);
  });
