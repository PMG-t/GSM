const GridPersone = (() => {

    const BASE_COLUMN_NAMES = [
        // "_id",
        // "data_inserimento",
        "cognome",
        "nome",
        "data_nascita",
        "eta",
        "luogo_nascita",
        "citta",
        "genere",
        // "documento",
        // "telefono",
        // "stato_civile",
        // "figli",
        // "condizione_abitativa",
        // "categoria_ethos",
        // "lavoro",
        // "in_carico_presso",
        // "istruzione",
        // "residenza",
        // "servizi_sociali",
        "servizi",
        "bisogni"
    ]

    let records_persone = [];
    let fields_persone = [];

    let records_servizi = [];
    let fields_servizi = [];
    let serviziMap = {};

    let records_bisogni = [];
    let fields_bisogni = [];
    let bisogniMap = {};

    let gridApi;

    const gridDiv = document.querySelector('#grid-persone');

    function init() {
        console.log('Inizializzazione della griglia persone');
        fecthData();
    }

    function fecthData() {
        fetch('/q', 
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: 'persone'
                })
            }
        )
            .then(response => response.json())
            .then(data => {
                console.log('Dati ricevuti:', data);
                records_persone = data.data;
                fields_persone = data.columns;
                createGrid();
            })
            .catch(error => console.error('Errore nel caricamento dei dati:', error));

        fetch('/q',
            {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: 'servizi'
                })
            }
        )
            .then(response => response.json())
            .then(data => {
                console.log('Dati servizi ricevuti:', data);
                /**
                 * {
                    "columns": [
                        "_id",
                        "nome_servizio",
                        "descrizione_servizio"
                    ],
                    "data": [
                        {
                            "_id": "6973d70aafb5b1cfa22b210a",
                            "descrizione_servizio": "Equipe Marginalita",
                            "nome_servizio": "equipe_marginalita"
                        },
                        {
                            "_id": "6973d70aafb5b1cfa22b210b",
                            "descrizione_servizio": "Presa In Carico Case Management",
                            "nome_servizio": "presa_in_carico_case_management"
                        },
                        {
                            "_id": "6973d70aafb5b1cfa22b210c",
                            "descrizione_servizio": "Assessment Orientamento",
                            "nome_servizio": "assessment_orientamento"
                        }
                        ...
                    ]
                }
                 */
                records_servizi = data.data;
                fields_servizi = data.columns;
                serviziMap = data.data.reduce((map, servizio) => {
                    map[servizio._id] = servizio.descrizione_servizio || servizio.nome_servizio;
                    return map;
                }, {});
            }
        )

        fetch('/q',
            {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: 'bisogni'
                })
            }
        )
            .then(response => response.json())
            .then(data => {
                console.log('Dati bisogni ricevuti:', data);
                records_bisogni = data.data;
                fields_bisogni = data.columns;
                bisogniMap = data.data.reduce((map, bisogno) => {
                    map[bisogno._id] = bisogno.descrizione_bisogno || bisogno.nome_bisogno;
                    return map;
                }, {});
            })
            .catch(error => console.error('Errore nel caricamento bisogni:', error));
    }

    function createGrid() {
        // Colonna azioni fissata a sinistra
        const actionColumn = {
            headerName: '',
            field: 'actions',
            pinned: 'left',
            width: 100,
            cellRenderer: (params) => {
                return `<button class="btn btn-sm btn-primary">Apri</button>`;
            },
            onCellClicked: (params) => {
                openPersona(params.data._id);
            },
            sortable: false,
            filter: false
        };

        const columnDefs = [
            actionColumn,
            ...fields_persone.map(field => {
                const colDef = {
                    field: field,
                    headerName: field,
                    sortable: true,
                    filter: true,
                    hide: !BASE_COLUMN_NAMES.includes(field)
                };
                
                if (field === 'servizi' || field === 'bisogni') {
                    colDef.cellRenderer = (params) => {
                        if (!params.value || typeof params.value !== 'object') return '';
                        const ids = Object.keys(params.value);
                        const map = field === 'servizi' ? serviziMap : bisogniMap;
                        const preview = ids.slice(0, 3).map(id => {
                            const nome = map[id] || id;
                            return `<span class="badge bg-primary me-1">${nome}</span>`;
                        }).join('');
                        const more = ids.length > 3 ? `<span class="badge bg-secondary">+${ids.length - 3}</span>` : '';
                        return `<div class="cell-clickable" style="cursor: pointer;">${preview}${more}</div>`;
                    };
                    colDef.onCellClicked = (params) => {
                        if (!params.value || typeof params.value !== 'object') return;
                        showServicesModal(field, params.value, params.data._id);
                    };
                    // Aggiungi testo per quick filter
                    colDef.getQuickFilterText = (params) => {
                        if (!params.value || typeof params.value !== 'object') return '';
                        const ids = Object.keys(params.value);
                        const map = field === 'servizi' ? serviziMap : bisogniMap;
                        return ids.map(id => map[id] || id).join(' ');
                    };
                }
                
                return colDef;
            })
        ];

        const gridOptions = {
            columnDefs: columnDefs,
            rowData: records_persone,
            defaultColDef: {
                sortable: true,
                filter: true,
                resizable: true
            }
        };

        gridApi = agGrid.createGrid(gridDiv, gridOptions);
        createFieldPanel();
        gridApi.autoSizeAllColumns();
        setupQuickFilter();
        setupExportButton();
    }

    function setupQuickFilter() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            gridApi.setGridOption('quickFilterText', e.target.value);
        });
    }

    function downloadData() {
        const today = new Date().toISOString().split('T')[0];
        gridApi.exportDataAsCsv({
            fileName: `persone_${today}.csv`,
            columnKeys: fields_persone.filter(f => !['actions'].includes(f)),
            processCellCallback: (params) => {
                // Gestisci servizi e bisogni come liste di nomi leggibili
                if (params.column.colId === 'servizi' || params.column.colId === 'bisogni') {
                    if (!params.value || typeof params.value !== 'object') return '';
                    const ids = Object.keys(params.value);
                    const map = params.column.colId === 'servizi' ? serviziMap : bisogniMap;
                    return ids.map(id => map[id] || id).join('; ');
                }
                return params.value;
            }
        });
    }

    function downloadJsonLines() {
        const today = new Date().toISOString().split('T')[0];
        
        // Ottieni tutti i dati filtrati dalla griglia
        const rowData = [];
        gridApi.forEachNodeAfterFilterAndSort(node => {
            rowData.push(node.data);
        });
        
        // Converti in JSON Lines (una riga JSON per record)
        const jsonLines = rowData.map(record => JSON.stringify(record)).join('\n');
        
        // Crea e scarica il file
        const blob = new Blob([jsonLines], { type: 'application/jsonl' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `persone_${today}.jsonl`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    function createFieldPanel() {
        const panel = document.querySelector('#field-panel');
        panel.innerHTML = '<h5 class="mb-3">Colonne</h5>';
        
        fields_persone.forEach(field => {
            const isVisible = BASE_COLUMN_NAMES.includes(field);
            const div = document.createElement('div');
            div.className = 'form-check mb-1';
            div.innerHTML = `
                <input class="form-check-input" type="checkbox" id="col-${field}" ${isVisible ? 'checked' : ''}>
                <label class="form-check-label" for="col-${field}">${field}</label>
            `;
            panel.appendChild(div);
            
            const checkbox = div.querySelector('input');
            checkbox.addEventListener('change', (e) => {
                gridApi.setColumnsVisible([field], e.target.checked);
            });
        });
    }

    function showServicesModal(fieldName, data, personaId) {
        const ids = Object.keys(data);
        const map = fieldName === 'servizi' ? serviziMap : bisogniMap;
        const badges = ids.map(id => {
            const nome = map[id] || id;
            return `<span class="badge bg-primary me-2 mb-2" style="cursor: pointer;" data-id="${id}">${nome}</span>`;
        }).join('');

        const modalHtml = `
            <div class="modal fade" id="servicesModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${fieldName}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${badges}
                        </div>
                    </div>
                </div>
            </div>
        `;

        let existingModal = document.getElementById('servicesModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('servicesModal'));
        modal.show();
        
        modalElement.addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    function openPersona(personaId) {
        console.log('Apertura persona:', personaId);
        window.location.href = `/persona/${personaId}`;
    }

    function setupExportButton() {
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        const exportJsonlBtn = document.getElementById('exportJsonlBtn');
        
        exportCsvBtn.addEventListener('click', (e) => {
            e.preventDefault();
            downloadData();
        });
        
        exportJsonlBtn.addEventListener('click', (e) => {
            e.preventDefault();
            downloadJsonLines();
        });
    }
    
    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    GridPersone.init();
});