const ExportData = (() => {

    let statsLoaded = false;

    function init() {
        console.log('Inizializzazione del modulo Export');
        setupEventListeners();
        setupTabChangeListener();
    }

    function setupEventListeners() {
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', handleExport);
        }
    }

    function setupTabChangeListener() {
        // Carica le statistiche quando si passa al tab export
        const exportTab = document.getElementById('tab-export');
        if (exportTab) {
            exportTab.addEventListener('click', () => {
                if (!statsLoaded) {
                    loadExportStats();
                    statsLoaded = true;
                }
            });
        }
    }

    function loadExportStats() {
        console.log('Caricamento statistiche export...');
        
        // Carica le statistiche delle collections
        Promise.all([
            fetch('/q', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: 'persone' })
            }).then(r => r.json()),
            fetch('/q', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: 'servizi' })
            }).then(r => r.json()),
            fetch('/q', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: 'bisogni' })
            }).then(r => r.json()),
            fetch('/q', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: 'monitor' })
            }).then(r => r.json())
        ])
        .then(([personeRes, serviziRes, bisogniRes, monitorRes]) => {
            const countPersone = personeRes.data ? personeRes.data.length : 0;
            const countServizi = serviziRes.data ? serviziRes.data.length : 0;
            const countBisogni = bisogniRes.data ? bisogniRes.data.length : 0;
            const countMonitor = monitorRes.data ? monitorRes.data.length : 0;
            
            // Aggiorna i numeri
            document.getElementById('statPersone').textContent = countPersone;
            document.getElementById('statServizi').textContent = countServizi;
            document.getElementById('statBisogni').textContent = countBisogni;
            document.getElementById('statMonitor').textContent = countMonitor;
            
            // Mostra la sezione statistiche
            document.getElementById('exportStatsLoading').classList.add('d-none');
            document.getElementById('exportStatsSection').classList.remove('d-none');
            
            console.log('Statistiche caricate:', {
                persone: countPersone,
                servizi: countServizi,
                bisogni: countBisogni,
                monitor: countMonitor
            });
        })
        .catch(error => {
            console.error('Errore nel caricamento delle statistiche:', error);
            document.getElementById('exportStatsLoading').innerHTML = '<small class="text-danger">Errore nel caricamento delle statistiche</small>';
        });
    }

    function handleExport() {
        console.log('Inizio esportazione...');
        
        const exportBtn = document.getElementById('exportBtn');
        const exportBtnText = document.getElementById('exportBtnText');
        const exportBtnSpinner = document.getElementById('exportBtnSpinner');
        
        // Disabilita il pulsante e mostra lo spinner
        exportBtn.disabled = true;
        exportBtnText.classList.add('d-none');
        exportBtnSpinner.classList.remove('d-none');
        
        // Nascondi i messaggi precedenti
        document.getElementById('exportResultSection').classList.add('d-none');
        document.getElementById('exportErrorSection').classList.add('d-none');
        document.getElementById('exportProgressSection').classList.remove('d-none');
        
        // Simula progresso
        simulateProgress();
        
        // Effettua il download
        setTimeout(() => {
            downloadExport();
        }, 500);
    }

    function simulateProgress() {
        const progressBar = document.getElementById('exportProgressBar');
        const progressMessage = document.getElementById('exportProgressMessage');
        let progress = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            
            progressBar.style.width = progress + '%';
            progressBar.textContent = Math.round(progress) + '%';
            
            if (progress < 33) {
                progressMessage.textContent = 'Preparazione database...';
            } else if (progress < 66) {
                progressMessage.textContent = 'Esportazione collections...';
            } else {
                progressMessage.textContent = 'Compressione file...';
            }
            
            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 200);
    }

    function downloadExport() {
        console.log('Download dell\'export...');
        
        try {
            // Crea un link temporaneo per il download
            const link = document.createElement('a');
            link.href = '/export-db';
            link.download = '';  // Il server gestisce il nome del file
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Simula il completamento
            setTimeout(() => {
                completeExport(true);
            }, 1500);
            
        } catch (error) {
            console.error('Errore durante il download:', error);
            completeExport(false, error.message);
        }
    }

    function completeExport(success, errorMessage = '') {
        const exportBtn = document.getElementById('exportBtn');
        const exportBtnText = document.getElementById('exportBtnText');
        const exportBtnSpinner = document.getElementById('exportBtnSpinner');
        const progressBar = document.getElementById('exportProgressBar');
        const progressMessage = document.getElementById('exportProgressMessage');
        
        // Riabilita il pulsante
        exportBtn.disabled = false;
        exportBtnText.classList.remove('d-none');
        exportBtnSpinner.classList.add('d-none');
        
        if (success) {
            // Completa la barra di progresso
            progressBar.style.width = '100%';
            progressBar.textContent = '100%';
            progressMessage.textContent = 'Esportazione completata!';
            
            // Mostra il messaggio di successo
            setTimeout(() => {
                document.getElementById('exportProgressSection').classList.add('d-none');
                document.getElementById('exportResultSection').classList.remove('d-none');
            }, 500);
            
        } else {
            // Mostra il messaggio di errore
            document.getElementById('exportProgressSection').classList.add('d-none');
            document.getElementById('exportErrorMessage').textContent = errorMessage || 'Si è verificato un errore sconosciuto';
            document.getElementById('exportErrorSection').classList.remove('d-none');
        }
    }
    
    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    ExportData.init();
});
