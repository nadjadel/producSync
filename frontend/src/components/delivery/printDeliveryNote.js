/**
 * Ouvre une fenêtre d'impression formatée comme un bon de livraison professionnel.
 * L'utilisateur peut ensuite "Enregistrer en PDF" depuis la boîte de dialogue d'impression.
 */
export function printDeliveryNote(deliveryNote, customer, products = []) {
  const items = deliveryNote.items || [];

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const formatPrice = (val) =>
    val != null ? Number(val).toFixed(2) + ' €' : '—';

  const totalQty = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

  const customerAddr = deliveryNote.delivery_address
    ? deliveryNote.delivery_address.replace(/\n/g, '<br>')
    : (customer
        ? [customer.address, [customer.postal_code, customer.city].filter(Boolean).join(' '), customer.country].filter(Boolean).join('<br>')
        : '—');

  const itemsRows = items.map((item, idx) => {
    // Référence : priorité au champ stocké, sinon lookup dans products
    const ref = item.product_reference
      || products.find(p => (p._id || p.id) === item.product_id)?.reference
      || '—';
    return `
    <tr>
      <td>${idx + 1}</td>
      <td>${item.order_number || '—'}</td>
      <td><strong>${item.product_name || '—'}</strong></td>
      <td>${ref}</td>
      <td class="center">${item.quantity ?? '—'}</td>
      <td class="right">${formatPrice(item.unit_price)}</td>
    </tr>
  `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>BL ${deliveryNote.delivery_number || ''}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      color: #1a1a1a;
      background: white;
      padding: 20mm 15mm;
    }

    /* ─── En-tête ─── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10mm;
      padding-bottom: 6mm;
      border-bottom: 2px solid #1e293b;
    }
    .company-name {
      font-size: 22pt;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: -0.5px;
    }
    .company-sub {
      font-size: 9pt;
      color: #64748b;
      margin-top: 2px;
    }
    .doc-title {
      text-align: right;
    }
    .doc-title h1 {
      font-size: 20pt;
      font-weight: 700;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .doc-number {
      font-size: 13pt;
      font-weight: 600;
      color: #0f172a;
      margin-top: 3px;
    }
    .doc-date {
      font-size: 9pt;
      color: #64748b;
      margin-top: 2px;
    }

    /* ─── Bloc client / livraison ─── */
    .info-row {
      display: flex;
      gap: 10mm;
      margin-bottom: 8mm;
    }
    .info-box {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 5mm 6mm;
    }
    .info-box h3 {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-bottom: 3mm;
    }
    .info-box p {
      font-size: 10.5pt;
      line-height: 1.55;
      color: #1e293b;
    }
    .info-box .company {
      font-size: 12pt;
      font-weight: 700;
    }

    /* ─── Tableau articles ─── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8mm;
      font-size: 10pt;
    }
    thead tr {
      background: #1e293b;
      color: white;
    }
    thead th {
      padding: 3mm 4mm;
      text-align: left;
      font-weight: 600;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    thead th.center { text-align: center; }
    thead th.right  { text-align: right; }
    tbody tr { border-bottom: 1px solid #e2e8f0; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td {
      padding: 3mm 4mm;
      color: #334155;
      vertical-align: middle;
    }
    tbody td.center { text-align: center; }
    tbody td.right  { text-align: right; }
    tfoot tr { background: #f1f5f9; border-top: 2px solid #1e293b; }
    tfoot td {
      padding: 3mm 4mm;
      font-weight: 700;
      font-size: 10.5pt;
      color: #0f172a;
    }
    tfoot td.right { text-align: right; }

    /* ─── Notes ─── */
    .notes-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 4mm 6mm;
      margin-bottom: 8mm;
      font-size: 10pt;
      color: #92400e;
    }
    .notes-box h3 {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #b45309;
      margin-bottom: 2mm;
    }

    /* ─── Signatures ─── */
    .signatures {
      display: flex;
      gap: 10mm;
      margin-top: 10mm;
    }
    .sig-box {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 4mm 5mm;
      min-height: 25mm;
    }
    .sig-box p {
      font-size: 8.5pt;
      color: #64748b;
      margin-bottom: 2mm;
    }

    /* ─── Pied de page ─── */
    .footer {
      margin-top: 10mm;
      padding-top: 4mm;
      border-top: 1px solid #e2e8f0;
      font-size: 8pt;
      color: #94a3b8;
      text-align: center;
    }

    @media print {
      body { padding: 10mm; }
      @page { margin: 10mm; size: A4; }
    }
  </style>
</head>
<body>

  <!-- En-tête -->
  <div class="header">
    <div>
      <div class="company-name">ProducSync</div>
      <div class="company-sub">Gestion de production</div>
    </div>
    <div class="doc-title">
      <h1>Bon de livraison</h1>
      <div class="doc-number">${deliveryNote.delivery_number || '—'}</div>
      <div class="doc-date">Date de livraison : ${formatDate(deliveryNote.delivery_date)}</div>
      <div class="doc-date">Émis le : ${formatDate(new Date().toISOString())}</div>
    </div>
  </div>

  <!-- Infos client / livraison -->
  <div class="info-row">
    <div class="info-box">
      <h3>Client</h3>
      <p class="company">${deliveryNote.customer_name || customer?.company_name || '—'}</p>
      ${customer?.contact_name ? `<p>${customer.contact_name}</p>` : ''}
      ${customer?.email ? `<p>${customer.email}</p>` : ''}
      ${customer?.phone ? `<p>${customer.phone}</p>` : ''}
    </div>
    <div class="info-box">
      <h3>Adresse de livraison</h3>
      <p>${customerAddr}</p>
    </div>
    <div class="info-box">
      <h3>Détails</h3>
      <p><strong>Statut :</strong> ${
        deliveryNote.status === 'draft' ? 'Brouillon'
        : deliveryNote.status === 'sent' ? 'Envoyé'
        : deliveryNote.status === 'invoiced' ? 'Facturé'
        : deliveryNote.status || '—'
      }</p>
      <p><strong>Nb d'articles :</strong> ${items.length}</p>
      <p><strong>Quantité totale :</strong> ${totalQty}</p>
    </div>
  </div>

  <!-- Tableau des articles -->
  <table>
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th style="width:100px">N° OF</th>
        <th>Désignation</th>
        <th style="width:100px">Référence</th>
        <th class="center" style="width:70px">Qté</th>
        <th class="right" style="width:80px">P.U.</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:6mm">Aucun article</td></tr>'}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="text-align:right">Total quantité :</td>
        <td class="right" colspan="2">${totalQty} unité(s)</td>
      </tr>
    </tfoot>
  </table>

  ${deliveryNote.notes ? `
  <div class="notes-box">
    <h3>Notes</h3>
    <p>${deliveryNote.notes.replace(/\n/g, '<br>')}</p>
  </div>` : ''}

  <!-- Signatures -->
  <div class="signatures">
    <div class="sig-box">
      <p>Signature émetteur :</p>
    </div>
    <div class="sig-box">
      <p>Signature destinataire (bon pour accord) :</p>
    </div>
  </div>

  <div class="footer">
    Document généré par ProducSync — ${new Date().toLocaleDateString('fr-FR')}
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
