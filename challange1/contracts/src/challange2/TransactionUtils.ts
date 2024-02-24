import { Mina, PrivateKey, UInt64, PublicKey } from "./types";
import { SpyProgram } from "./SpyProgram";
import { SpyProof } from "./SpyProof";
import assert from "node:assert";

export async function createAndSendTransaction(action: () => void, signers: PrivateKey[], adminPublicKey: PublicKey) {
    const tx = await Mina.transaction(adminPublicKey, action);
    await tx.prove();
    tx.sign(signers);
    await tx.send();
}

export async function receiveMessageAndAssert(
    firstProof: SpyProof | undefined,
    messageDetails: {
        messageNo: UInt64;
        agentId: UInt64;
        xLocation: UInt64;
        yLocation: UInt64;
        checksum?: UInt64;
    },
    expectedOutput: UInt64
): Promise<SpyProof> {
    const { messageNo, agentId, xLocation, yLocation, checksum } = messageDetails;
    const originalChecksum = checksum || agentId.add(xLocation).add(yLocation);
    const newProof = await SpyProgram.listenAgent(
        firstProof!.publicOutput,
        firstProof!,
        messageNo,
        agentId,
        xLocation,
        yLocation,
        originalChecksum,
    );
    assert.deepEqual(newProof!.publicOutput, expectedOutput);
    return newProof;
}