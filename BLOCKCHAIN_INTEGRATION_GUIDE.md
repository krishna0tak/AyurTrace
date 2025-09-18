# AyurTrace Blockchain Integration Guide

This guide shows how stakeholder dashboards connect to the AyurTraceUnified smart contract.

## Config
- Edit `config.js`:
  - CONTRACT_ADDRESS: 0x34D4c8923697e931a05617BCB3bdd03B15306F71
  - GANACHE_URL: http://127.0.0.1:7545 (or your RPC URL)
  - DEV_PRIVATE_KEY: Your Ganache private key for signing transactions
  - GANACHE_ACCOUNT: Your Ganache account address
  - CONTRACT_ABI: Full ABI included (generated from AyurTraceUnified.sol)
  - Pinata credentials for image uploads

## Pages
- **Farmer** creates the first block (batch) with image capture + location/time metadata
- **Collector/Auditor/Manufacturer/Distributor** enter Batch ID, view full chain, then add their block
- **Search** reads the chain by batch ID and renders timeline
- **Test Page**: `blockchain-test.html` for connection verification

## Features Added
- ✅ Removed MetaMask dependency - uses Ganache directly
- ✅ Image capture with GPS location and timestamp
- ✅ Pinata integration for IPFS uploads (configure PINATA_JWT)
- ✅ Hash storage on blockchain
- ✅ All stakeholder forms write to contract
- ✅ Search displays event timeline from blockchain

## Testing
1. Open `blockchain-test.html` to verify Ganache connection
2. Test batch creation and balance checks
3. Use farmer dashboard to create batches with images
4. Use other stakeholder dashboards to add to the chain

## Notes
- Set PINATA_JWT in config.js to enable image uploads
- All transactions are signed with the provided private key
- Images are uploaded to IPFS with location/time metadata
- Image hashes are stored as bytes32 on the blockchain
