/* global window, ethers */
(function () {
  const cfg = window.AppConfig || window.config || {};

  // Pinata Configuration
  const PINATA_CONFIG = {
    API_KEY: 'f07648ca073181e7b248',
    API_SECRET: 'e63b5163d8617ac63c75a9813d3858e9600c4de7cecf5880ddf57b6d5d5afc2b',
    JWT: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjZDc4NTU2MS02ZWJmLTQxY2ItODM5ZS1lZDllY2MwYWNhYjAiLCJlbWFpbCI6InJhbnZlZXJzaW5naDE4d0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZjA3NjQ4Y2EwNzMxODFlN2IyNDgiLCJzY29wZWRLZXlTZWNyZXQiOiJlNjNiNTE2M2Q4NjE3YWM2M2M3NWE5ODEzZDM4NThlOTYwMGM0ZGU3Y2VjZjU4ODBkZGY1N2I2ZDVkNWFmYzJiIiwiZXhwIjoxNzg5NzkxOTA2fQ.ZBF9b3FcxRBTKdgcPNnk4UdqYAJnm8D3VzRfTcPy2uU',
    GATEWAY: 'https://pink-decisive-woodpecker-623.mypinata.cloud',
    UPLOAD_URL: 'https://api.pinata.cloud/pinning/pinFileToIPFS'
  };

  const Blockchain = {
    provider: null,
    signer: null,
    contractRO: null,
    contractRW: null,
    cache: new Map(), // Add caching for performance
    batchCache: new Map(), // Cache for batch details
    eventCache: new Map(), // Cache for events
    cacheExpiry: 30000, // 30 seconds cache

    // Caching helper methods
    getCacheKey(method, ...args) {
      return `${method}_${args.join('_')}`;
    },

    isCacheValid(timestamp) {
      return Date.now() - timestamp < this.cacheExpiry;
    },

    getCached(key) {
      const cached = this.cache.get(key);
      if (cached && this.isCacheValid(cached.timestamp)) {
        console.log('📋 Cache hit for:', key);
        return cached.data;
      }
      return null;
    },

    setCached(key, data) {
      this.cache.set(key, { data, timestamp: Date.now() });
      // Cleanup old cache entries (keep only last 100)
      if (this.cache.size > 100) {
        const keys = Array.from(this.cache.keys());
        keys.slice(0, keys.length - 100).forEach(k => this.cache.delete(k));
      }
    },

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

    // --- Image Upload to Pinata (OPTIMIZED) ---
    async uploadImageToPinata(imageBlob, metadata = {}) {
      try {
        console.log('📤 Starting Pinata upload...', { size: imageBlob.size, type: imageBlob.type });
        
        // Validate input
        if (!imageBlob || !(imageBlob instanceof Blob)) {
          throw new Error('Invalid image blob provided');
        }

        // Create optimized form data
        const formData = new FormData();
        
        // Add file with optimized name
        const timestamp = Date.now();
        const fileName = `ayurtrace_${timestamp}.${imageBlob.type.split('/')[1] || 'jpg'}`;
        formData.append('file', imageBlob, fileName);
        
        // Add comprehensive metadata
        const pinataMetadata = {
          name: fileName,
          keyvalues: {
            app: 'AyurTrace',
            uploadedBy: metadata.uploadedBy || 'Farmer',
            timestamp: new Date().toISOString(),
            location: metadata.location || 'Unknown',
            batchId: metadata.batchId || 'Unknown',
            size: imageBlob.size,
            ...metadata
          }
        };
        formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
        
        // Add options for faster processing
        formData.append('pinataOptions', JSON.stringify({
          cidVersion: 1,
          wrapWithDirectory: false
        }));

        // Upload with timeout and retry logic
        const uploadPromise = fetch(PINATA_CONFIG.UPLOAD_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PINATA_CONFIG.JWT}`
          },
          body: formData
        });

        // Add 30-second timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
        );

        const response = await Promise.race([uploadPromise, timeoutPromise]);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Pinata upload successful:', { 
          hash: result.IpfsHash, 
          size: result.PinSize,
          timestamp: result.Timestamp 
        });
        
        // Immediately test the uploaded image
        const imageUrl = this.getImageUrl(result.IpfsHash);
        console.log('🔗 Image URL:', imageUrl);
        
        return result.IpfsHash;
      } catch (error) {
        console.error('❌ Pinata upload error:', error);
        throw new Error(`Image upload failed: ${error.message}`);
      }
    },

    // --- Get Image URL from IPFS Hash ---
    getImageUrl(ipfsHash) {
      if (!ipfsHash) return null;
      // Remove ipfs:// prefix if present
      const hash = ipfsHash.replace('ipfs://', '');
      return `${PINATA_CONFIG.GATEWAY}/ipfs/${hash}`;
    },

    // --- Fetch Image with Authentication ---
    async fetchImageWithAuth(ipfsHash) {
      try {
        const imageUrl = this.getImageUrl(ipfsHash);
        if (!imageUrl) return null;

        const response = await fetch(imageUrl, {
          headers: {
            'x-pinata-gateway-token': PINATA_CONFIG.JWT
          }
        });

        if (!response.ok) {
          console.warn(`Failed to fetch image from Pinata: ${response.status}`);
          return null;
        }

        return response.blob();
      } catch (error) {
        console.error('Error fetching image from Pinata:', error);
        return null;
      }
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
          return this.getImageUrl(meta.ipfs);
        }
      } catch {}
      // fallback: use stored mapping from photoHash -> ipfs hash if available
      try {
        if (args.photoHash) {
          const original = this.getOriginalIPFSHash(args.photoHash);
          if (original) return this.getImageUrl(original);
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

      // Try to attach user name/username from Supabase session and use V2
      const session = (await (window.getCurrentUser ? window.getCurrentUser() : Promise.resolve(null))) || null;
      const farmerName = session?.name || session?.actorId || '';
      const farmerUsername = session?.actorId || ''; // Always use actorId as username

      console.log('🌾 Creating batch with farmer details:', { farmerName, farmerUsername, batchId });

      // Ensure user profile is set up first (this is crucial for indexing)
      if (farmerUsername && c.setProfile) {
        try {
          console.log('👤 Setting up user profile...');
          const role = 1; // Role.Farmer enum value
          const profileTx = await c.setProfile(farmerName, farmerUsername, role);
          await profileTx.wait();
          console.log('✅ User profile set successfully');
        } catch (profileError) {
          console.warn('⚠️ Profile setup failed (may already exist):', profileError.message);
        }
      }

      if (c.createBatchV2) {
        console.log('📦 Using createBatchV2 with farmer details...');
        const tx = await c.createBatchV2(batchId, cropType, BigInt(quantity), harvestDate, farmLocation, hash, farmerName, farmerUsername);
        const receipt = await tx.wait();
        console.log('✅ Batch created with V2, clearing caches...');
        
        // Clear caches to ensure fresh data
        this.cache.clear();
        this.batchCache.clear();
        this.eventCache.clear();
        
        return receipt;
      }

      // Fallback to legacy
      console.log('📦 Using legacy createBatch...');
      const tx = await c.createBatch(batchId, cropType, BigInt(quantity), harvestDate, farmLocation, hash);
      const receipt = await tx.wait();
      
      // Clear caches to ensure fresh data
      this.cache.clear();
      this.batchCache.clear();
      this.eventCache.clear();
      
      return receipt;
    },
    async getBatchDetails(batchId) {
      // Check cache first for performance
      const cacheKey = `batch_${batchId}`;
      if (this.batchCache.has(cacheKey)) {
        return this.batchCache.get(cacheKey);
      }
      
      console.log(`📋 Getting batch details for: ${batchId}`);
      let result;
      try {
        if (this.contractRO.getBatchDetailsV2) {
          console.log('📋 Using getBatchDetailsV2');
          result = await this.contractRO.getBatchDetailsV2(batchId);
        } else {
          console.log('📋 Using getBatchDetails');
          result = await this.contractRO.getBatchDetails(batchId);
        }
        
        console.log('📋 Raw batch result:', result);
        
        // Check if batch exists (batchId should not be empty)
        if (!result || (Array.isArray(result) && result[0] === '') || (!Array.isArray(result) && result.batchId === '')) {
          console.log('📋 Batch does not exist (empty batchId)');
          return null;
        }
        
        // Cache the result for 5 minutes
        this.batchCache.set(cacheKey, result);
        setTimeout(() => this.batchCache.delete(cacheKey), 5 * 60 * 1000);
        
        console.log('📋 Batch exists and cached');
        return result;
      } catch (error) {
        console.error(`📋 Error getting batch details for ${batchId}:`, error);
        throw error;
      }
    },

    // Debug function to check what batches exist
    async debugListAllBatches() {
      try {
        console.log('🔍 Searching for all BatchCreated events...');
        
        // Try BatchCreatedV2 first, then fallback to BatchCreated
        let logs = [];
        if (this.contractRO.filters.BatchCreatedV2) {
          logs = await this.contractRO.queryFilter(this.contractRO.filters.BatchCreatedV2(), 0, 'latest');
          console.log(`Found ${logs.length} BatchCreatedV2 events`);
        }
        
        if (logs.length === 0) {
          logs = await this.contractRO.queryFilter(this.contractRO.filters.BatchCreated(), 0, 'latest');
          console.log(`Found ${logs.length} BatchCreated events`);
        }
        
        const batchIds = logs.map(log => log.args.batchId).filter(id => id);
        console.log('📦 Found batch IDs:', batchIds);
        return batchIds;
      } catch (error) {
        console.error('Error listing batches:', error);
        return [];
      }
    },

    // Get all batches created by the current farmer
    async getFarmerBatches(fromBlock = 0n, toBlock = 'latest') {
      try {
        const batchCreatedLogs = await this.contractRO.queryFilter(
          (this.contractRO.filters.BatchCreatedV2 ? this.contractRO.filters.BatchCreatedV2() : this.contractRO.filters.BatchCreated()), 
          fromBlock, 
          toBlock
        );
        
        const batches = [];
        for (const log of batchCreatedLogs) {
          try {
            const batchId = log.args.batchId;
            const batchDetails = await this.getBatchDetails(batchId);
            
            if (batchDetails && (batchDetails[0] || batchDetails.batchId)) { // Check if batch exists
              const bd = batchDetails;
              const asArr = Array.isArray(bd) ? bd : [bd.batchId, bd.cropType, bd.quantity, bd.harvestDate, bd.farmLocation, bd.photoHash, bd.status, bd.owner, bd.timestamp, bd.farmerName, bd.farmerUsername];
              batches.push({
                id: asArr[0],
                cropType: asArr[1] || 'Unknown',
                quantity: asArr[2] ? asArr[2].toString() : '0',
                harvestDate: asArr[3] || '',
                farmLocation: asArr[4] || '',
                farmerName: asArr[9] || '',
                farmerUsername: asArr[10] || '',
                timestamp: log.blockNumber ? new Date().toISOString() : new Date().toISOString(), // temp
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

    // Get batches by specific username from blockchain (NOT browser history)
    async getBatchesByUsername(username) {
      try {
        console.log(`🔍 Searching blockchain for batches by username: ${username}`);
        
        // Search for BatchCreatedV2 events (which have username field)
        let batchLogs = [];
        if (this.contractRO.filters.BatchCreatedV2) {
          batchLogs = await this.contractRO.queryFilter(this.contractRO.filters.BatchCreatedV2(), 0, 'latest');
        } else {
          console.warn('Contract does not support BatchCreatedV2, falling back to BatchCreated');
          batchLogs = await this.contractRO.queryFilter(this.contractRO.filters.BatchCreated(), 0, 'latest');
        }
        
        console.log(`📦 Found ${batchLogs.length} total batch events on blockchain`);
        
        const userBatches = [];
        for (const log of batchLogs) {
          try {
            const batchId = log.args.batchId;
            
            // Get full batch details to check username
            const details = await this.getBatchDetails(batchId);
            if (!details) continue;
            
            const asArr = Array.isArray(details) ? details : [details.batchId, details.cropType, details.quantity, details.harvestDate, details.farmLocation, details.photoHash, details.status, details.owner, details.timestamp, details.farmerName, details.farmerUsername];
            
            // Check if this batch belongs to the user (by username)
            const batchUsername = asArr[10] || ''; // farmerUsername field
            if (batchUsername === username) {
              userBatches.push({
                id: asArr[0],
                cropType: asArr[1] || 'Unknown',
                quantity: asArr[2] ? asArr[2].toString() : '0',
                harvestDate: asArr[3] || '',
                farmLocation: asArr[4] || '',
                farmerName: asArr[9] || '',
                farmerUsername: asArr[10] || '',
                timestamp: new Date().toISOString(), // We'll get this from block later
                status: 'Created',
                blockNumber: log.blockNumber
              });
            }
          } catch (err) {
            console.warn(`Failed to process batch ${log.args.batchId}:`, err);
          }
        }
        
        console.log(`📊 Found ${userBatches.length} batches for username: ${username}`);
        
        // Sort by block number (newest first)
        return userBatches.sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));
      } catch (error) {
        console.error('Error fetching batches by username:', error);
        return [];
      }
    },

    // Search for specific batch ID directly in blockchain (for QR code scanning)
    async searchBatchInBlockchain(batchId) {
      try {
        console.log(`🔍 Direct blockchain search for batch: ${batchId}`);
        
        // First check if batch exists
        const details = await this.getBatchDetails(batchId);
        if (!details) {
          console.log('❌ Batch not found in blockchain');
          return null;
        }
        
        // Get the chain/timeline for this batch
        const chain = await this.getChainForBatch(batchId);
        
        const asArr = Array.isArray(details) ? details : [details.batchId, details.cropType, details.quantity, details.harvestDate, details.farmLocation, details.photoHash, details.status, details.owner, details.timestamp, details.farmerName, details.farmerUsername];
        
        return {
          batchId: asArr[0],
          cropType: asArr[1] || 'Unknown',
          quantity: asArr[2] ? asArr[2].toString() : '0',
          harvestDate: asArr[3] || '',
          farmLocation: asArr[4] || '',
          farmerName: asArr[9] || '',
          farmerUsername: asArr[10] || '',
          chain: chain || [],
          found: true
        };
      } catch (error) {
        console.error(`Error searching batch ${batchId}:`, error);
        return null;
      }
    },

    // Search by username/name via contract indexes
    async findBatchesByFarmerUsername(username) {
      if (!this.contractRO.getBatchIdsByFarmerUsername) return [];
      try { return await this.contractRO.getBatchIdsByFarmerUsername(username); } catch { return []; }
    },
    async findBatchesByFarmerName(name) {
      if (!this.contractRO.getBatchIdsByFarmerName) return [];
      try { return await this.contractRO.getBatchIdsByFarmerName(name); } catch { return []; }
    },

    // High-level: fetch batches for a specific username in real time (OPTIMIZED)
    async getBatchesForUsername(username) {
      await this.init();
      
      // If no username provided, try to get from current session
      const actualUsername = username || (await (window.getCurrentActorId ? window.getCurrentActorId() : Promise.resolve('')));
      if (!actualUsername) {
        console.warn('No username available for batch fetch');
        return [];
      }
      
      // Check cache first
      const cacheKey = this.getCacheKey('batches_username', actualUsername);
      const cached = this.getCached(cacheKey);
      if (cached) {
        console.log('📋 Returning cached batches for username:', actualUsername);
        return cached;
      }
      
      console.log('🔍 Fetching batches for username:', actualUsername);
      const startTime = Date.now();
      
      // Debug: Check if user profile exists
      try {
        const profile = await this.contractRO.profiles(this.signer.address);
        console.log('👤 Current user profile:', profile);
        if (!profile.username || profile.username !== actualUsername) {
          console.warn('⚠️ User profile not set or username mismatch:', { 
            profileUsername: profile.username, 
            actualUsername 
          });
        }
      } catch (e) {
        console.warn('⚠️ Could not get user profile:', e.message);
      }
      
      // 1) Get IDs by username (V2 index) - only if function exists
      let ids = [];
      try { 
        if (this.contractRO.getBatchIdsByFarmerUsername) {
          console.log('🔍 Querying getBatchIdsByFarmerUsername for:', actualUsername);
          ids = await this.findBatchesByFarmerUsername(actualUsername); 
          console.log('✅ V2 username index returned:', ids.length, 'batches', ids);
        } else {
          console.warn('⚠️ getBatchIdsByFarmerUsername function not available');
        }
      } catch (e) { 
        console.warn('⚠️ V2 username fetch failed:', e.message);
      }
      
      // 2) Fallback: resolve address then get legacy address-indexed IDs
      if ((!ids || ids.length === 0) && this.contractRO.getAccountByUsername) {
        try {
          const addr = await this.contractRO.getAccountByUsername(actualUsername);
          console.log('📍 Resolved username to address:', addr);
          if (addr && addr !== ethers.ZeroAddress && this.contractRO.getFarmerBatchIds) {
            ids = await this.contractRO.getFarmerBatchIds(addr);
            console.log('✅ Legacy address-based IDs:', ids.length, 'batches');
          }
        } catch (e) {
          console.warn('⚠️ Address resolution failed:', e.message);
        }
      }
      
      if (!ids || ids.length === 0) {
        console.warn('❌ No batch IDs found for username:', actualUsername);
        this.setCached(cacheKey, []);
        return [];
      }

      // 3) Load details for each ID in parallel (OPTIMIZED)
      console.log('⚡ Loading batch details in parallel...');
      const batchPromises = ids.map(async (id) => {
        try {
          // Check individual batch cache
          const batchCacheKey = this.getCacheKey('batch_detail', id);
          const cachedBatch = this.getCached(batchCacheKey);
          if (cachedBatch) {
            return cachedBatch;
          }

          const d = (this.contractRO.getBatchDetailsV2)
            ? await this.contractRO.getBatchDetailsV2(id)
            : await this.contractRO.getBatchDetails(id);
          
          const arr = Array.isArray(d) ? d : [d.batchId, d.cropType, d.quantity, d.harvestDate, d.farmLocation, d.photoHash, d.status, d.owner, d.timestamp, d.farmerName, d.farmerUsername];
          
          const result = {
            id: arr[0],
            cropType: arr[1] || 'Unknown',
            quantity: arr[2] ? String(arr[2]) : '0',
            harvestDate: arr[3] || '',
            farmLocation: arr[4] || '',
            photoHash: arr[5],
            status: 'Created',
            timestamp: Number(arr[8] || Date.now()),
            farmerName: arr[9] || '',
            farmerUsername: arr[10] || ''
          };

          // Cache individual batch
          this.setCached(batchCacheKey, result);
          return result;
        } catch (e) {
          console.warn('⚠️ Failed to load batch', id, e.message);
          return null;
        }
      });

      // Wait for all batches to load
      const results = (await Promise.all(batchPromises)).filter(Boolean);
      
      const endTime = Date.now();
      console.log(`⚡ Loaded ${results.length} batches in ${endTime - startTime}ms`);
      
      // Cache the final results
      this.setCached(cacheKey, results);
      return results;
    },

    // --- Collector ---
    async addCollection({ farmerBatchId, farmerId, cropName, quantity, collectorId }) {
      const c = this.requireSigner();
      // Use current actorId as collectorId if not provided
      const actualCollectorId = collectorId || (await (window.getCurrentActorId ? window.getCurrentActorId() : Promise.resolve(''))) || 'unknown';
      const tx = await c.addCollection(farmerBatchId, farmerId, cropName, BigInt(quantity), actualCollectorId);
      return await tx.wait();
    },
    async getCollection(farmerBatchId) {
      return await this.contractRO.getCollection(farmerBatchId);
    },

    // --- Auditor ---
    async addInspection({ batchId, inspectorId, result, notes }) {
      const c = this.requireSigner();
      // Use current actorId as inspectorId if not provided
      const actualInspectorId = inspectorId || (await (window.getCurrentActorId ? window.getCurrentActorId() : Promise.resolve(''))) || 'unknown';
      const tx = await c.addInspection(batchId, actualInspectorId, result, notes);
      return await tx.wait();
    },
    async getInspection(batchId) {
      return await this.contractRO.getInspection(batchId);
    },

    // --- Manufacturer ---
    async createProduct({ productId, sourceBatchId, productType, quantityProcessed, wastage, processingDate, expiryDate, manufacturerId }) {
      const c = this.requireSigner();
      // Use current actorId as manufacturerId if not provided
      const actualManufacturerId = manufacturerId || (await (window.getCurrentActorId ? window.getCurrentActorId() : Promise.resolve(''))) || 'unknown';
      const tx = await c.createProduct(
        productId,
        sourceBatchId,
        productType,
        BigInt(quantityProcessed),
        BigInt(wastage),
        BigInt(processingDate),
        BigInt(expiryDate),
        actualManufacturerId
      );
      return await tx.wait();
    },
    async getProduct(productId) {
      return await this.contractRO.products(productId);
    },

    // Set manufacturer profile
    async setManufacturerProfile(name, username) {
      const c = this.requireSigner();
      try {
        console.log('👤 Setting manufacturer profile:', { name, username });
        const tx = await c.setManufacturerProfile(name, username);
        const receipt = await tx.wait();
        console.log('✅ Manufacturer profile set successfully');
        return receipt;
      } catch (error) {
        console.error('❌ Error setting manufacturer profile:', error);
        throw error;
      }
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
      console.log(`🔍 Searching for batch: ${batchId}`);
      const logs = [];

      try {
        // First, check if batch exists using getBatchDetails
        console.log('📋 Checking if batch exists...');
        let batchExists = false;
        try {
          const details = await this.getBatchDetails(batchId);
          console.log('📋 Batch details:', details);
          // getBatchDetails returns null when not found; otherwise tuple/struct
          if (details) {
            // If array tuple, ensure first element (batchId) is non-empty
            if (Array.isArray(details)) {
              batchExists = Boolean(details[0] && String(details[0]).length > 0);
            } else {
              batchExists = Boolean(details.batchId && details.batchId !== '');
            }
          }
          if (batchExists) console.log('✅ Batch exists in contract');
        } catch (err) {
          console.log('❌ Batch does not exist or error getting details:', err.message);
        }

        if (!batchExists) {
          console.log('🚫 Batch not found, returning empty logs');
          return [];
        }

        // Use multicall pattern - batch all queries
        const queryPromises = [
          // BatchCreated query
          this.contractRO.queryFilter((this.contractRO.filters.BatchCreatedV2 ? this.contractRO.filters.BatchCreatedV2(batchId) : this.contractRO.filters.BatchCreated(batchId)), fromBlock, toBlock)
            .then(async (bc) => {
              console.log(`📦 BatchCreated events found: ${bc.length}`);
              if (bc.length > 0) {
                const detailsRaw = await this.getBatchDetails(batchId);
                const statusNames = ['Pending', 'InTransit', 'Delivered', 'Processing'];
                const asArr = Array.isArray(detailsRaw) ? detailsRaw : [detailsRaw.batchId, detailsRaw.cropType, detailsRaw.quantity, detailsRaw.harvestDate, detailsRaw.farmLocation, detailsRaw.photoHash, detailsRaw.status, detailsRaw.owner, detailsRaw.timestamp, detailsRaw.farmerName, detailsRaw.farmerUsername];
                return {
                  blockNumber: bc[0].blockNumber,
                  fragment: { name: (this.contractRO.filters.BatchCreatedV2 ? 'BatchCreatedV2' : 'BatchCreated') },
                  args: {
                    batchId: asArr[0],
                    cropType: asArr[1],
                    quantity: asArr[2],
                    harvestDate: asArr[3],
                    farmLocation: asArr[4],
                    photoHash: asArr[5],
                    status: asArr[6],
                    owner: asArr[7],
                    timestamp: asArr[8],
                    farmerName: asArr[9] || '',
                    farmerUsername: asArr[10] || '',
                    statusText: statusNames[Number(asArr[6] ?? 0)] || 'Unknown'
                  }
                };
              }
              return null;
            }).catch((err) => {
              console.log('❌ Error getting BatchCreated events:', err.message);
              return null;
            }),

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
      // inject as Number to avoid BigInt issues in UIs
      l.args = { ...l.args, timestamp: Number(blockTs[Number(l.blockNumber)]) };
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
      } catch (error) {
        console.error(`Error fetching chain for ${batchId}:`, error);
        throw error;
      }
    },

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
    },

    // User profile management
    async setUserProfile(name, username, role = 1) {
      const c = this.requireSigner();
      if (!c.setProfile) {
        console.warn('setProfile function not available in contract');
        return null;
      }
      
      try {
        console.log('👤 Setting user profile:', { name, username, role });
        const tx = await c.setProfile(name, username, role);
        const receipt = await tx.wait();
        console.log('✅ Profile set successfully');
        return receipt;
      } catch (error) {
        console.error('❌ Error setting profile:', error);
        throw error;
      }
    },

    async getUserProfile(address = null) {
      const targetAddress = address || this.signer?.address;
      if (!targetAddress) {
        throw new Error('No address provided and no signer available');
      }
      
      try {
        const profile = await this.contractRO.profiles(targetAddress);
        return profile;
      } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
      }
    }
  };

  window.Blockchain = Blockchain;
})();
