# ZProof.ID

ZProof.ID is a privacy-preserving proof-of-humanity protocol built on Stellar. It enables applications to verify that a user is a real human without exposing sensitive behavioral data or requiring centralized identity providers.

Instead of trusting a server's decision, ZProof.ID generates a zero-knowledge proof (ZK proof) from a completed humanity verification session. This proof can then be verified on-chain by a Soroban smart contract, allowing applications to trust the verification result without revealing how the result was computed.

## The Problem

Today's proof-of-humanity systems typically require applications to trust a centralized service that determines whether a user is human. This introduces several challenges:

- **Centralized trust** — Applications must trust the verification provider's servers and database.
- **Privacy concerns** — Raw behavioral data, biometrics, or verification results are often stored or transmitted.
- **Limited portability** — Users must repeat verification across different applications.
- **Poor interoperability** — Each application integrates a different verification provider using proprietary APIs.
- **No on-chain verifiability** — Smart contracts cannot independently verify humanity without trusting an off-chain oracle.

## Our Solution

ZProof.ID replaces trust with cryptographic proof.

After a user completes the humanity verification challenge:

1. The verification engine evaluates the session.
2. A zero-knowledge proof is generated proving the user satisfied the verification policy.
3. The proof is verified on-chain by a Soroban smart contract.
4. An immutable Humanity ID can then be issued without revealing the user's behavioral data.

Applications only need to verify the proof—they never receive or store the underlying private information.

### Key Features

- 🔒 Privacy-preserving proof of humanity
- ⚡ On-chain verification using Soroban
- 🧠 Zero-knowledge proof generation
- 🪪 Portable Humanity ID across applications
- 🔐 No biometric or behavioral data revealed on-chain
- 🌐 Open protocol that any application can integrate

---

# Repository Structure

This repository is a monorepo containing:

- **apps/zproof-engine** — Express backend, ZK proof generation, and Soroban integration.
- **apps/zproof-app** — React frontend for Humanity Verification.

## Prerequisites

- Node.js 20+
- npm
- A funded Stellar Testnet account (for Soroban transactions)

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd zproof
```

### 2. Configure the backend

Create or update:

```text
apps/zproof-engine/.env
```

Add your Stellar secret key:

```env
SOROBAN_SOURCE_SECRET=SCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

> **Important:** This account is used to prepare and submit Soroban transactions. Ensure it has sufficient Testnet XLM.

### 3. Install dependencies

From the workspace root:

```bash
npm install
```

This installs dependencies for:

- Root workspace
- `apps/zproof-engine`
- `apps/zproof-app`

## Running the project

From the workspace root:

```bash
npm run dev
```

This starts both:

- **Backend:** `apps/zproof-engine`
- **Frontend:** `apps/zproof-app`

The frontend and backend will automatically run concurrently.

## Workspace Structure

```text
.
├── apps
│   ├── zproof-app
│   └── zproof-engine
├── package.json
└── README.md
```

## Available Scripts

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `npm install`      | Install all workspace dependencies |
| `npm run dev`      | Start both frontend and backend    |
| `npm run backend`  | Start only the backend             |
| `npm run frontend` | Start only the frontend            |
| `npm run build`    | Build both applications            |

## Notes

- The backend requires a valid `SOROBAN_SOURCE_SECRET` before it can prepare or submit Soroban transactions.
- The frontend communicates with the backend running in `apps/zproof-engine`.
- This project is currently configured for **Stellar Testnet**.

> **Hackathon Note**
>
> For ease of evaluation, this repository includes a pre-configured `.env` file containing a **Stellar Testnet** account. These credentials are for demonstration purposes only and do **not** control any production assets.
>
> No additional configuration is required to run the project.
