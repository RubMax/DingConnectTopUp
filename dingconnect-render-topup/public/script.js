// script.js - minimal demo front-end
async function fetchJSON(url, opts){
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function init(){
  // populate country (simple list)
  const countrySelect = document.getElementById('country');
  const providerSelect = document.getElementById('provider');
  const productSelect = document.getElementById('product');

  // minimal countries list (could be dynamic)
  const countries = ['BR','US','MX','AR'];
  countries.forEach(c => { const o = document.createElement('option'); o.value=c; o.textContent=c; countrySelect.appendChild(o); });

  countrySelect.addEventListener('change', loadProducts);
  providerSelect.addEventListener('change', loadProductsForProvider);

  document.getElementById('estimateBtn').addEventListener('click', estimatePrice);
  document.getElementById('payBtn').addEventListener('click', sendRecharge);

  await loadProducts();
}

async function loadProducts(){
  const country = document.getElementById('country').value || 'BR';
  try{
    const data = await fetchJSON(`/api/products?country=${country}`);
    // data structure depends on Ding; adapt keys
    const productSelect = document.getElementById('product');
    const providerSelect = document.getElementById('provider');
    productSelect.innerHTML = '';
    providerSelect.innerHTML = '';

    // naive parsing: assume data is array of products
    const providers = new Set();
    if (Array.isArray(data)){
      data.forEach(p => {
        // p.SkuCode, p.ProviderName, p.DisplayName, p.Value
        const opt = document.createElement('option');
        opt.value = p.SkuCode || p.ProductCode || JSON.stringify(p);
        opt.textContent = (p.DisplayName || p.Name || p.Value) + (p.Price ? ` - ${p.Price}` : '');
        productSelect.appendChild(opt);
        if (p.ProviderName) providers.add(p.ProviderName);
      });
    } else if (data.items) {
      data.items.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.SkuCode || p.ProductCode;
        opt.textContent = p.DisplayName || p.Name || p.Value;
        productSelect.appendChild(opt);
        if (p.ProviderName) providers.add(p.ProviderName);
      });
    }

    providers.forEach(name => { const o = document.createElement('option'); o.value = name; o.textContent = name; document.getElementById('provider').appendChild(o); });
  } catch(err){
    console.error(err);
    alert('Erro ao carregar produtos: ' + err.message);
  }
}

async function loadProductsForProvider(){
  // in a real app, call API with provider filter; here we keep it simple
}

async function estimatePrice(){
  try{
    const product = document.getElementById('product').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const payload = { productSku: product, accountNumber };

    const r = await fetch('/api/estimate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const data = await r.json();
    document.getElementById('estimateResult').textContent = JSON.stringify(data);
  } catch(err){
    console.error(err);
    document.getElementById('estimateResult').textContent = 'Erro: ' + err.message;
  }
}

async function sendRecharge(){
  try{
    const product = document.getElementById('product').value;
    const accountNumber = document.getElementById('accountNumber').value;
    // Simuler paiement: ici on simule paiement réussi, ensuite on appelle /api/recharge
    const payload = { productSku: product, accountNumber, senderNote: 'Pagamento simulado' };
    const r = await fetch('/api/recharge', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const data = await r.json();
    document.getElementById('sendResult').textContent = JSON.stringify(data);
  } catch(err){
    console.error(err);
    document.getElementById('sendResult').textContent = 'Erro: ' + err.message;
  }
}

window.addEventListener('DOMContentLoaded', init);
