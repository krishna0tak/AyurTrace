/* global window, ethers */
(function () {
  const cfg = window.AppConfig || window.config || {};

  const Blockchain = {
    provider: null,
    signer: null,
    contractRO: null,
    contractRW: null,
    cache: new Map(), // Add caching for performance
    batchCache: new Map(), // Cache for batch details

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

    // Get IPFS image URL from hash
    getImageFromPinata(ipfsHash) {
      const cfg = window.AppConfig || window.config || {};
      const gateway = cfg.PINATA_GATEWAY || 'https://gateway.pinata.cloud';
      return `${gateway}/ipfs/${ipfsHash}`;
    },

    // Store IPFS hash mapping (for demo - in production, store in contract or database)
    storeIPFSMapping(photoHash, ipfsHash) {
      const mappings = JSON.parse(localStorage.getItem('ipfs_mappings') || '{}');
      mappings[photoHash] = ipfsHash;
      localStorage.setItem('ipfs_mappings', JSON.stringify(mappings));
    },

    // Get original IPFS hash from bytes32 hash
    getOriginalIPFSHash(photoHash) {
      const mappings = JSON.parse(localStorage.getItem('ipfs_mappings') || '{}');
      return mappings[photoHash] || null;
    },
    // Parse farmLocation augmented string like: "Village A ::FARMER=Ramesh ::IPFS=Qm..."
    parseFarmLocationMeta(farmLocationStr) {
      if (!farmLocationStr || typeof farmLocationStr !== 'string') {
        return { base: farmLocationStr || '', farmer: null, ipfs: null };
      }
      let base = farmLocationStr;
      let farmer = null;
      let ipfs = null;
      const parts = farmLocationStr.split('::').map(p => p.trim());
      if (parts.length > 1) {
        base = parts[0].trim();
        for (let i = 1; i < parts.length; i++) {
          const p = parts[i];
          if (p.toUpperCase().startsWith('FARMER=')) {
            farmer = p.substring(7).trim();
          } else if (p.toUpperCase().startsWith('IPFS=')) {
            ipfs = p.substring(5).trim();
          }
        }
      }
      return { base, farmer, ipfs };
    },
    // Build image URL for a BatchCreated args if possible (photoHash mapping or embedded ipfs)
    imageUrlFromArgs(args) {
      // prefer embedded IPFS if present in farmLocation meta
      try {
        const meta = this.parseFarmLocationMeta(args.farmLocation || '');
        if (meta.ipfs) {
          return this.getImageFromPinata(meta.ipfs);
        }
      } catch {}
      // fallback: use stored mapping from photoHash -> ipfs hash if available
      try {
        if (args.photoHash) {
          const original = this.getOriginalIPFSHash(args.photoHash);
          if (original) return this.getImageFromPinata(original);
        }
      } catch {}
      return null;
    },

    // --- Farmer ---
    async createBatch({ batchId, cropType, quantity, harvestDate, farmLocation, photoHash }) {
      const c = this.requireSigner();
      const hash = photoHash && /^0x[0-9a-fA-F]{64}$/.test(photoHash)
        ? photoHash
        : ethers.id(`${batchId}:${Date.now()}`); // placeholder bytes32
      // Let ethers manage nonce to avoid coalesce errors
      const tx = await c.createBatch(batchId, cropType, BigInt(quantity), harvestDate, farmLocation, hash);
      const receipt = await tx.wait();
      return receipt;
    },
    async getBatchDetails(batchId) {
      // Check cache first for performance
      const cacheKey = `batch_${batchId}`;
      if (this.batchCache.has(cacheKey)) {
        return this.batchCache.get(cacheKey);
      }
      
      const result = await this.contractRO.getBatchDetails(batchId);
      
      // Cache the result for 5 minutes
      this.batchCache.set(cacheKey, result);
      setTimeout(() => this.batchCache.delete(cacheKey), 5 * 60 * 1000);
      
      return result;
    },

    // Get all batches created by the current farmer
    async getFarmerBatches(fromBlock = 0n, toBlock = 'latest') {
      try {
        const batchCreatedLogs = await this.contractRO.queryFilter(
          this.contractRO.filters.BatchCreated(), 
          fromBlock, 
          toBlock
        );
        
        const batches = [];
        for (const log of batchCreatedLogs) {
          try {
            const batchId = log.args.batchId;
            const batchDetails = await this.getBatchDetails(batchId);
            
            if (batchDetails && batchDetails[0]) { // Check if batch exists
              batches.push({
                id: batchId,
                cropType: batchDetails[1] || 'Unknown',
                quantity: batchDetails[2] ? batchDetails[2].toString() : '0',
                harvestDate: batchDetails[3] || '',
                farmLocation: batchDetails[4] || '',
                timestamp: log.blockNumber ? new Date().toISOString() : new Date().toISOString(), // For now, use current time
                status: 'Created',
                blockNumber: log.blockNumber
              });
            }
          } catch (err) {
            console.warn(`Failed to get details for batch ${log.args.batchId}:`, err);
          }
        }
        
        // Sort by block number (newest first)
        return batches.sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));
      } catch (error) {
        console.error('Error fetching farmer batches:', error);
        return [];
      }
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
    // --- Events & Chain (Optimized with Caching) ---
    async getChainForBatch(batchId, fromBlock = 0n, toBlock = 'latest') {
      // Check cache first
      const cacheKey = `chain_${batchId}_${fromBlock}_${toBlock}`;
      if (this.cache.has(cacheKey)) {
        console.log('Using cached chain data for', batchId);
        return this.cache.get(cacheKey);
      }

      console.time(`Fetching chain for ${batchId}`);
      const logs = [];

      // Use multicall pattern - batch all queries
      const queryPromises = [
        // BatchCreated query
        this.contractRO.queryFilter(this.contractRO.filters.BatchCreated(batchId), fromBlock, toBlock)
          .then(async (bc) => {
            if (bc.length > 0) {
              const detailsRaw = await this.getBatchDetails(batchId);
              const statusNames = ['Pending', 'InTransit', 'Delivered', 'Processing'];
              return {
                blockNumber: bc[0].blockNumber,
                fragment: { name: 'BatchCreated' },
                args: {
                  batchId: detailsRaw.batchId ?? detailsRaw[0],
                  cropType: detailsRaw.cropType ?? detailsRaw[1],
                  quantity: detailsRaw.quantity ?? detailsRaw[2],
                  harvestDate: detailsRaw.harvestDate ?? detailsRaw[3],
                  farmLocation: detailsRaw.farmLocation ?? detailsRaw[4],
                  photoHash: detailsRaw.photoHash ?? detailsRaw[5],
                  status: detailsRaw.status ?? detailsRaw[6],
                  owner: detailsRaw.owner ?? detailsRaw[7],
                  timestamp: detailsRaw.timestamp ?? detailsRaw[8],
                  statusText: statusNames[Number(detailsRaw.status ?? 0)] || 'Unknown'
                }
              };
            }
            return null;
          }).catch(() => null),

        // Collection query
        this.contractRO.queryFilter(this.contractRO.filters.CollectionAdded(batchId), fromBlock, toBlock)
          .then(async (ca) => {
            if (ca.length > 0) {
              const colRaw = await this.getCollection(batchId);
              return {
                blockNumber: ca[0].blockNumber,
                fragment: { name: 'CollectionAdded' },
                args: {
                  farmerBatchId: colRaw[0],
                  farmerId: colRaw[1],
                  cropName: colRaw[2],
                  quantity: colRaw[3],
                  collectorId: colRaw[4],
                  collectionDate: colRaw[5],
                  status: colRaw[6]
                }
              };
            }
            return null;
          }).catch(() => null),

        // Inspection query
        this.getInspection(batchId)
          .then((insp) => {
            if (insp && insp[4] && BigInt(insp[4]) > 0n) {
              return {
                blockNumber: 0,
                args: { batchId, inspectorId: insp[1], result: insp[2], notes: insp[3], date: insp[4] },
                fragment: { name: 'InspectionAdded' }
              };
            }
            return null;
          }).catch(() => null)
      ];

      // Execute main queries in parallel
      const [batchResult, collectionResult, inspectionResult] = await Promise.all(queryPromises);
      
      // Add valid results
      [batchResult, collectionResult, inspectionResult].forEach(result => {
        if (result) logs.push(result);
      });

      // Handle product events with reduced scope
      try {
        const productLogs = await this.contractRO.queryFilter(
          this.contractRO.filters.ProductCreated(), 
          Math.max(fromBlock, 'latest' === toBlock ? 0n : toBlock - 1000n), // Limit range
          toBlock
        );
        
        // Process only relevant products in parallel
        const relevantProducts = await Promise.all(
          productLogs.slice(0, 10).map(async (l) => { // Limit to 10 recent products
            try {
              const product = await this.getProduct(l.args.productId);
              if (product && product.sourceBatchId === batchId) {
                return {
                  blockNumber: l.blockNumber,
                  fragment: { name: 'ProductCreated' },
                  args: {
                    productId: product[0],
                    sourceBatchId: product[1],
                    productType: product[2],
                    quantityProcessed: product[3],
                    wastage: product[4],
                    processingDate: product[5],
                    expiryDate: product[6],
                    manufacturerId: product[7]
                  }
                };
              }
            } catch {}
            return null;
          })
        );
        
        relevantProducts.forEach(p => p && logs.push(p));
      } catch (e) {
        console.warn('Product query failed:', e);
      }

      // Reception/Dispatch in parallel
      try {
        const [prLogs, pdLogs] = await Promise.all([
          this.contractRO.queryFilter(this.contractRO.filters.ProductReceived(batchId), fromBlock, toBlock),
          this.contractRO.queryFilter(this.contractRO.filters.ProductDispatched(batchId), fromBlock, toBlock)
        ]);
        
        logs.push(...prLogs.map(l => ({ ...l, fragment: { name: 'ProductReceived' } })));
        logs.push(...pdLogs.map(l => ({ ...l, fragment: { name: 'ProductDispatched' } })));
      } catch {}

      // Optimized timestamp enrichment
      const uniqueBlocks = [...new Set(logs.filter(l => l.blockNumber > 0).map(l => Number(l.blockNumber)))];
      if (uniqueBlocks.length > 0) {
        const blockPromises = uniqueBlocks.slice(0, 20).map(bn => // Limit to 20 blocks
          this.provider.getBlock(bn).then(blk => ({ bn, timestamp: blk?.timestamp })).catch(() => ({ bn, timestamp: null }))
        );
        
        const blockResults = await Promise.all(blockPromises);
        const blockTs = Object.fromEntries(blockResults.filter(r => r.timestamp).map(r => [r.bn, r.timestamp]));

        logs.forEach(l => {
          if (!l.args) return;
          const hasTs = ['timestamp', 'collectionDate', 'date', 'processingDate'].some(field => l.args[field] !== undefined);
          if (!hasTs && l.blockNumber && blockTs[Number(l.blockNumber)]) {
            l.args = { ...l.args, timestamp: BigInt(blockTs[Number(l.blockNumber)]) };
          }
        });
      }

      logs.sort((a, b) => (Number(a.blockNumber || 0) - Number(b.blockNumber || 0)));
      
      // Cache result for 2 minutes
      this.cache.set(cacheKey, logs);
      setTimeout(() => this.cache.delete(cacheKey), 2 * 60 * 1000);
      
      console.timeEnd(`Fetching chain for ${batchId}`);
      console.log(`Found ${logs.length} events for batch ${batchId}`);
      
      return logs;
    }
    ,

    // --- Lightweight off-chain metadata helpers (for names & extras) ---
    storeBatchMeta(batchId, meta) {
      try {
        const key = 'batch_meta';
        const all = JSON.parse(localStorage.getItem(key) || '{}');
        all[batchId] = { ...(all[batchId] || {}), ...meta };
        localStorage.setItem(key, JSON.stringify(all));
      } catch {}
    },
    getBatchMeta(batchId) {
      try {
        const all = JSON.parse(localStorage.getItem('batch_meta') || '{}');
        return all[batchId] || null;
      } catch { return null; }
    }
  };

  window.Blockchain = Blockchain;
})();
