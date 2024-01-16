import { Bool, state, Permissions, SmartContract, Field, State, PublicKey, UInt32, AccountUpdate, MerkleMap, PrivateKey, DeployArgs, method, MerkleMapWitness, Poseidon, Provable } from "o1js";

export class SecureDeposit extends SmartContract {
    @state(UInt32) addressCount = State<UInt32>();
    @state(UInt32) messageCount = State<UInt32>();
    @state(Field) messagesMapRoot = State<Field>();
    @state(Field) addressesMapRoot = State<Field>();
    @state(PublicKey) adminPublicKey = State<PublicKey>();

    deploy(deployArgs?: DeployArgs){
        super.deploy(deployArgs);
        this.account.permissions.set({
            ...Permissions.allImpossible(),
            editState: Permissions.proof(),
            access: Permissions.proof()
        });
    }


    init() {
        super.init();
        AccountUpdate.createSigned(this.sender);
        const tree = new MerkleMap();
        this.addressesMapRoot.set(tree.getRoot());
        this.messagesMapRoot.set(tree.getRoot());
        this.adminPublicKey.set(this.sender);
        this.addressCount.set(UInt32.zero);
        this.messageCount.set(UInt32.zero);
    }

    
}