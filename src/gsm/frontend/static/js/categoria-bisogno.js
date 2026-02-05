const CategoriaBisognoDetail = (() => {

    let categoria = null;
    let persone = [];
    let aggiornamenti = [];
    let bisogni = [];
    let personeData = [];

    function init() {
        console.log('Inizializzazione dettaglio categoria bisogno');
        categoria = window.categoriaData;
        console.log('Categoria:', categoria);
        
        fetchDatiCategoria();
    }

    function fetchDatiCategoria() {
        // Fetch dati categoria
        fetch('/dati_categoria_bisogno', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                categoria: categoria
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Dati categoria ricevuti:', data);
                persone = data.persone || [];
                aggiornamenti = data.aggiornamenti || [];
                
                // Aggiorna i badge
                document.getElementById('numBisogni').textContent = data.num_bisogni || 0;
                document.getElementById('numPersone').textContent = persone.length;
                
                renderPersone();
                renderAggiornamenti();
            })
            .catch(error => console.error('Errore nel caricamento dati categoria:', error));
        
        // Fetch bisogni e persone per la sezione bisogni specifici
        Promise.all([
            fetch('/q', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: 'bisogni' })
            }),
            fetch('/q', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: 'persone' })
            })
        ])
            .then(([bisogniRes, personeRes]) => Promise.all([bisogniRes.json(), personeRes.json()]))
            .then(([bisogniResult, personeResult]) => {
                bisogni = bisogniResult.data.filter(b => b.categoria_bisogno === categoria);
                personeData = personeResult.data;
                renderBisogniSpecifici();
                setupBisogniFilter();
            })
            .catch(error => console.error('Errore nel caricamento bisogni:', error));
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
                headerName: 'Bisogno',
                field: 'nome_bisogno',
                sortable: true,
                filter: true,
                width: 200
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

    function countPersonePerBisogno(bisognoId) {
        // Conta quante persone hanno questo bisogno specifico
        let count = 0;
        personeData.forEach(persona => {
            if (persona.bisogni && persona.bisogni[bisognoId] && persona.bisogni[bisognoId].length > 0) {
                count++;
            }
        });
        return count;
    }

    function renderBisogniSpecifici() {
        const container = document.getElementById('bisogniChipsContainer');
        
        if (!bisogni || bisogni.length === 0) {
            container.innerHTML = '<p class="text-muted">Nessun bisogno disponibile</p>';
            return;
        }

        // Ordina i bisogni per numero di persone (decrescente)
        const bisogniOrdinati = bisogni.map(bisogno => ({
            ...bisogno,
            numPersone: countPersonePerBisogno(bisogno._id)
        })).sort((a, b) => b.numPersone - a.numPersone);

        const chipsHtml = bisogniOrdinati.map(bisogno => {
            const nomeBisogno = bisogno.nome_bisogno || 'N/A';
            const descrizione = bisogno.descrizione_bisogno || '';
            const numPersoneBisogno = bisogno.numPersone;
            const badgeHtml = numPersoneBisogno > 0 
                ? `<span class="badge bg-primary ms-2" style="font-size: 0.75rem;">${numPersoneBisogno}</span>`
                : '';
            return `
                <span class="badge bg-light text-dark border bisogno-chip" 
                      data-nome="${nomeBisogno.toLowerCase()}"
                      title="${descrizione}"
                      style="cursor: default; margin: 0.25rem; padding: 0.5rem 0.75rem; font-size: 0.9rem;">
                    ${nomeBisogno}
                    ${badgeHtml}
                </span>
            `;
        }).join('');

        container.innerHTML = chipsHtml;
    }

    function setupBisogniFilter() {
        const filterInput = document.getElementById('bisogniFilter');
        
        if (!filterInput) return;
        
        filterInput.addEventListener('input', (e) => {
            const filterText = e.target.value.toLowerCase();
            const chips = document.querySelectorAll('#bisogniChipsContainer .bisogno-chip');

            chips.forEach(chip => {
                const nomeBisogno = chip.dataset.nome;
                if (nomeBisogno.includes(filterText)) {
                    chip.style.display = 'inline-block';
                } else {
                    chip.style.display = 'none';
                }
            });
        });
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    CategoriaBisognoDetail.init();
});
