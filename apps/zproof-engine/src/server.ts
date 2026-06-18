import { env } from "./config/env.js";
import { getPrivateKeyHexForDevOnly, getPublicKeyHex } from "./crypto/attestation.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Humanity backend running on http://localhost:${env.PORT}`);
  console.log(`Attestation public key: ${getPublicKeyHex()}`);
  if (!env.ATTESTATION_PRIVATE_KEY_HEX) {
    console.log("No ATTESTATION_PRIVATE_KEY_HEX set. Generated dev key for this process:");
    console.log(getPrivateKeyHexForDevOnly());
  }
});
