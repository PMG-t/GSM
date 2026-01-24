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
                serviziData = data.data;
                renderServizi(data.data);
            })
            .catch(error => console.error('Errore nel caricamento servizi:', error));
    }

    function renderServizi(servizi) {
        const container = document.getElementById('servizi-container');
        
        if (!servizi || servizi.length === 0) {
            container.innerHTML = '<p class="text-muted">Nessun servizio disponibile</p>';
            return;
        }

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

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    Servizi.init();
});
