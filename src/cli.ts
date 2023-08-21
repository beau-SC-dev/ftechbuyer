import * as readline from "readline";
import { BigNumber, ethers } from "ethers";
import { FtechResponse } from "./types";
import { friendtechAbi } from "./abis/friendtechAbi";
import { shareBuyerV2Abi } from "./abis/shareBuyerV2Abi";
import { FRIENDTECH_ADDRESS, FRIENDTECH_API_USER_URL, SHARE_BUYER_V2_ADDRESS } from "./constants";

/*
Make sure you understand each mode before placing any trades
*/

export class CliService {
    private inputInterface: readline.Interface;
    private provider: ethers.providers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private shareBuyer: ethers.Contract;
    private friendtechSharesV1: ethers.Contract;
    private useContract: boolean;
    private twitterUsernameToAddressCache: { [key: string]: string };
    public isDestroyed: boolean;

    constructor(rpcUrl: string, privateKey?: string) {
        this.provider = new ethers.providers.JsonRpcProvider(rpcUrl, 8453);
        if (privateKey) {
            this.wallet = new ethers.Wallet(privateKey, this.provider);
            this.shareBuyer = new ethers.Contract(SHARE_BUYER_V2_ADDRESS, shareBuyerV2Abi, this.wallet);
            this.friendtechSharesV1 = new ethers.Contract(FRIENDTECH_ADDRESS, friendtechAbi, this.wallet);
        } else {
            console.log("[WARNING] No private key provided, some functionality won't work");
            this.wallet = ethers.Wallet.createRandom();
            this.shareBuyer = new ethers.Contract(SHARE_BUYER_V2_ADDRESS, shareBuyerV2Abi, this.provider);
            this.friendtechSharesV1 = new ethers.Contract(FRIENDTECH_ADDRESS, friendtechAbi, this.provider);
        }

        this.inputInterface = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.twitterUsernameToAddressCache = {};
        this.useContract = false;
        this.isDestroyed = false;
    }

    public destroySelf() {
        try {
            this.inputInterface.close();
        } catch (err) {
            console.log(`Error closing CliService: ${err}`);
        }

        this.isDestroyed = true;
    }

    public monitorCli() {
        const mode = this.useContract ? "Contract" : "EOA";
        this.inputInterface.question(`(${mode} mode) > `, async (input: string) => {
            const args = input.split(" ");
            await this.parseCli(args as string[]);
            this.monitorCli();
        });
    }

