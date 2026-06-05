const AgoraRTC = require("agora-rtc-sdk-ng");
const client = AgoraRTC.createClient({mode: "rtc", codec: "vp8"});
client.join("12345678901234567890123456789012", "canal", null, 999999)
  .then(() => console.log("joined 999999"))
  .catch(e => console.log("join 999999 error:", e.message));
client.join("12345678901234567890123456789012", "canal", null, "string_id")
  .then(() => console.log("joined string"))
  .catch(e => console.log("join string error:", e.message));
