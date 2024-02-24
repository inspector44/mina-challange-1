import { Mina, PrivateKey } from "./types";
import { SpyContract } from "./SpyContract";

export const setupMinaChain = () => {
    const LocalBlockchain = Mina.LocalBlockchain({ proofsEnabled: false });
    Mina.setActiveInstance(LocalBlockchain);

    const admin = LocalBlockchain.testAccounts[0];
    const privateKeyOfContract = PrivateKey.random();
    const spyContract = new SpyContract(privateKeyOfContract.toPublicKey());

    return { admin, privateKeyOfContract, spyContract };
};