    public async parseCli(args: string[]): Promise<boolean> {
        try {
            // Check length
            const len = args.length;
            if (len == 1) {
                if (args[0] == "mode") {
                    this.useContract = !this.useContract;
                } else if (args[0] == "h" || args[0] == "help") {
                    // Print commands
                    this.printCommands();
                } else if (args[0] == "e") {
                    // Exit
                    this.destroySelf();
                    process.exit(0);
                } else if (args[0] == "mode") {
                    this.useContract = !this.useContract;
                } else if (args[0] == "w") {
                    // Output wallet address
                    console.log(`Wallet address: ${this.wallet.address}`);
                }
            } else if (len == 2) {
                if (args[0] == "fa") {
                    // Fetch address for twitter username
                    const addressForTwitterUsername = await this.fetchAddressForTwitterUsername(args[1]);
                    if (addressForTwitterUsername) {
                        console.log(`Address for ${args[1]}: ${addressForTwitterUsername}`);
                    } else {
                        console.log(`No address found for ${args[1]}`);
                    }
                } else if (args[0] == "shares") {
                    // Fetch number of shares owned for an address
                    const sharesOwned = await this.fetchNumberSharesOwned(args[1]);
                    console.log(`Shares owned for ${args[1]}: ${sharesOwned}`);
                }
            } else if (len == 3) {
                if (args[0] == "st") {
                    // Sell shares by twitter username
                    const addressForTwitterUsername = await this.fetchAddressForTwitterUsername(args[1]);
                    if (addressForTwitterUsername) {
                        await this.placeSell(addressForTwitterUsername, args[2]);
                    } else {
                        console.log(`No address found for ${args[1]}`);
                    }
                } else if (args[0] == "sa") {
                    // Sell shares by address
                    await this.placeSell(args[1], args[2]);
                } else if (args[0] == "fba") {
                    // Fetch buy price for address and amount
                    const price = await this.fetchBuyPrice(args[1], args[2]);
                    console.log(
                        `Buy price for ${args[2]} shares of ${args[1]}: ${ethers.utils.formatEther(price)} ETH`
                    );
                } else if (args[0] == "fbt") {
                    // Fetch buy price for twitter username and amount
                    const addressForTwitterUsername = await this.fetchAddressForTwitterUsername(args[1]);
                    if (addressForTwitterUsername) {
                        const price = await this.fetchBuyPrice(addressForTwitterUsername, args[2]);
                        console.log(
                            `Buy price for ${args[2]} shares of ${args[1]}: ${ethers.utils.formatEther(price)} ETH`
                        );
                    } else {
                        console.log(`No address found for ${args[1]}`);
                    }
                } else if (args[0] == "fsa") {
                    // Fetch sell price for address and amount
                    const price = await this.fetchSellPrice(args[1], args[2]);
                    console.log(
                        `Buy price for ${args[2]} shares of ${args[1]}: ${ethers.utils.formatEther(price)} ETH`
                    );
                } else if (args[0] == "fst") {
                    // Fetch sell price for twitter username and amount
                    const addressForTwitterUsername = await this.fetchAddressForTwitterUsername(args[1]);
                    if (addressForTwitterUsername) {
                        const price = await this.fetchSellPrice(addressForTwitterUsername, args[2]);
                        console.log(
                            `Sell price for ${args[2]} shares of ${args[1]}: ${ethers.utils.formatEther(price)} ETH`
                        );
                    } else {
                        console.log(`No address found for ${args[1]}`);
                    }
                }
            } else if (len == 4) {
                if (args[0] == "bt") {
                    // Buy shares by twitter username
                    let maxTotalEthCost = ethers.utils.parseEther(args[3]);
                    const addressForTwitterUsername = await this.fetchAddressForTwitterUsername(args[1]);
                    if (!addressForTwitterUsername) {
                        console.log(`No address found for ${args[1]}\n`);
                        return true;
                    }

                    if (!this.useContract) {
                        // In EOA mode, so pre-check price
                        const price = await this.fetchBuyPrice(addressForTwitterUsername, args[2]);
                        if (price.gt(maxTotalEthCost)) {
                            console.log(`Buy price (${ethers.utils.formatEther(price)} ETH) is too high\n`);
                            return true;
                        } else {
                            // Overwrite maxTotalEthCost cost to only send the exact amount
                            maxTotalEthCost = price;
                        }
                    }

                    await this.placeBuy(addressForTwitterUsername, args[2], maxTotalEthCost);
                } else if (args[0] == "ba") {
                    // Buy shares by address
                    let maxTotalEthCost = ethers.utils.parseEther(args[3]);

                    if (!this.useContract) {
                        // In EOA mode, so pre-check price
                        const price = await this.fetchBuyPrice(args[1], args[2]);
                        if (price.gt(maxTotalEthCost)) {
                            console.log(`Buy price (${ethers.utils.formatEther(price)} ETH) is too high\n`);
                            return true;
                        } else {
                            // Overwrite maxTotalEthCost cost to only send the exact amount
                            maxTotalEthCost = price;
                        }
                    }

                    await this.placeBuy(args[1], args[2], maxTotalEthCost);
                }
            } else {
                console.log("Invalid input");

                console.log("\n");
                return false;
            }
        } catch (err) {
            console.log(`[Cli] Error while parsing input: ${err}`);

            console.log("\n");
            return false;
        }

        console.log("\n");
        return true;
    }

    private async placeBuy(subject: string, amount: string, weiAmount: BigNumber) {
        try {
            console.log(`Buying ${amount} shares of ${subject} for ${ethers.utils.formatEther(weiAmount)} ETH...`);
            const tx = this.useContract
                ? await this.shareBuyer.buyShares(subject, amount, {
                      value: weiAmount
                  })
                : await this.friendtechSharesV1.buyShares(subject, amount, {
                      value: weiAmount
                  });
            console.log(`Buy tx: ${tx.hash}`);
            await tx.wait();
            console.log(`Buy tx confirmed`);
        } catch (err) {
            console.error(err);
        }
    }

