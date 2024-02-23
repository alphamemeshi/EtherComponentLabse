// 引入依赖
const bitcoin = require('bitcoinjs-lib');
const request = require('request-promise'); // 使用 request-promise 库发送 HTTP 请求

// 创建比特币钱包
const keyPair = bitcoin.ECPair.makeRandom();
const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

// 输出钱包地址和私钥
console.log('Your Bitcoin Address:', address);
console.log('Your Bitcoin Private Key (WIF):', keyPair.toWIF());

// 查询比特币余额
async function checkBalance(address) {
    try {
        const response = await request(`https://blockchain.info/q/addressbalance/${address}`, { json: true });
        return response / 100000000; // 转换为 BTC 单位
    } catch (error) {
        console.error('Error:', error);
    }
}

// 发送比特币交易
async function sendTransaction(fromKeyPair, toAddress, amountBTC) {
    try {
        const txb = new bitcoin.TransactionBuilder();
        const unspentOutputs = await request(`https://blockchain.info/unspent?active=${fromKeyPair.getAddress()}`, { json: true });
        const txInput = unspentOutputs.unspent_outputs[0];
        txb.addInput(txInput.tx_hash_big_endian, txInput.tx_output_n);
        txb.addOutput(toAddress, amountBTC * 100000000); // 转换为 satoshi 单位
        txb.sign(0, fromKeyPair);
        const txHex = txb.build().toHex();
        const response = await request.post('https://blockchain.info/pushtx', { form: { tx: txHex } });
        console.log('Transaction ID:', response);
    } catch (error) {
        console.error('Error:', error);
    }
}

// 示例：检查余额并发送交易
(async () => {
    const balance = await checkBalance(address);
    console.log('Your Balance:', balance, 'BTC');
    if (balance > 0) {
        const recipientAddress = 'RECIPIENT_ADDRESS'; // 替换为接收方地址
        const amountToSend = 0.001; // 发送的 BTC 数量
        await sendTransaction(keyPair, recipientAddress, amountToSend);
    } else {
        console.log('Insufficient balance to send transaction.');
    }
})();
