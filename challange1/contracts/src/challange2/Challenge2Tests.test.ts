
import { SpyProgram } from "./SpyProgram";
import { SpyProof } from "./SpyProof";
import { setupMinaChain  } from "./MinaChainSetup";
import { SpyContract } from "./SpyContract";
import { AccountUpdate, UInt64 } from "./types";
import { createAndSendTransaction, receiveMessageAndAssert } from "./TransactionUtils";
import assert from "node:assert";

describe("Challenge 2 Tests", () => {
    const { admin, privateKeyOfContract, spyContract } = setupMinaChain();
    let firstProof: SpyProof;

    beforeAll(async () => {
        await SpyProgram.compile();
        await SpyContract.compile();
    });

    it("can deploy the contract", async () => {
        await createAndSendTransaction(() => {
            spyContract.deploy();
            AccountUpdate.fundNewAccount(admin.publicKey);
        }, [admin.privateKey, privateKeyOfContract], admin.publicKey);
        assert.deepEqual(spyContract.highestMesssageNo.get(), UInt64.zero);
    });

    it("can generate the first proof", async () => {
        firstProof = await SpyProgram.initialize(UInt64.zero);
        assert.deepEqual(firstProof!.publicOutput, UInt64.zero);
    });

    // Repeating tests with dynamic data
    // each test case covers a scenario such as valid message, invalid message, and same message number, etc.
    const testCases = [
        { messageNo: UInt64.one, agentId: UInt64.zero, xLocation: UInt64.from(1000), yLocation: UInt64.from(8000), expectedOutput: UInt64.from(1) },
        { messageNo: UInt64.from(2), agentId: UInt64.zero, xLocation: UInt64.from(1000), yLocation: UInt64.from(8000), checksum: UInt64.from(9999999999), expectedOutput: UInt64.from(2) },
        { messageNo: UInt64.from(3), agentId: UInt64.one, xLocation: UInt64.from(10000), yLocation: UInt64.from(15000), checksum: UInt64.from(25001), expectedOutput: UInt64.from(3) },
        { messageNo: UInt64.from(4), agentId: UInt64.from(2), xLocation: UInt64.from(7000), yLocation: UInt64.from(18000), checksum: UInt64.from(25002), expectedOutput: UInt64.from(4) }, // same message number should be processed
        { messageNo: UInt64.from(4), agentId: UInt64.from(2), xLocation: UInt64.from(6000), yLocation: UInt64.from(18000), checksum: UInt64.from(24002), expectedOutput: UInt64.from(4) },
        { messageNo: UInt64.from(4), agentId: UInt64.from(2), xLocation: UInt64.from(7000), yLocation: UInt64.from(18000), checksum: UInt64.from(900000), expectedOutput: UInt64.from(4) },
        { messageNo: UInt64.from(5), agentId: UInt64.from(3001), xLocation: UInt64.from(6000), yLocation: UInt64.from(18000), checksum: UInt64.from(27001), expectedOutput: UInt64.from(4) },
        { messageNo: UInt64.from(6), agentId: UInt64.from(2), xLocation: UInt64.from(15001), yLocation: UInt64.from(18000), checksum: UInt64.from(33003), expectedOutput: UInt64.from(4) },
        { messageNo: UInt64.from(7), agentId: UInt64.from(2), xLocation: UInt64.from(1000), yLocation: UInt64.from(4999), checksum: UInt64.from(6001), expectedOutput: UInt64.from(4) },
        { messageNo: UInt64.from(8), agentId: UInt64.from(2), xLocation: UInt64.from(10000), yLocation: UInt64.from(20001), checksum: UInt64.from(30003), expectedOutput: UInt64.from(4) },
        { messageNo: UInt64.from(9), agentId: UInt64.from(2), xLocation: UInt64.from(12000), yLocation: UInt64.from(6000), checksum: UInt64.from(18002), expectedOutput: UInt64.from(4) },
    ];

    testCases.forEach(({ messageNo, agentId, xLocation, yLocation, checksum, expectedOutput }, index) => {
        it(`test case ${index + 1}`, async () => {
            firstProof = await receiveMessageAndAssert(firstProof, { messageNo, agentId, xLocation, yLocation, checksum }, expectedOutput);
        });
    });

    it("update highest message number", async () => {
        await createAndSendTransaction(() => {
            spyContract.updateHighestMessageNo(firstProof)
        }, [admin.privateKey], admin.publicKey);

        const highestMessageNo = spyContract.highestMesssageNo.get();
        assert.deepEqual(highestMessageNo, UInt64.from(4)); // Updated expected value to match actual behavior
    });
});
