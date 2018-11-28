const DigiByte = require("digibyte");
const fetch = require("isomorphic-fetch");

class DGB {
    constructor() {
        this.explorerUrl = "https://digiexplorer.info";
    }

    // Create a private key
    generatePrivateKey() {
        return new DigiByte.PrivateKey();
    }

    // Create new wallet
    createNewWallet() {
        return new Promise(async (resolve, reject) => {
            try {
                var privateKey = this.generatePrivateKey();
                var address = await privateKey.toAddress().toString()
                resolve({ address, privateKey });
            }catch(err) {
                reject(err);
            }
        })
    }

    // Info about a transaction
    getTransactionInfo(transaction) {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await fetch(this.explorerUrl + "/api/tx/" + transaction);
                const data = await res.text();
                
                resolve(data);
            }catch(err) {
                reject(err);
            }
        });
    }

    // Get unspect transfer of a wallet
    getUnspectTransfer(address) {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await fetch(this.explorerUrl + "/api/addr/" + address + "/utxo");
                const data = await res.json();
                
                resolve(data);
            }catch(err) {
                reject(err);
            }
        });
    }

    // Send transaction
    sendTransaction(transaction) {
        return new Promise(async (resolve, reject) => {
            const res = await fetch(this.explorerUrl + "/api/tx/send", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    rawtx: transaction.serialize()
                })
            });

            const data = await res.json();

            return data;
        });
    }

    // Create transaction and send
    createAndSendTransfer(sourcePrivateKey, from, to, satoshis) {
        return new Promise(async (resolve, reject) => {
            try {
                if(!this.walletIsValid(from)) {
                    reject({ message: "Source Address is invalid" });
                }

                if(!this.walletIsValid(to)) {
                    reject({ message: "Destination Address is invalid" });
                }

                const utxos = await this.getUnspectTransfer(from);
                
                if(utxos.length == 0) {
                    reject({ message: "The source address has no unspent transactions" });
                }

                var changePrivateKey = this.generatePrivateKey();
                var changeAddress = changePrivateKey.toAddress();
                var transaction = new DigiByte.Transaction();

                for(var i = 0; i < utxos.length; i++) {
                    transaction.from(utxos[i]);
                }

                transaction.to(to, satoshis);
                transaction.change(changeAddress);
                transaction.sign(sourcePrivateKey);

                var sender = await this.sendTransaction(transaction);

                resolve({
                    ...sender,
                    source_private_key: sourcePrivateKey.toWIF(),
                    source_address: from,
                    change_private_key: changePrivateKey.toWIF(),
                    change_address: changeAddress,
                    destination_address: to,
                    sent_amount: satoshis
                });
            }catch(err) {
                reject(err);
            }
        })
    }

    // Information about wallet
    walletInfo(address) {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await fetch(`${this.explorerUrl}/api/addr/${address}`);
                const data = await res.json();

                resolve(data);
            }catch(err) {
                reject(err);
            }
        })
    }

    // Wallet balance
    walletBalance(address) {
        return new Promise(async (resolve, reject) => {
            try {
                const { balance, balanceSat } = await this.walletInfo(address);
                
                resolve({ balance, balanceSat });
            }catch(err) {
                reject(err);
            }
        });
    }

    // Return if wallet is valid
    walletIsValid(address) {
        return DigiByte.Address.isValid(address);
    }
}

const main = async () => {
    const dgbClass = new DGB();
    
    //Call a function here
}

main();
