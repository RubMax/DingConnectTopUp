# DingConnect TopUp - Deploy sur Render

## Pré-requis
- Compte DingConnect (client credentials ou API key)
- Compte Render
- Repo Git (GitHub/GitLab/Bitbucket)

## Variables d'environnement à configurer sur Render
- DING_CLIENT_ID
- DING_CLIENT_SECRET
- DING_API_KEY (optionnel)
- DING_API_BASE (optionnel, par défaut https://api.dingconnect.com)
- APP_WEBHOOK_SECRET

### Étapes rapides
1. Push ce repo sur GitHub.
2. Sur Render, crée un nouveau **Web Service** (Node) en connectant le repo.
3. Build & Start command: `npm install && npm run start` (ou `npm start`).
4. Configurer les env vars ci‑dessus dans le dashboard Render.
5. Déployer.
6. Dans DingConnect Developer > API Keys, ajoute l'URL publique fournie par Render, par exemple `your-service.onrender.com`, à la liste d'adresses autorisées pour ta clé/API.
7. Tester l'endpoint `/api/products?country=BR` depuis Postman ou curl.

## Webhook
- Pour que les webhooks DingConnect fonctionnent, assure-toi que l'URL fournie à DingConnect pointe vers :
  `https://your-service.onrender.com/webhook/ding`
- Activez les webhooks dans le dashboard DingConnect et configurez la vérification de signature (en production, vérifiez la signature RS256 !)

## Notes importantes
- Render fournit un domaine stable (service-name.onrender.com). Ajoute ce domaine aux hosts autorisés dans DingConnect.
- Si tu utilises IP restrictions et que Render ne peut pas fournir une IP fixe publique, autorise plutôt le nom de domaine dans DingConnect.
- En production, remplace la simulation de paiement par intégration réelle (PIX, Stripe, etc.).
- Implémente la vérification des signatures JWT/JWKS pour les webhooks (omise dans ce modèle minimal).
