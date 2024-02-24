import { SelfProof, UInt64, ZkProgram, Bool, Provable } from "./types";
import { checkIfValid } from "./MessageValidation"

export const SpyProgram = ZkProgram({
  name: "SpyProgram",
  publicInput: UInt64,
  publicOutput: UInt64,
  methods: {
    initialize: {
      privateInputs: [],
      method(initialHighestMessageNo: UInt64) {
        return initialHighestMessageNo;
      },
    },
    listenAgent: {
      privateInputs: [SelfProof, UInt64, UInt64, UInt64, UInt64, UInt64],
      method(
        highestMessageNo: UInt64,
        firstProof: SelfProof<UInt64, UInt64>,
        messageNo: UInt64,
        agentId: UInt64,
        xLocation: UInt64,
        yLocation: UInt64,
        checksum: UInt64,
      ) {
        firstProof.publicOutput.assertEquals(highestMessageNo);

        const isMessageValid = checkIfValid(agentId, messageNo, xLocation, yLocation, checksum, highestMessageNo);
        const newHighestMessageNo = Provable.if(
          isMessageValid.and(messageNo.greaterThan(highestMessageNo)),
          messageNo,
          highestMessageNo,
        );

        return newHighestMessageNo;
      },
    },
  },
});
