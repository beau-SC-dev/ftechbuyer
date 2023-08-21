export const shareBuyerAbi = [
    {
        inputs: [],
        stateMutability: "nonpayable",
        type: "constructor"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "subject",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256"
            }
        ],
        name: "buyShares",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [],
        name: "friendtechSharesV1",
        outputs: [
            {
                internalType: "contract IFriendtechSharesV1",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "subject",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256"
            }
        ],
        name: "sellShares",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "withdrawManual",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
];
