/* global window, ethers */
(function () {
  const cfg = window.AppConfig || window.config || {};

  const Blockchain = {
    provider: null,
    signer: null,
    contractRO: null,
    contractRW: null,

    async init() {
      // Use Ganache RPC directly with provided private key
      this.provider = new ethers.JsonRpcProvider(cfg.GANACHE_URL);
      
      // Use the provided private key for signing
      if (cfg.DEV_PRIVATE_KEY) {
        this.signer = new ethers.Wallet(cfg.DEV_PRIVATE_KEY, this.provider);
      } else {
        throw new Error('DEV_PRIVATE_KEY not configured in config.js');
      }

      // Read-only contract
      this.contractRO = new ethers.Contract(cfg.CONTRACT_ADDRESS, cfg.CONTRACT_ABI, this.provider);
      // Read-write contract with signer
      this.contractRW = this.contractRO.connect(this.signer);
      return true;
    },

    requireSigner() {
      if (!this.contractRW) throw new Error('No signer available. Check DEV_PRIVATE_KEY in config.js');
      return this.contractRW;
    },

    // --- Image Upload to Pinata ---
    async uploadImageToPinata(imageBlob, metadata = {}) {
      const cfg = window.AppConfig || window.config || {};
      if (!cfg.PINATA_JWT || !cfg.PINATA_UPLOAD_URL) {
        throw new Error('Pinata credentials not configured in config.js');
      }

      const formData = new FormData();
      formData.append('file', imageBlob);
      formData.append('pinataMetadata', JSON.stringify({
        name: `crop-${Date.now()}.jpg`,
        ...metadata
      }));

      const response = await fetch(cfg.PINATA_UPLOAD_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.PINATA_JWT}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.IpfsHash;
    },

    // --- Farmer ---
    async createBatch({ batchId, cropType, quantity, harvestDate, farmLocation, photoHash }) {
      const c = this.requireSigner();
      const hash = photoHash && /^0x[0-9a-fA-F]{64}$/.test(photoHash)
        ? photoHash
        : ethers.id(`${batchId}:${Date.now()}`); // placeholder bytes32
      const tx = await c.createBatch(batchId, cropType, BigInt(quantity), harvestDate, farmLocation, hash);
      const receipt = await tx.wait();
      return receipt;
    },
    async getBatchDetails(batchId) {
      return await this.contractRO.getBatchDetails(batchId);
    },

    // --- Collector ---
    async addCollection({ farmerBatchId, farmerId, cropName, quantity, collectorId }) {
      const c = this.requireSigner();
      const tx = await c.addCollection(farmerBatchId, farmerId, cropName, BigInt(quantity), collectorId);
      return await tx.wait();
    },
    async getCollection(farmerBatchId) {
      return await this.contractRO.getCollection(farmerBatchId);
    },

    // --- Auditor ---
    async addInspection({ batchId, inspectorId, result, notes }) {
      const c = this.requireSigner();
      const tx = await c.addInspection(batchId, inspectorId, result, notes);
      return await tx.wait();
    },
    async getInspection(batchId) {
      return await this.contractRO.getInspection(batchId);
    },

    // --- Manufacturer ---
    async createProduct({ productId, sourceBatchId, productType, quantityProcessed, wastage, processingDate, expiryDate, manufacturerId }) {
      const c = this.requireSigner();
      const tx = await c.createProduct(
        productId,
        sourceBatchId,
        productType,
        BigInt(quantityProcessed),
        BigInt(wastage),
        BigInt(processingDate),
        BigInt(expiryDate),
        manufacturerId
      );
      return await tx.wait();
    },
    async getProduct(productId) {
      return await this.contractRO.products(productId);
    },

    // --- Distributor ---
    async recordReception({ batchId, herbType, quantity, storageLocation }) {
      const c = this.requireSigner();
      const tx = await c.recordReception(batchId, herbType, BigInt(quantity), storageLocation);
      return await tx.wait();
    },
    async recordDispatch({ batchId, quantityToDispatch, destination }) {
      const c = this.requireSigner();
      const tx = await c.recordDispatch(batchId, BigInt(quantityToDispatch), destination);
      return await tx.wait();
    },
    async getInventory(batchId) {
      return await this.contractRO.inventory(batchId);
    },

    // --- Events & Chain ---
    async getChainForBatch(batchId, fromBlock = 0n, toBlock = 'latest') {
      const iface = this.contractRO.interface;
      const logs = [];
      // BatchCreated (indexed batchId)
      try {
        const bc = await this.contractRO.queryFilter(this.contractRO.filters.BatchCreated(batchId), fromBlock, toBlock);
        logs.push(...bc);
      } catch {}
      // CollectionAdded (indexed farmerBatchId)
      try {
        const ca = await this.contractRO.queryFilter(this.contractRO.filters.CollectionAdded(batchId), fromBlock, toBlock);
        logs.push(...ca);
      } catch {}
      // InspectionAdded (not indexed) -> read via mapping
      try {
        const insp = await this.getInspection(batchId);
        if (insp && insp[4] && BigInt(insp[4]) > 0n) {
          logs.push({
            blockNumber: 0,
            args: {
              batchId,
              inspectorId: insp[1],
              result: insp[2],
              notes: insp[3],
              date: insp[4]
            },
            fragment: { name: 'InspectionAdded' }
          });
        }
      } catch {}
      // ProductCreated: productId indexed; sourceBatchId not indexed, so we scan then filter
      try {
        const pcLogs = await this.contractRO.queryFilter(this.contractRO.filters.ProductCreated(null, null, null, null), fromBlock, toBlock);
        for (const l of pcLogs) {
          // read product to match sourceBatchId
          const product = await this.getProduct(l.args.productId);
          if (product && product.sourceBatchId === batchId) logs.push(l);
        }
      } catch {}
      // ProductReceived / Dispatched (indexed batchId)
      try {
        const pr = await this.contractRO.queryFilter(this.contractRO.filters.ProductReceived(batchId), fromBlock, toBlock);
        logs.push(...pr);
      } catch {}
      try {
        const pd = await this.contractRO.queryFilter(this.contractRO.filters.ProductDispatched(batchId), fromBlock, toBlock);
        logs.push(...pd);
      } catch {}

      // Sort by blockNumber where available; synthetic logs (inspection) get blockNumber 0 and will appear first
      logs.sort((a, b) => (Number(a.blockNumber || 0) - Number(b.blockNumber || 0)));
      return logs;
    }
  };

  window.Blockchain = Blockchain;
})();
