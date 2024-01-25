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

    it("eligible address can deposit - user1", async () => {
        const user1Hash = Poseidon.hash(user1.publicKey.toFields())

        const msgBits = Field.empty().toBits() // all bits are false by default
        msgBits[249] = Bool(true)   // 1st flag is true
        const msg = Field.fromBits(msgBits) // constructing a message from bits

        console.log(msgBits.length)

        const tx = await Mina.transaction(user1.publicKey, () => {
            const addressWitness = addressesMap.getWitness(user1Hash)
            const messageWitness = messagesMap.getWitness(user1Hash)
            secureDeposit.deposit(addressWitness, messageWitness, msg)
        })
        await tx.prove()
        tx.sign([user1.privateKey])
        await tx.send()


        messagesMap.set(user1Hash, msg)

        const onChainMessagesRoot = secureDeposit.messagesMapRoot.get()
        const onChainMessagesCount = secureDeposit.messageCount.get()
        assert.deepEqual(onChainMessagesRoot, messagesMap.getRoot())
        assert.deepEqual(onChainMessagesCount, UInt32.from(1))
    })

    it("eligible address can deposit - user2", async () => {
        const user2Hash = Poseidon.hash(user2.publicKey.toFields())

        const msgBits = Field.empty().toBits() // all bits are false by default
        msgBits[250] = Bool(true)   // 2nd flag is true
        msgBits[251] = Bool(true)   // 3rd flag is true
        const msg = Field.fromBits(msgBits) // constructing a message from bits

        const tx = await Mina.transaction(user2.publicKey, () => {
            const addressWitness = addressesMap.getWitness(user2Hash)
            const messageWitness = messagesMap.getWitness(user2Hash)
            secureDeposit.deposit(addressWitness, messageWitness, msg)
        })
        await tx.prove()
        tx.sign([user2.privateKey])
        await tx.send()

        messagesMap.set(user2Hash, msg)

        const onChainMessagesRoot = secureDeposit.messagesMapRoot.get()
        const onChainMessagesCount = secureDeposit.messageCount.get()
        assert.deepEqual(onChainMessagesRoot, messagesMap.getRoot())
        assert.deepEqual(onChainMessagesCount, UInt32.from(2))
    })

    it("eligible address can deposit - user3", async () => {
        const user3Hash = Poseidon.hash(user3.publicKey.toFields())

        const msgBits = Field.empty().toBits() // all bits are false by default
        msgBits[252] = Bool(true)   // 4th flag is true
        const msg = Field.fromBits(msgBits) // constructing a message from bits

        const tx = await Mina.transaction(user3.publicKey, () => {
            const addressWitness = addressesMap.getWitness(user3Hash)
            const messageWitness = messagesMap.getWitness(user3Hash)
            secureDeposit.deposit(addressWitness, messageWitness, msg)
        })
        await tx.prove()
        tx.sign([user3.privateKey])
        await tx.send()

        messagesMap.set(user3Hash, msg)

        const onChainMessagesRoot = secureDeposit.messagesMapRoot.get()
        const onChainMessagesCount = secureDeposit.messageCount.get()
        assert.deepEqual(onChainMessagesRoot, messagesMap.getRoot())
        assert.deepEqual(onChainMessagesCount, UInt32.from(3))
    })

    it("eligible address can't deposit a message if flags are not true", async () => {
        const user4Hash = Poseidon.hash(user4.publicKey.toFields())

        try {
            const msgBits = Field.empty().toBits() // all bits are false by default
            msgBits[249] = Bool(true)   // 1st flag is true
            msgBits[250] = Bool(true)   // 2nd flag is true (it should have been false)
            const msg = Field.fromBits(msgBits) // constructing a message from bits

            const tx = await Mina.transaction(user1.publicKey, () => {
                const addressWitness = addressesMap.getWitness(user4Hash)
                const messageWitness = messagesMap.getWitness(user4Hash)
                secureDeposit.deposit(addressWitness, messageWitness, msg)
            })
            assert(false, "should've failed")
        } catch { }
    })

    it("ineligible address can't deposit", async () => {
        const user5Hash = Poseidon.hash(user5.publicKey.toFields())

        try {
            const msgBits = Field.empty().toBits() // all bits are false by default
            msgBits[249] = Bool(true)   // 1st flag is true
            const msg = Field.fromBits(msgBits) // constructing a message from bits

            const tx = await Mina.transaction(user2.publicKey, () => {
                const addressWitness = addressesMap.getWitness(user5Hash)
                const messageWitness = messagesMap.getWitness(user5Hash)
                secureDeposit.deposit(addressWitness, messageWitness, msg)
            })
            assert(false, "should've failed")
        } catch { }
    })

    it("user1 can check message and depositor", async () => {
        const user1Hash = Poseidon.hash(user1.publicKey.toFields())

        const msgBits = Field.empty().toBits() // all bits are false by default
        msgBits[249] = Bool(true)   // 1st flag is true
        const msg = Field.fromBits(msgBits) // constructing a message from bits

        const tx = await Mina.transaction(user5.publicKey, () => {
            const messageWitness = messagesMap.getWitness(user1Hash)
            const isValid = secureDeposit.check(messageWitness, user1.publicKey, msg)
            isValid.assertTrue()
        })
        await tx.prove()
        tx.sign([user5.privateKey])
        await tx.send()
    })

    it("user2 can check message and depositor", async () => {
        const user2Hash = Poseidon.hash(user2.publicKey.toFields())

        const msgBits = Field.empty().toBits() // all bits are false by default
        msgBits[250] = Bool(true)   // 2nd flag is true
        msgBits[251] = Bool(true)   // 3rd flag is true
        const msg = Field.fromBits(msgBits) // constructing a message from bits

        const tx = await Mina.transaction(user5.publicKey, () => {
            const messageWitness = messagesMap.getWitness(user2Hash)
            const isValid = secureDeposit.check(messageWitness, user2.publicKey, msg)
            isValid.assertTrue()
        })
        await tx.prove()
        tx.sign([user5.privateKey])
        await tx.send()
    })

    it("user3 can check message and depositor", async () => {
        const user3Hash = Poseidon.hash(user3.publicKey.toFields())

        const msgBits = Field.empty().toBits() // all bits are false by default
        msgBits[252] = Bool(true)   // 4th flag is true
        const msg = Field.fromBits(msgBits) // constructing a message from bits

        const tx = await Mina.transaction(user5.publicKey, () => {
            const messageWitness = messagesMap.getWitness(user3Hash)
            const isValid = secureDeposit.check(messageWitness, user3.publicKey, msg)
            isValid.assertTrue()
        })
        await tx.prove()
        tx.sign([user5.privateKey])
        await tx.send()
    })

    it("user4 can't check message and depositor", async () => {
        try {
            const user4Hash = Poseidon.hash(user4.publicKey.toFields())

            const msgBits = Field.empty().toBits() // all bits are false by default
            msgBits[250] = Bool(true)   // 1st flag is true
            const msg = Field.fromBits(msgBits) // constructing a message from bits

            const tx = await Mina.transaction(user5.publicKey, () => {
                const messageWitness = messagesMap.getWitness(user4Hash)
                const isValid = secureDeposit.check(messageWitness, user4.publicKey, msg)
                isValid.assertTrue()
            })
            await tx.prove()
            tx.sign([user5.privateKey])
            await tx.send()
            assert(false, "should've failed")
        } catch { }
    })
})