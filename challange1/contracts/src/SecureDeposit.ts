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
    events = {
        MessageReceived: UInt32
    };

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

    @method store(addressWitness: MerkleMapWitness, address: PublicKey) {
        AccountUpdate.createSigned(this.sender);

        const adminPublicKey = this.adminPublicKey.getAndRequireEquals();
        const addressCount = this.addressCount.getAndRequireEquals();
        const addressesMapRoot = this.addressesMapRoot.getAndRequireEquals();
        addressCount.assertLessThanOrEqual(UInt32.from(100));
        adminPublicKey.assertEquals(this.sender);

        
    }
    
}