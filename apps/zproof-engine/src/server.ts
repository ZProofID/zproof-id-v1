import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./config/mongodb.js";

import {
  getPrivateKeyHexForDevOnly,
  getPublicKeyHex,
} from "./crypto/attestation.js";

async function startServer() {
  await connectMongo();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Humanity backend running on http://localhost:${env.PORT}`);
    console.log(`Attestation public key: ${getPublicKeyHex()}`);

    if (!env.ATTESTATION_PRIVATE_KEY_HEX) {
      console.log(
        "No ATTESTATION_PRIVATE_KEY_HEX set. Generated dev key for this process:"
      );
      console.log(getPrivateKeyHexForDevOnly());
    }
  });
}

startServer().catch((error) => {
  console.error("Failed to start humanity backend:", error);
  process.exit(1);
});
