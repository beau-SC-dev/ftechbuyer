# Friendtech Cli Tool

Use all of this at your own risk. I wrote this quickly and am not liable for any results. Also, I'd read this whole readme. 

Things to potentially change:
-   Gas settings
-   Commands
-   Option to not run the extra price check in EOA mode (reduce latency)
-   Rewrite in Rust
-   Lmk anything else (@bh359 on twitter)

### Setup

1. Clone the repo and run "npm install"

2. Create a .env file and fill it out using the template in env.template.

3. Run "npm run cli"

4. Type "help" to info on commands you can run

### Notes

If using contract mode, the contract itself is going to hold your shares. Therefore, you won't receive any points for those buys/sells (though you'll make any profit or loss), and you probably won't see the buys/sells on the UI either. 

Do NOT change constants.ts to use the old ShareBuyerV2 contract at 0x6113A230173f47EE1662BAc9C0c3383Fc981174C. Use the one built into the system now (0xb1675320847917F6918C461e942E4bE61388d8dD). The old one can't sell shares because it doesn't implement a payable fallback function, so any shares bought through that contract are unsellable.
