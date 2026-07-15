/* ============================================
   stock.js
   Responsabilidad única: renderizar la sección Stock
   y conectar Excel + buscador + tabla de resultados.
============================================ */

const StockSection = (() => {

  let allRecords = [];   // todo lo importado del Excel
  let searchMode = 'contains';

  function template() {
    return `
      <div class="section-header">
        <div>
          <h1>Stock</h1>
          <p>Consulta de inventario disponible por producto y bodega.</p>
        </div>
        <button class="btn-primary" id="exportBtn">⬇ Exportar</button>
      </div>

      <div class="panel">
        <div class="filter-bar">▽ Filtros</div>
        <div class="filter-body">
          <div class="field">
            <label>PRODUCTO</label>
            <input type="text" id="searchInput" placeholder="Buscar por código o nombre" autocomplete="off">
            <div class="search-mode">
              <label><input type="radio" name="mode" value="contains" checked> Contiene</label>
              <label><input type="radio" name="mode" value="starts"> Comienza con</label>
            </div>
          </div>
          <div class="field">
            <label>FAMILIA</label>
            <select id="familiaSelect">
              <option value="">Todas</option>
            </select>
          </div>
          <button class="btn-search" id="searchBtn">🔍 Buscar</button>
          <button class="btn-clear" id="clearBtn">Limpiar</button>
        </div>
        <div class="import-row">
          <span id="importStatus">${allRecords.length ? `${allRecords.length} productos cargados.` : 'Aún no se ha importado ningún Excel.'}</span>
          <button class="btn-outline" id="openImportModal" type="button">Importar Excel</button>
        </div>
      </div>

      <div class="results-panel" id="resultsPanel">
        ${renderResults(allRecords, true)}
      </div>

      <div class="modal-overlay" id="importModalOverlay" hidden>
        <div class="modal">
          <div class="modal-header">
            <h2>Importar Excel</h2>
            <button class="modal-close" id="closeImportModal" type="button" aria-label="Cerrar">✕</button>
          </div>
          <div class="modal-body">
            <label class="dropzone" id="dropzone" for="fileInput">
              <span class="dropzone-icon">📄</span>
              <strong>Arrastra tu archivo aquí</strong>
              <span>o haz click para seleccionarlo</span>
              <span class="dropzone-hint">Formatos aceptados: .xlsx, .xls</span>
              <input type="file" id="fileInput" accept=".xlsx,.xls" style="display:none;">
            </label>
            <div class="dropzone-status" id="dropzoneStatus"></div>
          </div>
        </div>
      </div>
    `;
  }

  function renderResults(records, isEmptyInitial = false) {
    if (records.length === 0) {
      return `
        <div class="empty-state">
          <div class="icon">🗄️</div>
          <strong>${isEmptyInitial ? 'Busca productos para ver el stock' : 'Sin resultados'}</strong>
          <span>${isEmptyInitial ? 'Importa un Excel y filtra por nombre, código o familia.' : 'Prueba con otro término de búsqueda.'}</span>
        </div>`;
    }

    const rows = records.map(r => `
      <tr>
        <td>${r.codGrupo}</td>
        <td>${r.codProducto}</td>
        <td>${r.producto}</td>
        <td>${r.unidadMedida}</td>
        <td>${r.pesoUnitario.toLocaleString('es-CL')}</td>
        <td>${r.stockTotal.toLocaleString('es-CL')}</td>
      </tr>`).join('');

    return `
      <div class="results-count">${records.length.toLocaleString('es-CL')} producto(s) encontrado(s)</div>
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Código Grupo</th>
              <th>Código Producto</th>
              <th>Descripción</th>
              <th>Unidad</th>
              <th>Peso Unitario</th>
              <th>Stock Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function populateFamilias() {
    const select = document.getElementById('familiaSelect');
    if (!select) return;
    const familias = [...new Set(allRecords.map(r => r.grupo).filter(Boolean))].sort();
    select.innerHTML = '<option value="">Todas</option>' +
      familias.map(f => `<option value="${f}">${f}</option>`).join('');
  }

  function runSearch() {
    const query = document.getElementById('searchInput').value;
    const familia = document.getElementById('familiaSelect').value;

    let results = SmartSearch.search(query, searchMode, allRecords);
    if (familia) {
      results = results.filter(r => r.grupo === familia);
    }

    document.getElementById('resultsPanel').innerHTML = renderResults(results, allRecords.length === 0);
  }

  function attachEvents() {
    document.getElementById('searchBtn').addEventListener('click', runSearch);

    document.getElementById('searchInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runSearch();
    });

    document.getElementById('familiaSelect').addEventListener('change', runSearch);

    document.querySelectorAll('input[name="mode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        searchMode = e.target.value;
        runSearch();
      });
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
      document.getElementById('searchInput').value = '';
      document.getElementById('familiaSelect').value = '';
      document.getElementById('resultsPanel').innerHTML = renderResults([], true);
    });

    document.getElementById('fileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) importFile(file);
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      alert('Exportar: pendiente de definir formato de salida.');
    });

    // ---- Modal de importación ----
    const overlay = document.getElementById('importModalOverlay');
    const dropzone = document.getElementById('dropzone');

    document.getElementById('openImportModal').addEventListener('click', () => {
      overlay.hidden = false;
      document.getElementById('dropzoneStatus').textContent = '';
    });

    document.getElementById('closeImportModal').addEventListener('click', closeModal);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(); // click fuera del modal
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden) closeModal();
    });

    function closeModal() {
      overlay.hidden = true;
    }

    ['dragenter', 'dragover'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (!file) return;

      const validExt = /\.(xlsx|xls)$/i.test(file.name);
      if (!validExt) {
        document.getElementById('dropzoneStatus').textContent = 'Ese archivo no es un Excel (.xlsx / .xls).';
        return;
      }
      importFile(file);
    });
  }

  async function importFile(file) {
    const statusEl = document.getElementById('importStatus');
    const dropzoneStatus = document.getElementById('dropzoneStatus');

    statusEl.textContent = 'Leyendo archivo...';
    if (dropzoneStatus) dropzoneStatus.textContent = `Leyendo "${file.name}"...`;

    try {
      allRecords = await ExcelReader.readFile(file);
      statusEl.textContent = `${allRecords.length.toLocaleString('es-CL')} productos cargados desde "${file.name}".`;
      populateFamilias();
      runSearch();
      document.getElementById('importModalOverlay').hidden = true;
    } catch (err) {
      statusEl.textContent = `Error: ${err.message}`;
      if (dropzoneStatus) dropzoneStatus.textContent = `Error: ${err.message}`;
    }
  }

  function render(container) {
    container.innerHTML = template();
    populateFamilias();
    attachEvents();
  }

  return { render };
})();
