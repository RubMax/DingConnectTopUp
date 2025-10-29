import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const DING_API_URL = "https://api.dingconnect.com/api/v1";
const API_KEY = process.env.DINGCONNECT_API_KEY;

// 🔐 Authentification de base requise par DingConnect
const headers = {
  "Content-Type": "application/json",
  Authorization: "Basic " + Buffer.from(API_KEY + ":").toString("base64"),
};

// ✅ Route test
app.get("/", (req, res) => res.send("✅ DingConnect API opérationnelle"));

// ✅ Liste des produits d’un pays
app.get("/api/products", async (req, res) => {
  const country = req.query.country || "BR";
  try {
    const response = await fetch(`${DING_API_URL}/GetProducts?countryIso=${country}`, { headers });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    res.json(data.Products || data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Estimation du prix
app.post("/api/estimate", async (req, res) => {
  const { productSku, accountNumber } = req.body;
  try {
    const response = await fetch(`${DING_API_URL}/SendTransfer`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        SkuCode: productSku,
        AccountNumber: accountNumber,
        ValidateOnly: true,
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Envoi réel (Recharge)
app.post("/api/recharge", async (req, res) => {
  const { productSku, accountNumber, senderNote } = req.body;
  try {
    const response = await fetch(`${DING_API_URL}/SendTransfer`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        SkuCode: productSku,
        AccountNumber: accountNumber,
        ValidateOnly: false,
        DistributorRef: "TEST-" + Date.now(),
        Sender: { FirstName: "Demo", LastName: "User" },
        SenderNote: senderNote || "Recharge via Demo",
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("🚀 Serveur sur http://localhost:" + process.env.PORT));
