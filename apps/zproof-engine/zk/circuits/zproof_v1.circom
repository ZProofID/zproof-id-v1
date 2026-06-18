pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

template HumanityCredentialV1() {
    // Private inputs
    signal input score;
    signal input gamesPassed;
    signal input botRiskScore;
    signal input secret;

    // Public inputs
    signal input minScore;
    signal input minGamesPassed;
    signal input maxBotRiskScore;
    signal input challengeHash;
    signal input walletHash;
    signal input appHash;

    // Public outputs
    signal output passed;
    signal output nullifier;

    component scoreOk = GreaterEqThan(16);
    scoreOk.in[0] <== score;
    scoreOk.in[1] <== minScore;

    component gamesOk = GreaterEqThan(8);
    gamesOk.in[0] <== gamesPassed;
    gamesOk.in[1] <== minGamesPassed;

    component botRiskOk = LessEqThan(16);
    botRiskOk.in[0] <== botRiskScore;
    botRiskOk.in[1] <== maxBotRiskScore;

    signal scoreAndGamesOk;
    scoreAndGamesOk <== scoreOk.out * gamesOk.out;

    passed <== scoreAndGamesOk * botRiskOk.out;

    component nf = Poseidon(4);
    nf.inputs[0] <== secret;
    nf.inputs[1] <== challengeHash;
    nf.inputs[2] <== walletHash;
    nf.inputs[3] <== appHash;

    nullifier <== nf.out;
}

component main {
    public [
        minScore,
        minGamesPassed,
        maxBotRiskScore,
        challengeHash,
        walletHash,
        appHash
    ]
} = HumanityCredentialV1();