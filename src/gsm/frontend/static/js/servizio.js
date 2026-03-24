const ServizioDetail = (() => {

    let servizioData = null;
    let persone = [];
    let aggiornamenti = [];

    function init() {
        console.log('Inizializzazione dettaglio servizio');
        servizioData = window.servizioData;
        console.log('Dati servizio:', servizioData);
        
        fetchDatiServizio();
    }

    function fetchDatiServizio() {
        fetch('/dati_servizio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                servizio_id: servizioData._id
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Dati servizio ricevuti:', data);
                persone = data.persone || [];
                aggiornamenti = data.aggiornamenti || [];
                
                renderPersone();
                renderAggiornamenti();
            })
            .catch(error => console.error('Errore nel caricamento dati servizio:', error));
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

    function formatNomeServizio(value) {
        return value
            .toLowerCase()
            .trim()
            .replace(/[\r\n]+/g, ' ')
            .replace(/[^a-z0-9\s_]/g, '')
            .replace(/\s+/g, '_');
    }

    function showEditModal() {
        // Fetch all servizi for duplicate check
        fetch('/q', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'servizi' })
        })
            .then(r => r.json())
            .then(data => _openEditModal(data.data || []))
            .catch(err => {
                console.error(err);
                _openEditModal([]);
            });
    }

    function _openEditModal(allServizi) {
        const currentNome = servizioData.nome_servizio || '';
        const currentDescrizione = servizioData.descrizione_servizio || '';

        const modalHtml = `
            <div class="modal fade" id="editServizioModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Modifica servizio</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="editNomeServizio" class="form-label">Nome servizio <span class="text-danger">*</span></label>
                                <input type="text" id="editNomeServizio" class="form-control" maxlength="100"
                                       value="${currentNome}">
                                <div id="editNomeServizioError" class="invalid-feedback"></div>
                                <div class="form-text">Minuscolo con underscore al posto degli spazi.</div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-primary" id="btnSalvaServizio">Salva</button>
                        </div>
                    </div>
                </div>
            </div>`;

        let existing = document.getElementById('editServizioModal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('editServizioModal'));
        modal.show();

        const nomeInput = document.getElementById('editNomeServizio');
        const nomeError = document.getElementById('editNomeServizioError');
        const btnSalva = document.getElementById('btnSalvaServizio');

        function buildDescrizione(nome) {
            return nome.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }

        function validateNome(formatted) {
            if (!formatted) {
                setError('Il nome è obbligatorio.');
                return false;
            }
            const duplicate = allServizi.some(
                s => s.nome_servizio === formatted && s._id !== servizioData._id
            );
            if (duplicate) {
                setError(`Esiste già un servizio con nome "${formatted}".`);
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
            const formatted = formatNomeServizio(nomeInput.value);
            nomeInput.value = formatted;
            validateNome(formatted);
        });

        btnSalva.addEventListener('click', () => {
            const nome = formatNomeServizio(nomeInput.value);
            nomeInput.value = nome;
            if (!validateNome(nome)) return;

            const descrizione = buildDescrizione(nome);
            btnSalva.disabled = true;

            fetch('/edit-servizio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    servizio_id: servizioData._id,
                    nome_servizio: nome,
                    descrizione_servizio: descrizione
                })
            })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        modal.hide();
                        servizioData.nome_servizio = nome;
                        servizioData.descrizione_servizio = descrizione;
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

        document.getElementById('editServizioModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    return { init, showEditModal };
})();

document.addEventListener('DOMContentLoaded', () => {
    ServizioDetail.init();
});
