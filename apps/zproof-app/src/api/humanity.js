const API_URL = "http://localhost:4300";

export async function createChallenge(walletAddress) {
  const response = await fetch(`${API_URL}/api/humanity/challenges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      walletAddress,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create challenge");
  }

  return response.json();
}

export async function verifyHumanity(payload) {
  const response = await fetch(`${API_URL}/api/humanity/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to verify humanity");
  }

  return response.json();
}
