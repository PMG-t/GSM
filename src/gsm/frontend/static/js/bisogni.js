const Bisogni = (() => {

    let bisogniData = [];

    function init() {
        console.log('Inizializzazione pagina bisogni');
        fetchData();
        setupExportButtons();
        setupGlobalSearch();
    }

    async function fetchData() {
        try {
            const response = await fetch('/q', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: 'bisogni' })
            });
            const result = await response.json();
            bisogniData = sortBisogni(result.data);
            renderBisogni(bisogniData);
        } catch (error) {
            console.error('Errore nel caricamento dati:', error);
        }
    }

    function sortBisogni(bisogni) {
        return bisogni.slice().sort((a, b) => {
            const nomeA = (a.nome_bisogno || '').toLowerCase();
            const nomeB = (b.nome_bisogno || '').toLowerCase();
            return nomeA.localeCompare(nomeB, 'it');
        });
    }

    function renderBisogni(bisogni) {
        const container = document.getElementById('bisogni-container');

        if (!bisogni || bisogni.length === 0) {
            container.innerHTML = '<p class="text-muted">Nessun bisogno disponibile</p>';
            return;
        }

        const cards = bisogni.map(bisogno => {
            const nome = bisogno.nome_bisogno || 'N/A';
            const descrizione = bisogno.descrizione_bisogno || '';
            const numPersone = bisogno.num_persone || 0;
            const bisognoId = bisogno._id;
            return `
                <div class="col-md-4 col-lg-3 mb-3 bisogno-card-wrapper" data-nome="${nome.toLowerCase()}" style="cursor: pointer;" onclick="window.location.href='/bisogno/${bisognoId}'">
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="card-title">${nome}</h6>
                            ${descrizione ? `<p class="card-text text-muted small">${descrizione}</p>` : ''}
                            <span class="badge bg-primary">${numPersone} ${numPersone === 1 ? 'persona' : 'persone'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const newCard = `
            <div class="col-md-4 col-lg-3 mb-3">
                <div class="card h-100 border-2" style="border-style: dashed !important; cursor: pointer; min-height: 100px;"
                     onclick="Bisogni.showCreateModal()">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-muted">
                        <span style="font-size: 2rem;">+</span>
                        <span>Nuovo bisogno</span>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = `<div class="row">${cards}${newCard}</div>`;
    }

    function normalizeName(value) {
        return value
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_');
    }

    function cleanName(value) {
        return value.trim().replace(/\s+/g, ' ');
    }

    function showCreateModal() {
        const modalHtml = `
            <div class="modal fade" id="createBisognoModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Nuovo bisogno</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="nomeBisogno" class="form-label">Nome bisogno <span class="text-danger">*</span></label>
                                <input type="text" id="nomeBisogno" class="form-control" maxlength="100">
                                <div id="nomeBisognoError" class="invalid-feedback"></div>
                            </div>
                            <div class="mb-3">
                                <label for="descrizioneBisogno" class="form-label">Descrizione <span class="text-danger">*</span></label>
                                <textarea id="descrizioneBisogno" class="form-control" maxlength="500" rows="3"></textarea>
                                <div class="form-text"><span id="descBisognoCount">0</span>/500</div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-primary" id="btnCreaBisogno">Crea</button>
                        </div>
                    </div>
                </div>
            </div>`;

        let existing = document.getElementById('createBisognoModal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('createBisognoModal'));
        modal.show();

        const nomeInput = document.getElementById('nomeBisogno');
        const descInput = document.getElementById('descrizioneBisogno');
        const nomeError = document.getElementById('nomeBisognoError');
        const btnCrea = document.getElementById('btnCreaBisogno');
        const descCount = document.getElementById('descBisognoCount');

        descInput.addEventListener('input', () => {
            descCount.textContent = descInput.value.length;
        });

        nomeInput.addEventListener('blur', () => {
            validateNome(nomeInput.value);
        });

        function validateNome(value) {
            const cleaned = cleanName(value);
            if (!cleaned) {
                setNomeError('Il nome è obbligatorio.');
                return false;
            }
            const normalizedInput = normalizeName(cleaned);
            const duplicate = bisogniData.some(b => normalizeName(b.nome_bisogno || '') === normalizedInput);
            if (duplicate) {
                setNomeError(`Esiste già un bisogno con nome simile a "${cleaned}".`);
                return false;
            }
            clearNomeError();
            return true;
        }

        function setNomeError(msg) {
            nomeInput.classList.add('is-invalid');
            nomeError.textContent = msg;
            btnCrea.disabled = true;
        }

        function clearNomeError() {
            nomeInput.classList.remove('is-invalid');
            nomeError.textContent = '';
            btnCrea.disabled = false;
        }

        btnCrea.addEventListener('click', () => {
            const nome = cleanName(nomeInput.value).replace(/^./, c => c.toUpperCase());
            const descrizione = descInput.value.trim().replace(/^./, c => c.toUpperCase());
            nomeInput.value = nome;

            if (!validateNome(nome)) return;

            if (!descrizione) {
                descInput.classList.add('is-invalid');
                return;
            }
            descInput.classList.remove('is-invalid');

            btnCrea.disabled = true;
            fetch('/create-bisogno', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome_bisogno: nome,
                    descrizione_bisogno: descrizione
                })
            })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        modal.hide();
                        bisogniData.push({
                            _id: data.bisogno_id,
                            nome_bisogno: nome,
                            descrizione_bisogno: descrizione,
                            num_persone: 0
                        });
                        bisogniData = sortBisogni(bisogniData);
                        renderBisogni(bisogniData);
                    } else {
                        alert('Errore nella creazione del bisogno: ' + (data.error || 'errore sconosciuto'));
                        btnCrea.disabled = false;
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Errore nella comunicazione con il server.');
                    btnCrea.disabled = false;
                });
        });

        document.getElementById('createBisognoModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    function setupGlobalSearch() {
        const input = document.getElementById('globalSearchInput');
        if (!input) return;
        input.addEventListener('input', (e) => {
            const searchText = e.target.value.toLowerCase().trim();
            const wrappers = document.querySelectorAll('.bisogno-card-wrapper');
            wrappers.forEach(wrapper => {
                const nome = wrapper.dataset.nome || '';
                wrapper.style.display = (!searchText || nome.includes(searchText)) ? '' : 'none';
            });
        });
    }

    function downloadCsv() {
        const today = new Date().toISOString().split('T')[0];
        if (!bisogniData || bisogniData.length === 0) { alert('Nessun dato da esportare'); return; }
        const headers = ['_id', 'nome_bisogno', 'descrizione_bisogno'];
        const csvRows = [headers.join(',')];
        bisogniData.forEach(bisogno => {
            const row = headers.map(h => `"${String(bisogno[h] || '').replace(/"/g, '""')}"`);
            csvRows.push(row.join(','));
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `bisogni_${today}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    function downloadJsonLines() {
        const today = new Date().toISOString().split('T')[0];
        if (!bisogniData || bisogniData.length === 0) { alert('Nessun dato da esportare'); return; }
        const jsonLines = bisogniData.map(r => JSON.stringify(r)).join('\n');
        const blob = new Blob([jsonLines], { type: 'application/jsonl' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `bisogni_${today}.jsonl`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    function setupExportButtons() {
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        const exportJsonlBtn = document.getElementById('exportJsonlBtn');
        if (exportCsvBtn) exportCsvBtn.addEventListener('click', e => { e.preventDefault(); downloadCsv(); });
        if (exportJsonlBtn) exportJsonlBtn.addEventListener('click', e => { e.preventDefault(); downloadJsonLines(); });
    }

    return { init, showCreateModal };
})();

document.addEventListener('DOMContentLoaded', () => {
    Bisogni.init();
});
