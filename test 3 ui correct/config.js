
const AppConfig = {
    // Replace with your Ganache RPC URL
    GANACHE_URL: "http://127.0.0.1:7545", 

    // Replace with the private key of a funded account on your Ganache instance
    // IMPORTANT: This is for development only. Never expose private keys in production.
    SENDER_PRIVATE_KEY: "YOUR_GANACHE_PRIVATE_KEY",

    // Replace with your deployed AyurTrace contract address
    CONTRACT_ADDRESS: "YOUR_CONTRACT_ADDRESS",

    // IMPORTANT: Replace this with the actual ABI of your deployed AyurTrace contract.
    // The ABI (Application Binary Interface) is a JSON array that describes your contract's functions and events.
    // You can get it from your compilation output (e.g., in Remix, or from your Truffle/Hardhat build artifacts).
    CONTRACT_ABI: [
        // --- Placeholder ABI ---
        // This is a minimal example. You MUST replace it with your actual contract ABI.
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "batchId",
              "type": "bytes32"
            },
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "index",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "enum AyurTrace.Role",
              "name": "role",
              "type": "uint8"
            }
          ],
          "name": "BlockCreated",
          "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "actorId",
                    "type": "string"
                },
                {
                    "internalType": "uint8",
                    "name": "role",
                    "type": "uint8"
                },
                {
                    "internalType": "string",
                    "name": "fullName",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "addr",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "phone",
                    "type": "string"
                }
            ],
            "name": "registerActor",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "actorId",
                    "type": "string"
                }
            ],
            "name": "actors",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "string",
                            "name": "actorId",
                            "type": "string"
                        },
                        {
                            "internalType": "uint8",
                            "name": "role",
                            "type": "uint8"
                        },
                        {
                            "internalType": "string",
                            "name": "name",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "addr",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "phone",
                            "type": "string"
                        },
                        {
                            "internalType": "bool",
                            "name": "isRegistered",
                            "type": "bool"
                        }
                    ],
                    "internalType": "struct AyurTrace.Actor",
                    "name": "",
                    "type": "tuple"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "actorId",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "timestamp",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "cropName",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "quantity",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "location",
                    "type": "string"
                }
            ],
            "name": "createFarmerBlockAutoBatch",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "actorId",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "timestamp",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "cropName",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "quantity",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "location",
                    "type": "string"
                },
                {
                    "internalType": "bytes32",
                    "name": "batchId",
                    "type": "bytes32"
                },
                {
                    "internalType": "uint256",
                    "name": "prevIndex",
                    "type": "uint256"
                }
            ],
            "name": "createCollectorBlock",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "actorId",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "timestamp",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "cropName",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "quantity",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "location",
                    "type": "string"
                },
                {
                    "internalType": "bytes32",
                    "name": "batchId",
                    "type": "bytes32"
                },
                {
                    "internalType": "uint256",
                    "name": "prevIndex",
                    "type": "uint256"
                }
            ],
            "name": "createAuditorBlock",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "actorId",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "timestamp",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "productName",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "quantity",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "location",
                    "type": "string"
                },
                {
                    "internalType": "bytes32",
                    "name": "batchId",
                    "type": "bytes32"
                },
                {
                    "internalType": "uint256",
                    "name": "prevIndex",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "serialNumber",
                    "type": "string"
                }
            ],
            "name": "createManufacturerBlock",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "actorId",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "timestamp",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "productName",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "quantity",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "location",
                    "type": "string"
                },
                {
                    "internalType": "bytes32",
                    "name": "batchId",
                    "type": "bytes32"
                },
                {
                    "internalType": "uint256",
                    "name": "prevIndex",
                    "type": "uint256"
                }
            ],
            "name": "createDistributorBlock",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "batchId",
                    "type": "bytes32"
                }
            ],
            "name": "getFullChainByBatch",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "index",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "prevIndex",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "batchId",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "string",
                            "name": "serialNumber",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "actorId",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "name",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "addr",
                            "type": "string"
                        },
                        {
                            "internalType": "uint8",
                            "name": "role",
                            "type": "uint8"
                        },
                        {
                            "internalType": "uint256",
                            "name": "createdAt",
                            "type": "uint256"
                        },
                        {
                            "internalType": "string",
                            "name": "cropName",
                            "type": "string"
                        },
                        {
                            "internalType": "uint256",
                            "name": "quantity",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct AyurTrace.Block[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]
};
