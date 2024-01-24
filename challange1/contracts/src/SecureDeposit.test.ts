import { SecureDeposit } from './SecureDeposit';
import { PublicKey, Field, Bool, Poseidon, Mina, MerkleMap, PrivateKey, UInt32, AccountUpdate } from 'o1js';
import assert from "node:assert";


describe('Challange 1 Tests', () => {
    const LocalBlockchain = Mina.LocalBlockchain({ proofsEnabled: false })
    Mina.setActiveInstance(LocalBlockchain)
    const [admin, user1, user2, user3, user4, user5, fakeAdmin] = LocalBlockchain.testAccounts;
    const privateKeyOfContract = PrivateKey.random();
    const addressesMap = new MerkleMap();
    const messagesMap = new MerkleMap();
    const secureDeposit = new SecureDeposit(privateKeyOfContract.toPublicKey())

    async function executeTransaction(publicKey: PublicKey, action: () => void, signers: PrivateKey[]) {
        const tx = await Mina.transaction(publicKey, action);
        await tx.prove();
        tx.sign(signers);
        await tx.send();
    }

    function assertOnChainValues(expectedRoot: any, expectedCount: number, secureDeposit: SecureDeposit) {
        const onChainRoot = secureDeposit.addressesMapRoot.get();
        const onChainCount = secureDeposit.addressCount.get();
        assert.deepEqual(onChainRoot, expectedRoot);
        assert.deepEqual(onChainCount, UInt32.from(expectedCount));
    }

    async function store(user: typeof user1, expectedCount: number, secureDeposit: SecureDeposit, adminPrivateKey: PrivateKey) {
        const userHash = Poseidon.hash(user.publicKey.toFields());
        await executeTransaction(admin.publicKey, () => {
            const witness = addressesMap.getWitness(userHash);
            secureDeposit.store(witness, user.publicKey);
        }, [adminPrivateKey]);
    
        addressesMap.set(userHash, Bool(true).toField());
    
        assertOnChainValues(addressesMap.getRoot(), expectedCount, secureDeposit);
    }

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

    LocalBlockchain.testAccounts.forEach((user, index) => {
        it(`admin can store an address for user${index + 1}`, async () => {
            await store(user, index + 1, secureDeposit, admin.privateKey);
        });
    });

    it("admin can't store an address if not signed", async () => {
        const user5Hash = Poseidon.hash(user5.publicKey.toFields())

        try {
            const tx = await Mina.transaction(admin.publicKey, () => {
                const witness = addressesMap.getWitness(user5Hash)
                secureDeposit.store(witness, user5.publicKey)
            })
            await tx.prove()
            tx.sign([])
            await tx.send()
            assert(false, "should've failed")
        } catch { }
    })

    it("non-admins can't store an address", async () => {
        const user5Hash = Poseidon.hash(user5.publicKey.toFields())

        try {
            const tx = await Mina.transaction(fakeAdmin.publicKey, () => {
                const addressWitness = addressesMap.getWitness(user5Hash)
                secureDeposit.store(addressWitness, user5.publicKey)
            })
            assert(false, "should've failed")
        } catch { }
    })
})