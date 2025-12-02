require("dotenv").config();
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

async function uploadToIPFS() {
    try {
        const filePath = path.join(__dirname, "../package.json"); 
        const fileStream = fs.createReadStream(filePath);

        const formData = new FormData();
        formData.append("file", fileStream);

        console.log("📤 Uploading file:", filePath);

        const res = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            formData,
            {
                maxBodyLength: Infinity,
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${process.env.PINATA_JWT}`,
                },
            }
        );

        console.log("✅ Upload Successful!");
        console.log("🔗 CID:", res.data.IpfsHash);
        console.log("🌐 Gateway URL:");
        console.log(`https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}\n`);
    } catch (err) {
        console.error("❌ Upload Failed:", err.response?.data || err.message);
    }
}

uploadToIPFS();