    private async placeSell(subject: string, amount: string) {
        try {
            console.log(`Selling ${amount} shares of ${subject}...`);
            const tx = this.useContract
                ? await this.shareBuyer.sellShares(subject, amount)
                : await this.friendtechSharesV1.sellShares(subject, amount);
            console.log(`Sell tx: ${tx.hash}`);
            await tx.wait();
            console.log(`Sell tx confirmed`);
        } catch (err) {
            console.error(err);
        }
    }

    private async fetchAddressForTwitterUsername(username: string): Promise<string | null> {
        try {
            if (this.twitterUsernameToAddressCache[username]) {
                return this.twitterUsernameToAddressCache[username];
            }

            const response = await fetch(`${FRIENDTECH_API_USER_URL}?username=${username}`);
            const data: FtechResponse = await response.json();

            if (data.users.length === 0 || data.users.length > 1) {
                return null;
            }

            this.twitterUsernameToAddressCache[username] = data.users[0].address;
            return data.users[0].address;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    private async fetchBuyPrice(sharesSubject: string, amount: string): Promise<BigNumber> {
        try {
            const buyPrice = await this.friendtechSharesV1.getBuyPriceAfterFee(sharesSubject, amount);
            return BigNumber.from(buyPrice);
        } catch (err) {
            console.error(err);
            return BigNumber.from(0);
        }
    }

    private async fetchSellPrice(sharesSubject: string, amount: string): Promise<BigNumber> {
        try {
            const sellPrice = await this.friendtechSharesV1.getSellPriceAfterFee(sharesSubject, amount);
            return BigNumber.from(sellPrice);
        } catch (err) {
            console.error(err);
            return BigNumber.from(0);
        }
    }

    private async fetchNumberSharesOwned(sharesSubject: string): Promise<number> {
        try {
            const sharesOwned = this.useContract
                ? await this.shareBuyer.sharesBalance(sharesSubject, this.wallet.address)
                : await this.friendtechSharesV1.sharesBalance(sharesSubject, this.wallet.address);
            return sharesOwned.toNumber();
        } catch (err) {
            console.error(err);
            return 0;
        }
    }

    private printCommands() {
        console.log(`
        Modes:
        - Contract: Utilizes ShareBuyer to refund unspent ETH; 
        we won't pre-check prices before sending buy transaction, since the contract does it

        - EOA: Uses FriendtechSharesV1 directly, so extra ETH is not refunded;
        we pre-check price before sending the buy transaction

        ============== Exit ==============
        ● Exit
            <"e">
        
        ============== Info ==============
        ● Print commands
            <"help" or "h">
        ● Output wallet address
            <"w">
        ● Fetch number of shares owned for an address
            <"shares"> <address>
        ● Fetch address for twitter username
            <"fa"> <twitter username>
        ● Fetch buy price for address and amount
            <"fba"> <address> <share amount>
        ● Fetch buy price for twitter username and amount
            <"fbt"> <twitter username> <share amount>
        ● Fetch sell price for address and amount
            <"fsa"> <address> <share amount>
        ● Fetch sell price for twitter username and amount
            <"fst"> <twitter username> <share amount>

        ============== Trading ==============
        ● Swap modes (Contract or EOA)
            <"mode">
        ● Buy shares by twitter username
            <"bt"> <twitter username> <share amount> <max total eth cost>
            Example: "bt HsakaTrades 1 1.5"
        ● Sell shares by twitter username
            <"st"> <twitter username> <share amount>
            Example: "st HsakaTrades 1"
        ● Buy shares by address
            <"ba"> <address> <share amount> <max total eth cost>
            Example: "ba 0xef42b587e4a3d33f88fa499be1d80c676ff7a226 1 1.5"
        ● Sell shares by address
            <"sa"> <address> <share amount>
            Example: "sa 0xef42b587e4a3d33f88fa499be1d80c676ff7a226 1"
        `);
    }
}
