# AyurTrace 🌿

> A blockchain-based traceability platform to ensure the authenticity and purity of Ayurvedic products from farm to consumer.

## The Problem
The Ayurvedic market is flooded with counterfeit and adulterated products, which harms consumer health, damages brand reputation, and prevents farmers from getting fair prices for authentic herbs. There is no transparent way for a consumer to verify a product's origin and journey.

## Our Solution
**AyurTrace** uses a blockchain ledger and QR codes to create a transparent, immutable record of an Ayurvedic product's entire supply chain. By scanning a simple QR code, anyone can see the complete "farm-to-shelf" story, verifying its authenticity and quality at every step.

---

### Project Status: Core Functionality Complete
The core functionality of the AyurTrace platform is complete. All major features for a full end-to-end traceability cycle have been implemented and tested on a local blockchain network.

**Implemented Features:**
- [x] **Full Supply Chain Tracking:** Registration, ownership transfer, and status updates for all stakeholders (Farmer, Collector, Auditor, Manufacturer).
- [x] **Blockchain Integration:** All transactions are successfully recorded on a local **Ganache** blockchain.
- [x] **Auditor Verification:** Certified labs can link test reports to a batch's digital token.
- [x] **QR Code System:** QR codes are generated and can be used to track the product's journey.
- [x] **Consumer Verification Portal:** A functional web interface for consumers to scan a code and view the product's history.

---

### Final Steps: Roadmap
We are now in the final phase of the project, focusing on deployment and refinement.

- [ ] **Deployment to Polygon:** Migrating smart contracts from the local Ganache environment to the **Polygon Testnet**.
- [ ] **Final UI/UX Polish:** Refining the user interface for a seamless experience.
- [ ] **Extensive End-to-End Testing:** Conducting final tests on the live testnet to ensure stability.

---

### Technology Stack

* **Frontend (User Interface):**
    * **HTML5, CSS3, & JavaScript:** To build the interactive and responsive web application.

* **Backend (Server-Side):**
    * **JavaScript (with Node.js/Express.js):** Used to build our server and handle API requests.

* **Smart Contracts:**
    * **Solidity:** To write the core logic for product traceability on the blockchain.

* **Deployment & Blockchain Interaction:**
    * **Python (with Web3.py):** For deploying the smart contracts and interacting with the blockchain.

* **Local Blockchain Environment:**
    * **Ganache:** For local development and rapid testing of smart contracts.

---

### How to Run/Test the Prototype Locally
1.  **Prerequisites:** Make sure you have Node.js, npm, Python, pip, and Ganache installed.
2.  **Setup Ganache:** Open Ganache and start a new workspace.
3.  **Clone the repository:** `git clone [Your Repository URL]`
4.  **Install Backend Dependencies:** `cd [your-repo-folder] && npm install`
5.  **Install Python Dependencies:** `pip install -r requirements.txt` (Make sure you have a `requirements.txt` file with `web3`).
6.  **Deploy Contracts:** Run your Python deployment script: `python deploy.py`
7.  **Run the application:** `npm start`
