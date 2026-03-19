const Servizi = (() => {

    let serviziData = [];

    function init() {
        console.log('Inizializzazione pagina servizi');
        fetchServizi();
        setupExportButtons();
    }

    function fetchServizi() {
        fetch('/q', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'servizi'
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Servizi ricevuti:', data);
                serviziData = sortServizi(data.data);
                renderServizi(serviziData);
            })
            .catch(error => console.error('Errore nel caricamento servizi:', error));
    }

    function sortServizi(servizi) {
        return servizi.sort((a, b) => {
            const nomeA = (a.nome_servizio || a.descrizione_servizio || '').toLowerCase();
            const nomeB = (b.nome_servizio || b.descrizione_servizio || '').toLowerCase();
            
            // Priorità 1: "sportello"
            const isSprtelloA = nomeA.includes('sportello');
            const isSprtelloB = nomeB.includes('sportello');
            
            if (isSprtelloA && !isSprtelloB) return -1;
            if (!isSprtelloA && isSprtelloB) return 1;
            
            // Priorità 2: "guardaroba"
            const isGuardarobaA = nomeA.includes('guardaroba');
            const isGuardarobaB = nomeB.includes('guardaroba');
            
            if (isGuardarobaA && !isGuardarobaB) return -1;
            if (!isGuardarobaA && isGuardarobaB) return 1;
            
            // Priorità 3: ordine alfabetico
            return nomeA.localeCompare(nomeB, 'it');
        });
    }

    function renderServizi(servizi) {
        const container = document.getElementById('servizi-container');
        
        if (!servizi || servizi.length === 0) {
            container.innerHTML = '<p class="text-muted">Nessun servizio disponibile</p>';
        } else {
            const cards = servizi.map(servizio => {
                const nome = servizio.descrizione_servizio || servizio.nome_servizio || 'N/A';
                const descrizione = servizio.descrizione_servizio || '';
                const numPersone = servizio.num_persone || 0;
                const servizioId = servizio._id;
                return `
                    <div class="col-md-4 col-lg-3 mb-3">
                        <div class="card h-100" style="cursor: pointer;" onclick="window.location.href='/servizio/${servizioId}'">
                            <div class="card-body">
                                <h5 class="card-title">${nome}</h5>
                                ${descrizione ? `<p class="card-text text-muted small">${descrizione}</p>` : ''}
                                <span class="badge bg-primary">${numPersone} ${numPersone === 1 ? 'persona' : 'persone'}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            container.innerHTML = cards;
        }

        // Card "Nuovo servizio" con bordi tratteggiati
        const newCard = `
            <div class="col-md-4 col-lg-3 mb-3">
                <div class="card h-100 border-2" style="border-style: dashed !important; cursor: pointer; min-height: 100px;"
                     onclick="Servizi.showCreateModal()">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-muted">
                        <span style="font-size: 2rem;">+</span>
                        <span>Nuovo servizio</span>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += newCard;
    }

    function setupExportButtons() {
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        const exportJsonlBtn = document.getElementById('exportJsonlBtn');
        
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', (e) => {
                e.preventDefault();
                downloadCsv();
            });
        }
        
        if (exportJsonlBtn) {
            exportJsonlBtn.addEventListener('click', (e) => {
                e.preventDefault();
                downloadJsonLines();
            });
        }
    }

    function downloadJsonLines() {
        const today = new Date().toISOString().split('T')[0];
        
        if (!serviziData || serviziData.length === 0) {
            alert('Nessun dato da esportare');
            return;
        }
        
        // Converti in JSON Lines (una riga JSON per record)
        const jsonLines = serviziData.map(record => JSON.stringify(record)).join('\n');
        
        // Crea e scarica il file
        const blob = new Blob([jsonLines], { type: 'application/jsonl' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `servizi_${today}.jsonl`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    function formatNomeServizio(value) {
        return value
            .toLowerCase()
            .trim()
            .replace(/[\r\n]+/g, ' ')
            .replace(/[^a-z0-9\s_]/g, '')
            .replace(/\s+/g, '_');
    }

    function showCreateModal() {
        const modalHtml = `
            <div class="modal fade" id="createServizioModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Nuovo servizio</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="nomeServizio" class="form-label">Nome servizio <span class="text-danger">*</span></label>
                                <input type="text" id="nomeServizio" class="form-control" maxlength="100"
                                       placeholder="es. sportello_accoglienza">
                                <div id="nomeServizioError" class="invalid-feedback"></div>
                                <div class="form-text">Verrà convertito in minuscolo con underscore al posto degli spazi.</div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-primary" id="btnCreaServizio">Crea</button>
                        </div>
                    </div>
                </div>
            </div>`;

        let existing = document.getElementById('createServizioModal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('createServizioModal'));
        modal.show();

        const nomeInput = document.getElementById('nomeServizio');
        const nomeError = document.getElementById('nomeServizioError');
        const btnCrea = document.getElementById('btnCreaServizio');

        nomeInput.addEventListener('blur', () => {
            const formatted = formatNomeServizio(nomeInput.value);
            nomeInput.value = formatted;
            validateNome(formatted);
        });

        function validateNome(formatted) {
            if (!formatted) {
                setNomeError('Il nome è obbligatorio.');
                return false;
            }
            const duplicate = serviziData.some(s => s.nome_servizio === formatted);
            if (duplicate) {
                setNomeError(`Esiste già un servizio con nome "${formatted}".`);
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
            const nome = formatNomeServizio(nomeInput.value);
            nomeInput.value = nome;
            if (!validateNome(nome)) return;

            const descrizione = nome.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

            btnCrea.disabled = true;
            fetch('/create-servizio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_servizio: nome, descrizione_servizio: descrizione })
            })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        modal.hide();
                        // Aggiunge alla lista locale e ri-renderizza
                        serviziData.push({
                            _id: data.servizio_id,
                            nome_servizio: nome,
                            descrizione_servizio: descrizione,
                            num_persone: 0
                        });
                        serviziData = sortServizi(serviziData);
                        renderServizi(serviziData);
                    } else {
                        alert('Errore nella creazione del servizio: ' + (data.error || 'errore sconosciuto'));
                        btnCrea.disabled = false;
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Errore nella comunicazione con il server.');
                    btnCrea.disabled = false;
                });
        });

        document.getElementById('createServizioModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    function downloadCsv() {
        const today = new Date().toISOString().split('T')[0];
        
        if (!serviziData || serviziData.length === 0) {
            alert('Nessun dato da esportare');
            return;
        }
        
        // Prepara le colonne
        const headers = ['_id', 'nome_servizio', 'descrizione_servizio', 'num_persone'];
        
        // Crea CSV
        const csvRows = [];
        csvRows.push(headers.join(','));
        
        serviziData.forEach(servizio => {
            const row = headers.map(header => {
                const value = servizio[header] || '';
                // Escape virgole e virgolette
                const escaped = String(value).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `servizi_${today}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    return { init, showCreateModal };
})();

document.addEventListener('DOMContentLoaded', () => {
    Servizi.init();
});
