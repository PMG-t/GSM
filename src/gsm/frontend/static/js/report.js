const Report = (() => {

    let records_persone = [];
    let fields_persone = [];

    let records_servizi = [];
    let fields_servizi = [];
    let serviziMap = {};

    let records_bisogni = [];
    let fields_bisogni = [];
    let bisogniMap = {};

    let records_aggiornamenti = [];
    let fields_aggiornamenti = [];

    function init() {
        console.log('Inizializzazione pagina report');
        fetchData();
        setupExportButtons();
    }

    function fetchData() {
        // Fetch persone
        fetch('/q', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'persone'
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Dati persone ricevuti:', data);
                records_persone = data.data;
                fields_persone = data.columns;
                checkDataLoaded();
            })
            .catch(error => console.error('Errore nel caricamento persone:', error));

        // Fetch servizi
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
                console.log('Dati servizi ricevuti:', data);
                records_servizi = data.data;
                fields_servizi = data.columns;
                serviziMap = data.data.reduce((map, servizio) => {
                    map[servizio._id] = servizio.descrizione_servizio || servizio.nome_servizio;
                    return map;
                }, {});
                checkDataLoaded();
            })
            .catch(error => console.error('Errore nel caricamento servizi:', error));

        // Fetch bisogni
        fetch('/q', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'bisogni'
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Dati bisogni ricevuti:', data);
                records_bisogni = data.data;
                fields_bisogni = data.columns;
                bisogniMap = data.data.reduce((map, bisogno) => {
                    map[bisogno._id] = bisogno.descrizione_bisogno || bisogno.nome_bisogno;
                    return map;
                }, {});
                checkDataLoaded();
            })
            .catch(error => console.error('Errore nel caricamento bisogni:', error));

        // Fetch aggiornamenti
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
                records_aggiornamenti = data.data;
                fields_aggiornamenti = data.columns;
                checkDataLoaded();
            })
            .catch(error => console.error('Errore nel caricamento aggiornamenti:', error));
    }

    function checkDataLoaded() {
        if (records_persone.length > 0 && records_servizi.length > 0 && records_bisogni.length > 0 && records_aggiornamenti.length > 0) {
            document.getElementById('loading').style.display = 'none';
            console.log('Tutti i dati caricati, pronti per i grafici');
            createTimelineChart();
            createGenereChart();
            createCondizioneAbitativaChart();
        }
    }

    function createTimelineChart() {
        // Prepara i dati con le date
        const data = records_aggiornamenti.map(agg => ({
            data: new Date(agg.data),
            count: 1
        }));

        console.log('Dati timeline:', data);

        const spec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "Andamento degli accessi nel tempo",
            "data": { "values": data },
            "mark": "bar",
            "encoding": {
                "x": {
                    "timeUnit": "yearmonthdate",
                    "field": "data",
                    "type": "temporal",
                    "axis": { 
                        "title": "Data",
                        "format": "%d/%m/%Y"
                    }
                },
                "y": {
                    "aggregate": "sum",
                    "field": "count",
                    "type": "quantitative",
                    "axis": { "title": "Numero accessi" }
                },
                "color": {
                    "value": "#4c78a8"
                }
            }
        };

        console.log('Creazione chart timeline in #vis-timeline');
        
        // Calcola larghezza dal container
        const container = document.querySelector('#vis-timeline');
        const width = container.offsetWidth - 60;
        spec.width = width;
        spec.height = 200;
        
        vegaEmbed('#vis-timeline', spec, { 
            actions: false,
            renderer: 'canvas'
        })
            .then(result => console.log('Chart timeline creato con successo', result))
            .catch(error => console.error('Errore creazione chart timeline:', error));
    }

    function createGenereChart() {
        // Aggrega i dati per genere
        const genereCounts = {};
        records_persone.forEach(persona => {
            const genere = persona.genere || 'Non specificato';
            genereCounts[genere] = (genereCounts[genere] || 0) + 1;
        });

        // Converti in array per Vega
        const data = Object.keys(genereCounts).map(genere => ({
            genere: genere,
            count: genereCounts[genere]
        }));

        console.log('Dati genere:', data);

        const spec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "Distribuzione per genere",
            "data": { "values": data },
            "mark": "bar",
            "encoding": {
                "x": {
                    "field": "genere",
                    "type": "nominal",
                    "axis": { 
                        "title": "Genere",
                        "labelAngle": 0
                    }
                },
                "y": {
                    "field": "count",
                    "type": "quantitative",
                    "axis": { "title": "Numero persone" }
                },
                "color": {
                    "field": "genere",
                    "type": "nominal",
                    "legend": null
                }
            }
        };

        console.log('Creazione chart genere in #vis-1');
        
        // Calcola larghezza dal container
        const container = document.querySelector('#vis-1');
        const width = container.offsetWidth - 60; // Padding + margine
        spec.width = width;
        spec.height = 200;
        
        vegaEmbed('#vis-1', spec, { 
            actions: false,
            renderer: 'canvas'
        })
            .then(result => console.log('Chart genere creato con successo', result))
            .catch(error => console.error('Errore creazione chart genere:', error));
    }

    function createCondizioneAbitativaChart() {
        // Aggrega i dati per condizione_abitativa e genere
        const aggregated = {};
        
        records_persone.forEach(persona => {
            const condizione = persona.condizione_abitativa || 'Non specificato';
            const genere = persona.genere || 'Non specificato';
            
            if (!aggregated[condizione]) {
                aggregated[condizione] = {};
            }
            aggregated[condizione][genere] = (aggregated[condizione][genere] || 0) + 1;
        });

        // Converti in formato per Vega
        const data = [];
        Object.keys(aggregated).forEach(condizione => {
            Object.keys(aggregated[condizione]).forEach(genere => {
                data.push({
                    condizione: condizione,
                    genere: genere,
                    count: aggregated[condizione][genere]
                });
            });
        });

        console.log('Dati condizione abitativa:', data);

        const spec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "Condizione abitativa per genere",
            "data": { "values": data },
            "mark": "bar",
            "encoding": {
                "x": {
                    "field": "condizione",
                    "type": "nominal",
                    "axis": { 
                        "title": "Condizione Abitativa",
                        "labelAngle": -45
                    }
                },
                "y": {
                    "field": "count",
                    "type": "quantitative",
                    "axis": { "title": "Numero persone" }
                },
                "color": {
                    "field": "genere",
                    "type": "nominal",
                    "legend": { "title": "Genere" }
                },
                "xOffset": {
                    "field": "genere"
                }
            }
        };

        console.log('Creazione chart condizione abitativa in #vis-2');
        
        // Calcola larghezza dal container
        const container = document.querySelector('#vis-2');
        const width = container.offsetWidth - 60;
        spec.width = width;
        spec.height = 200;
        
        vegaEmbed('#vis-2', spec, { 
            actions: false,
            renderer: 'canvas'
        })
            .then(result => console.log('Chart condizione abitativa creato con successo', result))
            .catch(error => console.error('Errore creazione chart condizione abitativa:', error));
    }

    function downloadCsv() {
        const today = new Date().toISOString().split('T')[0];
        
        if (!records_persone || records_persone.length === 0) {
            alert('Nessun dato da esportare');
            return;
        }
        
        // Export persone come CSV
        const headers = fields_persone;
        const csvRows = [];
        csvRows.push(headers.join(','));
        
        records_persone.forEach(persona => {
            const row = headers.map(header => {
                let value = persona[header] || '';
                
                // Gestisci servizi e bisogni
                if ((header === 'servizi' || header === 'bisogni') && typeof value === 'object') {
                    const ids = Object.keys(value);
                    const map = header === 'servizi' ? serviziMap : bisogniMap;
                    value = ids.map(id => map[id] || id).join('; ');
                }
                
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
        a.download = `report_persone_${today}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    function downloadJsonLines() {
        const today = new Date().toISOString().split('T')[0];
        
        if (!records_persone || records_persone.length === 0) {
            alert('Nessun dato da esportare');
            return;
        }
        
        const jsonLines = records_persone.map(record => JSON.stringify(record)).join('\n');
        
        const blob = new Blob([jsonLines], { type: 'application/jsonl' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_persone_${today}.jsonl`;
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
    Report.init();
});
