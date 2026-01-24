const GridAggiornamenti = (() => {

    let gridApi = null;
    let gridData = [];

    function init() {
        console.log('Inizializzazione griglia aggiornamenti');
        fetchData();
    }

    function fetchData() {
        fetch('/q', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'tutti_aggiornamenti'
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Dati aggiornamenti ricevuti:', data);
                gridData = data.data;
                createGrid();
            })
            .catch(error => console.error('Errore nel caricamento aggiornamenti:', error));
    }

    function createGrid() {
        const columnDefs = [
            {
                headerName: '',
                field: 'apri',
                width: 100,
                pinned: 'left',
                cellRenderer: params => {
                    const data = params.data;
                    const dataISO = new Date(data.data).toISOString();
                    return `<a href="/persona/${data.persona_id}?tipo=${data.tipo}&item_id=${data.item_id}&data=${encodeURIComponent(dataISO)}" class="btn btn-sm btn-primary">Apri</a>`;
                }
            },
            {
                headerName: 'Data',
                field: 'data',
                sortable: true,
                filter: 'agDateColumnFilter',
                width: 150,
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
                headerName: 'Tipo',
                field: 'tipo',
                sortable: true,
                filter: true,
                width: 120,
                cellRenderer: params => {
                    const tipo = params.value;
                    if (tipo === 'servizio') {
                        return '<span class="badge bg-primary">Servizio</span>';
                    } else if (tipo === 'bisogno') {
                        return '<span class="badge bg-info">Bisogno</span>';
                    }
                    return tipo;
                }
            },
            {
                headerName: 'Servizio/Bisogno',
                field: 'item_nome',
                sortable: true,
                filter: true,
                flex: 1,
                minWidth: 200
            },
            {
                headerName: 'Note',
                field: 'note',
                sortable: true,
                filter: true,
                flex: 2,
                minWidth: 300,
                wrapText: true,
                autoHeight: true
            }
        ];

        const gridOptions = {
            columnDefs: columnDefs,
            rowData: gridData,
            defaultColDef: {
                resizable: true,
                sortable: true,
                filter: true
            },
            pagination: false,
            domLayout: 'normal',
            onGridReady: params => {
                gridApi = params.api;
                setupQuickFilter();
            }
        };

        const gridDiv = document.querySelector('#grid-aggiornamenti');
        agGrid.createGrid(gridDiv, gridOptions);
    }

    function setupQuickFilter() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            gridApi.setGridOption('quickFilterText', e.target.value);
        });
    }

    function showEditModal(personaId, tipo, itemId, dataISO, note, itemNome) {
        const tipoLabel = tipo === 'servizio' ? 'servizio' : 'bisogno';
        const modalHtml = `
            <div class="modal fade" id="editAggModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Modifica aggiornamento per ${tipoLabel} "${itemNome}"</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <label for="editAggNote" class="form-label">Note</label>
                            <textarea id="editAggNote" class="form-control" rows="4" style="resize: vertical; max-height: 200px;">${note}</textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-primary" id="btnEditAgg">Salva</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        let existingModal = document.getElementById('editAggModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('editAggModal'));
        modal.show();

        document.getElementById('btnEditAgg').addEventListener('click', () => {
            const newNote = document.getElementById('editAggNote').value;
            editAggiornamento(personaId, tipo, itemId, dataISO, newNote);
            modal.hide();
        });

        document.getElementById('editAggModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    function editAggiornamento(personaId, tipo, itemId, oldDataISO, newNote) {
        const payload = {
            persona_id: personaId,
            tipo: tipo,
            item_id: itemId,
            old_data: oldDataISO,
            new_note: newNote,
            new_data: new Date().toISOString()
        };

        console.log('Modifica aggiornamento:', payload);

        fetch('/edit-aggiornamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Aggiornamento modificato:', data);
                if (data.success) {
                    // Ricarica i dati
                    fetchData();
                }
            })
            .catch(error => console.error('Errore nella modifica:', error));
    }

    function deleteAggiornamento(personaId, tipo, itemId, dataISO, cognome, nome) {
        if (!confirm(`Sei sicuro di voler eliminare questo aggiornamento per ${cognome} ${nome}?`)) {
            return;
        }

        const payload = {
            persona_id: personaId,
            tipo: tipo,
            item_id: itemId,
            data: dataISO
        };

        console.log('Eliminazione aggiornamento:', payload);

        fetch('/delete-aggiornamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Aggiornamento eliminato:', data);
                if (data.success) {
                    // Ricarica i dati
                    fetchData();
                }
            })
            .catch(error => console.error('Errore nell\'eliminazione:', error));
    }

    return { init, showEditModal, deleteAggiornamento };
})();

document.addEventListener('DOMContentLoaded', () => {
    GridAggiornamenti.init();
});
