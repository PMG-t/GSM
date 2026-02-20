const ImportData = (() => {

    let isImporting = false;
    let sessionId = null;
    let previewGridApi = null;

    function init() {
        console.log('Inizializzazione pagina import');
        setupForm();
        setupPreviewButtons();
    }

    function setupForm() {
        const form = document.getElementById('importForm');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (isImporting) {
                return;
            }
            
            const sportelloFile = document.getElementById('sportelloFile').files[0];
            const guardarobaFile = document.getElementById('guardarobaFile').files[0];
            const dbName = document.getElementById('dbName').value.trim();
            
            if (!sportelloFile || !guardarobaFile) {
                showError('Seleziona entrambi i file Excel');
                return;
            }
            
            if (!dbName) {
                showError('Inserisci il nome del database');
                return;
            }
            
            await loadPreview(sportelloFile, guardarobaFile, dbName);
        });
    }

    function setupPreviewButtons() {
        document.getElementById('confirmImportBtn').addEventListener('click', async () => {
            if (!sessionId) {
                showError('Nessuna sessione attiva');
                return;
            }
            
            if (!confirm('Confermi di voler procedere con l\'importazione? Questa operazione sovrascriverà i dati esistenti.')) {
                return;
            }
            
            await confirmImport();
        });

        document.getElementById('cancelImportBtn').addEventListener('click', () => {
            cancelImport();
        });
    }

    async function loadPreview(sportelloFile, guardarobaFile, dbName) {
        isImporting = true;
        
        // Mostra UI di caricamento
        showProgress(0, 'Caricamento file...');
        disableForm();
        hidePreview();
        hideResults();
        
        try {
            // Crea FormData
            const formData = new FormData();
            formData.append('sportello_file', sportelloFile);
            formData.append('guardaroba_file', guardarobaFile);
            formData.append('db_name', dbName);
            
            updateProgress(30, 'Elaborazione dati...');
            
            // Invia al server per preview
            const response = await fetch('/preview-excel', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                updateProgress(100, 'Anteprima pronta!');
                sessionId = result.session_id;
                showPreview(result.preview_data, result.total_rows);
                
                // Nascondi progress dopo 1 secondo
                setTimeout(() => {
                    document.getElementById('progressSection').classList.add('d-none');
                }, 1000);
            } else {
                throw new Error(result.error || 'Errore durante il caricamento');
            }
            
        } catch (error) {
            console.error('Errore caricamento:', error);
            showError(error.message || 'Errore durante il caricamento dei dati');
        } finally {
            isImporting = false;
        }
    }

    async function confirmImport() {
        isImporting = true;
        disablePreviewButtons();
        showProgress(0, 'Avvio importazione...');
        
        try {
            updateProgress(30, 'Importazione dati nel database...');
            
            const response = await fetch('/confirm-import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId
                })
            });
            
            const result = await response.json();
            
            updateProgress(80, 'Finalizzazione...');
            
            if (response.ok && result.success) {
                updateProgress(100, 'Importazione completata con successo!');
                showSuccess(result);
                hidePreview();
            } else {
                throw new Error(result.error || 'Errore durante l\'importazione');
            }
            
        } catch (error) {
            console.error('Errore importazione:', error);
            showError(error.message || 'Errore durante l\'importazione dei dati');
            enablePreviewButtons();
        } finally {
            isImporting = false;
            sessionId = null;
        }
    }

    function cancelImport() {
        if (sessionId) {
            // Informa il server di pulire i file temporanei
            fetch('/cancel-import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId
                })
            }).catch(err => console.error('Errore durante la cancellazione:', err));
            
            sessionId = null;
        }
        
        hidePreview();
        hideResults();
        enableForm();
    }

    function showPreview(previewData, totalRows) {
        const previewSection = document.getElementById('previewSection');
        const previewRows = Math.min(previewData.length, 200);
        
        document.getElementById('totalPersone').textContent = totalRows;
        document.getElementById('previewRows').textContent = previewRows;
        
        // Crea colonne dinamicamente dai dati
        const columnDefs = Object.keys(previewData[0] || {}).map(key => ({
            headerName: key,
            field: key,
            sortable: true,
            filter: true,
            resizable: true,
            width: 150
        }));
        
        const gridOptions = {
            columnDefs: columnDefs,
            rowData: previewData.slice(0, 200),
            defaultColDef: {
                resizable: true,
                sortable: true,
                filter: true
            }
        };
        
        const gridDiv = document.getElementById('preview-grid');
        if (previewGridApi) {
            previewGridApi.destroy();
        }
        previewGridApi = agGrid.createGrid(gridDiv, gridOptions);
        
        previewSection.classList.remove('d-none');
        
        // Scroll alla preview
        setTimeout(() => {
            previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    function hidePreview() {
        document.getElementById('previewSection').classList.add('d-none');
        if (previewGridApi) {
            previewGridApi.destroy();
            previewGridApi = null;
        }
    }

    function hideResults() {
        document.getElementById('resultSection').classList.add('d-none');
    }

    function showProgress(percent, message) {
        const progressSection = document.getElementById('progressSection');
        const progressBar = document.getElementById('progressBar');
        const progressMessage = document.getElementById('progressMessage');
        
        progressSection.classList.remove('d-none');
        progressBar.style.width = `${percent}%`;
        progressBar.textContent = `${percent}%`;
        progressMessage.textContent = message;
    }

    function updateProgress(percent, message) {
        showProgress(percent, message);
    }

    function showSuccess(result) {
        const resultSection = document.getElementById('resultSection');
        
        const html = `
            <div class="alert alert-success" role="alert">
                <h5 class="alert-heading">✅ Importazione completata con successo!</h5>
                <hr>
                <p class="mb-0"><strong>Servizi importati:</strong> ${result.num_servizi || 0}</p>
                <p class="mb-0"><strong>Persone importate:</strong> ${result.num_persone || 0}</p>
                <p class="mb-0"><strong>Bisogni importati:</strong> ${result.num_bisogni || 0}</p>
                <p class="mb-0"><strong>Monitor importati:</strong> ${result.num_monitor || 0}</p>
                <hr>
                <a href="/persone" class="btn btn-sm btn-success mt-2">Vai alle Persone</a>
            </div>
        `;
        
        resultSection.innerHTML = html;
        resultSection.classList.remove('d-none');
        
        // Nascondi progress dopo 2 secondi
        setTimeout(() => {
            document.getElementById('progressSection').classList.add('d-none');
        }, 2000);
        
        // Reset form
        document.getElementById('importForm').reset();
        enableForm();
    }

    function showError(message) {
        const resultSection = document.getElementById('resultSection');
        
        const html = `
            <div class="alert alert-danger" role="alert">
                <h5 class="alert-heading">❌ Errore</h5>
                <hr>
                <p class="mb-0">${message}</p>
            </div>
        `;
        
        resultSection.innerHTML = html;
        resultSection.classList.remove('d-none');
        
        // Nascondi progress
        document.getElementById('progressSection').classList.add('d-none');
        
        enableForm();
    }

    function disableForm() {
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const btnSpinner = document.getElementById('btnSpinner');
        
        submitBtn.disabled = true;
        btnText.textContent = 'Caricamento...';
        btnSpinner.classList.remove('d-none');
        
        document.getElementById('sportelloFile').disabled = true;
        document.getElementById('guardarobaFile').disabled = true;
        document.getElementById('dbName').disabled = true;
    }

    function enableForm() {
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const btnSpinner = document.getElementById('btnSpinner');
        
        submitBtn.disabled = false;
        btnText.textContent = 'Carica e Mostra Anteprima';
        btnSpinner.classList.add('d-none');
        
        document.getElementById('sportelloFile').disabled = false;
        document.getElementById('guardarobaFile').disabled = false;
        document.getElementById('dbName').disabled = false;
    }

    function disablePreviewButtons() {
        const confirmBtn = document.getElementById('confirmImportBtn');
        const confirmBtnText = document.getElementById('confirmBtnText');
        const confirmBtnSpinner = document.getElementById('confirmBtnSpinner');
        
        confirmBtn.disabled = true;
        confirmBtnText.textContent = 'Importazione in corso...';
        confirmBtnSpinner.classList.remove('d-none');
        
        document.getElementById('cancelImportBtn').disabled = true;
    }

    function enablePreviewButtons() {
        const confirmBtn = document.getElementById('confirmImportBtn');
        const confirmBtnText = document.getElementById('confirmBtnText');
        const confirmBtnSpinner = document.getElementById('confirmBtnSpinner');
        
        confirmBtn.disabled = false;
        confirmBtnText.textContent = '✓ Conferma Importazione';
        confirmBtnSpinner.classList.add('d-none');
        
        document.getElementById('cancelImportBtn').disabled = false;
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    ImportData.init();
});
