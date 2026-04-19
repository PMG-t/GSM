const BisognoDetail = (() => {

    let bisognoData = null;
    let persone = [];
    let aggiornamenti = [];

    function init() {
        console.log('Inizializzazione dettaglio bisogno');
        bisognoData = window.bisognoData;
        console.log('Dati bisogno:', bisognoData);
        
        fetchDatiBisogno();
    }

    function fetchDatiBisogno() {
        fetch('/dati_bisogno', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bisogno_id: bisognoData._id
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Dati bisogno ricevuti:', data);
                persone = data.persone || [];
                aggiornamenti = data.aggiornamenti || [];
                
                renderPersone();
                renderAggiornamenti();
            })
            .catch(error => console.error('Errore nel caricamento dati bisogno:', error));
    }

    function renderPersone() {
        const columnDefs = [
            {
                headerName: 'Cognome',
                field: 'cognome',
                sortable: true,
                filter: true,
                flex: 1
            },
            {
                headerName: 'Nome',
                field: 'nome',
                sortable: true,
                filter: true,
                flex: 1
            },
            {
                headerName: 'Aggiornamenti',
                field: 'num_aggiornamenti',
                sortable: true,
                filter: true,
                width: 150,
                cellRenderer: params => `<span class="badge bg-secondary">${params.value}</span>`
            },
            {
                headerName: '',
                field: 'azioni',
                width: 100,
                cellRenderer: params => `<a href="/persona/${params.data._id}" class="btn btn-sm btn-primary">Apri</a>`
            }
        ];

        const gridOptions = {
            columnDefs: columnDefs,
            rowData: persone,
            defaultColDef: {
                resizable: true
            }
        };

        const gridDiv = document.querySelector('#grid-persone');
        agGrid.createGrid(gridDiv, gridOptions);
    }

    function renderAggiornamenti() {
        const columnDefs = [
            {
                headerName: 'Data',
                field: 'data',
                sortable: true,
                filter: 'agDateColumnFilter',
                width: 180,
                valueFormatter: params => {
                    if (!params.value) return '';
                    return new Date(params.value).toLocaleDateString('it-IT', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                },
                sort: 'desc'
            },
            {
                headerName: 'Cognome',
                field: 'cognome',
                sortable: true,
                filter: true,
                width: 150
            },
            {
                headerName: 'Nome',
                field: 'nome',
                sortable: true,
                filter: true,
                width: 150
            },
            {
                headerName: 'Note',
                field: 'note',
                sortable: true,
                filter: true,
                flex: 1,
                wrapText: true
            },
            {
                headerName: '',
                field: 'azioni',
                width: 100,
                cellRenderer: params => `<a href="/persona/${params.data.persona_id}" class="btn btn-sm btn-primary">Apri</a>`
            }
        ];

        const gridOptions = {
            columnDefs: columnDefs,
            rowData: aggiornamenti,
            defaultColDef: {
                resizable: true
            }
        };

        const gridDiv = document.querySelector('#grid-aggiornamenti');
        agGrid.createGrid(gridDiv, gridOptions);
    }

    function formatNomeBisogno(value) {
        return value
            .toLowerCase()
            .trim()
            .replace(/[\r\n]+/g, ' ')
            .replace(/[^a-z0-9\s_]/g, '')
            .replace(/\s+/g, '_');
    }

    function showEditModal() {
        // Fetch all bisogni for duplicate check
        fetch('/q', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'bisogni' })
        })
            .then(r => r.json())
            .then(data => _openEditModal(data.data || []))
            .catch(err => {
                console.error(err);
                _openEditModal([]);
            });
    }

    function _openEditModal(allBisogni) {
        const currentNome = bisognoData.nome_bisogno || '';
        const currentDescrizione = bisognoData.descrizione_bisogno || '';

        const modalHtml = `
            <div class="modal fade" id="editBisognoModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Modifica bisogno</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="editNomeBisogno" class="form-label">Nome bisogno <span class="text-danger">*</span></label>
                                <input type="text" id="editNomeBisogno" class="form-control" maxlength="100"
                                       value="${currentNome}">
                                <div id="editNomeBisognoError" class="invalid-feedback"></div>
                                <div class="form-text">Minuscolo con underscore al posto degli spazi.</div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-primary" id="btnSalvaBisogno">Salva</button>
                        </div>
                    </div>
                </div>
            </div>`;

        let existing = document.getElementById('editBisognoModal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('editBisognoModal'));
        modal.show();

        const nomeInput = document.getElementById('editNomeBisogno');
        const nomeError = document.getElementById('editNomeBisognoError');
        const btnSalva = document.getElementById('btnSalvaBisogno');

        function buildDescrizione(nome) {
            return nome.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }

        function validateNome(formatted) {
            if (!formatted) {
                setError('Il nome è obbligatorio.');
                return false;
            }
            const duplicate = allBisogni.some(
                s => s.nome_bisogno === formatted && s._id !== bisognoData._id
            );
            if (duplicate) {
                setError(`Esiste già un bisogno con nome "${formatted}".`);
                return false;
            }
            clearError();
            return true;
        }

        function setError(msg) {
            nomeInput.classList.add('is-invalid');
            nomeError.textContent = msg;
            btnSalva.disabled = true;
        }

        function clearError() {
            nomeInput.classList.remove('is-invalid');
            nomeError.textContent = '';
            btnSalva.disabled = false;
        }

        nomeInput.addEventListener('blur', () => {
            const formatted = formatNomeBisogno(nomeInput.value);
            nomeInput.value = formatted;
            validateNome(formatted);
        });

        btnSalva.addEventListener('click', () => {
            const nome = formatNomeBisogno(nomeInput.value);
            nomeInput.value = nome;
            if (!validateNome(nome)) return;

            const descrizione = buildDescrizione(nome);
            btnSalva.disabled = true;

            fetch('/edit-bisogno', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bisogno_id: bisognoData._id,
                    nome_bisogno: nome,
                    descrizione_bisogno: descrizione
                })
            })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        modal.hide();
                        bisognoData.nome_bisogno = nome;
                        bisognoData.descrizione_bisogno = descrizione;
                        document.querySelector('.container h1').textContent = descrizione || nome;
                    } else {
                        alert('Errore: ' + (data.error || 'errore sconosciuto'));
                        btnSalva.disabled = false;
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Errore nella comunicazione con il server.');
                    btnSalva.disabled = false;
                });
        });

        document.getElementById('editBisognoModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    function showDeleteModal() {
        const nome = bisognoData.descrizione_bisogno || bisognoData.nome_bisogno;
        const numPersone = bisognoData.num_persone || 0;

        const modalHtml = `
            <div class="modal fade" id="deleteBisognoModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-danger">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">Elimina bisogno</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Stai per eliminare il bisogno <strong>${nome}</strong>.</p>
                            ${numPersone > 0
                                ? `<p class="text-danger">&#9888; Questo bisogno è associato a <strong>${numPersone} ${numPersone === 1 ? 'persona' : 'persone'}</strong>. Tutti i dati del bisogno (aggiornamenti inclusi) verranno rimossi anche dai loro profili.</p>`
                                : ''}
                            <p class="fw-bold">L'operazione è irreversibile. Sei sicurə?</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-danger" id="btnConfermaElimina">Elimina definitivamente</button>
                        </div>
                    </div>
                </div>
            </div>`;

        let existing = document.getElementById('deleteBisognoModal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('deleteBisognoModal'));
        modal.show();

        document.getElementById('btnConfermaElimina').addEventListener('click', () => {
            const btn = document.getElementById('btnConfermaElimina');
            btn.disabled = true;

            fetch('/delete-bisogno', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bisogno_id: bisognoData._id })
            })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        modal.hide();
                        window.location.href = '/bisogni';
                    } else {
                        alert('Errore: ' + (data.error || 'errore sconosciuto'));
                        btn.disabled = false;
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Errore nella comunicazione con il server.');
                    btn.disabled = false;
                });
        });

        document.getElementById('deleteBisognoModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    return { init, showEditModal, showDeleteModal };
})();

document.addEventListener('DOMContentLoaded', () => {
    BisognoDetail.init();
});
