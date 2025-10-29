// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const DING_API_URL = "https://api.dingconnect.com/api/V1";
const DING_API_KEY = process.env.DING_API_KEY; // ajoute ta clé dans Render environment

// Vérification
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Backend connecté à DingConnect ✅" });
});

// Obtenir la liste des produits
app.get("/api/products", async (req, res) => {
  const country = req.query.country || "BR";
  try {
    const response = await fetch(`${DING_API_URL}/GetProducts?countryIsos=${country}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DING_API_KEY}`
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: "Failed to fetch products", details: text });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Erreur GetProducts:", err);
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
});

// Estimation du prix
app.post("/api/estimate", async (req, res) => {
  const { productSku, accountNumber } = req.body;
  try {
    const r = await fetch(`${DING_API_URL}/EstimatePrices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DING_API_KEY}`
      },
      body: JSON.stringify({
        SkuCode: productSku,
        AccountNumber: accountNumber
      })
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("Erreur EstimatePrices:", err);
    res.status(500).json({ error: "Failed to estimate", details: err.message });
  }
});

// Envoi d’une recharge
app.post("/api/recharge", async (req, res) => {
  const { productSku, accountNumber, senderNote } = req.body;
  try {
    const r = await fetch(`${DING_API_URL}/SendTransfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DING_API_KEY}`
      },
      body: JSON.stringify({
        SkuCode: productSku,
        AccountNumber: accountNumber,
        SendValue: 10, // Exemple : tu peux rendre cela dynamique
        DistributorRef: "TEST-" + Date.now(),
        SenderSms: senderNote || "Simulação"
      })
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("Erreur SendTransfer:", err);
    res.status(500).json({ error: "Failed to recharge", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend écoute sur le port ${PORT}`));
