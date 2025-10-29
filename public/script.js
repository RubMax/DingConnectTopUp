async function fetchJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function init() {
  const countrySelect = document.getElementById('country');
  const providerSelect = document.getElementById('provider');
  const productSelect = document.getElementById('product');

  const countries = ['BR', 'US', 'MX', 'AR'];
  countries.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    countrySelect.appendChild(o);
  });

  countrySelect.addEventListener('change', loadProducts);
  document.getElementById('estimateBtn').addEventListener('click', estimatePrice);
  document.getElementById('payBtn').addEventListener('click', sendRecharge);

  await loadProducts();
}

async function loadProducts() {
  const country = document.getElementById('country').value || 'BR';
  try {
    const data = await fetchJSON(`/api/products?country=${country}`);
    const productSelect = document.getElementById('product');
    const providerSelect = document.getElementById('provider');
    productSelect.innerHTML = '';
    providerSelect.innerHTML = '';

    const providers = new Set();
    (data || []).forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.SkuCode;
      opt.textContent = `${p.Provider?.Name || p.ProviderName || 'Produit'} - ${p.Value || p.DisplayText || ''}`;
      productSelect.appendChild(opt);
      if (p.Provider?.Name) providers.add(p.Provider.Name);
    });

    providers.forEach(name => {
      const o = document.createElement('option');
      o.value = name;
      o.textContent = name;
      providerSelect.appendChild(o);
    });

  } catch (err) {
    console.error(err);
    alert('❌ Erreur lors du chargement des produits : ' + err.message);
  }
}

async function estimatePrice() {
  try {
    const product = document.getElementById('product').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const payload = { productSku: product, accountNumber };
    const r = await fetch('/api/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    document.getElementById('estimateResult').textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById('estimateResult').textContent = 'Erreur : ' + err.message;
  }
}

async function sendRecharge() {
  try {
    const product = document.getElementById('product').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const payload = { productSku: product, accountNumber, senderNote: 'Recharge test' };
    const r = await fetch('/api/recharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    document.getElementById('sendResult').textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById('sendResult').textContent = 'Erreur : ' + err.message;
  }
}

window.addEventListener('DOMContentLoaded', init);
