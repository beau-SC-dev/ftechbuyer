### Friendtech Cli Tool

Use all of this at your own risk. I haven't tested contract mode, and I wrote this in just about 1-2 hours.

Things to potentially change:

-   Gas settings
-   Commands
-   Option to not run the extra price check in EOA mode (reduce latency)
-   Rewrite in Rust
-   Lmk anything else

## Setup

1. Clone the repo and run "npm install"

2. Optionally, deploy contracts/ShareBuyer.sol (if you want to use Contract mode)

3. Create a .env file and fill it out using the template in env.template. Leave SHARE_BUYER blank if you didn't do step 2.

4. Run "npm run cli"

5. Type "help" to info on commands you can run
