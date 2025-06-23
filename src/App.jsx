import React  from 'react'
import { useState } from 'react';
import {ethers} from 'ethers';
import './App.css'


const App = () => {

  const [selectedFile, setSelectedFile] = useState(null);
  const [ipfsHash, setIpfsHash] = useState("");
  const [storedHash, setStoredHash] = useState("");

  
  const contractAddress="0x749e303f7fb224f026f865efae928f9864933fed"
  const contractABI=[
	{
		"inputs": [],
		"name": "getIPFSHash",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_ipfshash",
				"type": "string"
			}
		],
		"name": "setIPFSHash",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]
  

const changeHandler = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmission = async () => {
  if (!selectedFile) {
    console.error("No file selected");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);

    const metadata = JSON.stringify({
      name: selectedFile.name
    });
    formData.append("pinataMetadata", metadata);

    const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}` // Put this in .env file
      }
    });

    if (!pinataRes.ok) {
      const err = await pinataRes.text();
      throw new Error(`Pinata upload failed: ${err}`);
    }

    const result = await pinataRes.json();
    const hash = result.IpfsHash;
    setIpfsHash(hash);

    await storeHashOnBlockchain(hash);
  } catch (error) {
    console.error("Upload failed:", error.message);
  }
};

  const storeHashOnBlockchain = async (hash) => {
    try {
      // Connect to Ethereum provider (MetaMask)
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Create a contract instance
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Send the transaction to store the IPFS hash on the blockchain
      const tx = await contract.setIPFSHash(hash);
      await tx.wait();

      console.log("IPFS hash stored on blockchain:", hash);
    } catch (error) {
      console.log("Failed to store IPFS hash on blockchain:", error);
    }
  };

  const retrieveHashFromBlockchain = async () => {
    try {
      // Connect to Ethereum provider (MetaMask)
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      // Retrieve the IPFS hash from the blockchain
      const retrievedHash = await contract.getIPFSHash();
      setStoredHash(retrievedHash);

      console.log("Retrieved IPFS hash from blockchain:", retrievedHash);
    } catch (error) {
      console.log("Failed to retrieve IPFS hash from blockchain:", error);
    }
  };

  return (
    <div className="app-container"> IPFS STORAGE
    
      <div className="upload-section">
        <label className="form-label">Choose File</label>
        <input type="file" onChange={changeHandler} className="file-input" />
        <button onClick={handleSubmission} className="submit-button">
          Submit
        </button>
      </div>

      {ipfsHash && (
        <div className="result-section">
          <p>
            <strong>IPFS Hash:</strong> {ipfsHash}
          </p>
        </div>
      )}

      <div className="retrieve-section">
        <button onClick={retrieveHashFromBlockchain} className="retrieve-button">
          Retrieve Stored Hash
        </button>
        {storedHash && (
          <p>
            <strong>Stored IPFS Hash:</strong> {storedHash}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
