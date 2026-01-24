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

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    ServizioDetail.init();
});
