import { SecureDeposit } from './SecureDeposit';
import { Mina, MerkleMap, PrivateKey, UInt32, AccountUpdate } from 'o1js';
import assert from "node:assert";


describe('Challange 1 Tests', () => {
    const LocalBlockchain = Mina.LocalBlockchain({ proofsEnabled: false })
    Mina.setActiveInstance(LocalBlockchain)
    const [admin] = LocalBlockchain.testAccounts;
    const privateKeyOfContract = PrivateKey.random();
    const addressesMap = new MerkleMap();
    const secureDeposit = new SecureDeposit(privateKeyOfContract.toPublicKey())

    
    it("compile contract", async () => {
        await SecureDeposit.compile()
    })

    it("deploy contract", async () => {
        const tx = await Mina.transaction(admin.publicKey, () => {
            secureDeposit.deploy()
            AccountUpdate.fundNewAccount(admin.publicKey)
        })
        await tx.prove()
        tx.sign([admin.privateKey, privateKeyOfContract])
        await tx.send()

        const onChainAdmin = secureDeposit.adminPublicKey.get()
        const onChainRoot = secureDeposit.addressesMapRoot.get()
        const onChainCount = secureDeposit.addressCount.get()
        assert.deepEqual(onChainAdmin, admin.publicKey)
        assert.deepEqual(onChainRoot, addressesMap.getRoot())
        assert.deepEqual(onChainCount, UInt32.from(0))
    })
})