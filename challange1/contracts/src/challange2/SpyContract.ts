import { DeployArgs, Permissions, SmartContract, State, UInt64, method, state } from "./types";
import { SpyProof } from "./SpyProof";

export class SpyContract extends SmartContract {
    @state(UInt64) highestMesssageNo = State<UInt64>();

    deploy(deployArgs?: DeployArgs) {
        super.deploy(deployArgs);
        this.account.permissions.set({
            ...Permissions.allImpossible(),
            editState: Permissions.proof(),
            access: Permissions.proof(),
        });
    }

    @method updateHighestMessageNo(proof: SpyProof) {
        proof.verify();
        this.highestMesssageNo.set(proof.publicOutput);
    }
}