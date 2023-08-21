import { CliService } from "./cli";
import "dotenv/config";

const sleepForMs = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

// Constants
const rpcUrl = process.env.RPC_URL || "";
const privateKey = process.env.PRIVATE_KEY || "";

export const createCliInstance = async (): Promise<CliService> => {
    const cli = new CliService(rpcUrl, privateKey);
    return cli;
};

// Entry point
export const run = async () => {
    const cli = await createCliInstance();

    // Listeners
    process.on("exit", async () => {
        console.log("[cli entry] Exiting...");
        if (!cli.isDestroyed) {
            cli.destroySelf();
        }
        await sleepForMs(500);
    });
    process.on("SIGINT", async () => {
        console.log("[cli entry] SIGINT received");
        if (!cli.isDestroyed) {
            cli.destroySelf();
        }
        process.exit(0);
    });
    process.on("uncaughtException", async (err) => {
        console.log("[cli entry] uncaughtException received");
        console.error(err);
        if (!cli.isDestroyed) {
            cli.destroySelf();
        }
        process.exit(1);
    });

    // Main loop
    cli.monitorCli();
};

run();
