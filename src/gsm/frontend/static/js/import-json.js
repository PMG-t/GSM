const ImportJsonData = (() => {

    let currentSessionId = null;

    function init() {
        console.log('Inizializzazione del modulo Import JSON');
        setupEventListeners();
    }

    function setupEventListeners() {
        const importJsonForm = document.getElementById('importJsonForm');
        const confirmBtn = document.getElementById('confirmJsonImportBtn');
        const cancelBtn = document.getElementById('cancelJsonImportBtn');

        if (importJsonForm) {
            importJsonForm.addEventListener('submit', handleJsonPreview);
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', handleJsonImportConfirm);
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', handleJsonImportCancel);
        }
    }

    function handleJsonPreview(e) {
        e.preventDefault();

        const personFile = document.getElementById('jsonPersoneFile').files[0];
        const serviziFile = document.getElementById('jsonServiziFile').files[0];
        const bisogniFile = document.getElementById('jsonBisogniFile').files[0];
        const monitorFile = document.getElementById('jsonMonitorFile').files[0];
        const dbName = document.getElementById('jsonDbName').value;

        if (!personFile || !serviziFile || !bisogniFile || !monitorFile || !dbName) {
            alert('Per favore carica tutti i file e specifica il nome del database');
            return;
        }

        const submitBtn = document.getElementById('submitJsonBtn');
        const btnText = document.getElementById('jsonBtnText');
        const btnSpinner = document.getElementById('jsonBtnSpinner');

        // Disabilita il pulsante e mostra lo spinner
        submitBtn.disabled = true;
        btnText.classList.add('d-none');
        btnSpinner.classList.remove('d-none');

        // Mostra la barra di progresso
        const progressSection = document.getElementById('jsonProgressSection');
        progressSection.classList.remove('d-none');

        // Simula il progresso
        simulateProgress();

        // Crea FormData con i file
        const formData = new FormData();
        formData.append('persone_file', personFile);
        formData.append('servizi_file', serviziFile);
        formData.append('bisogni_file', bisogniFile);
        formData.append('monitor_file', monitorFile);
        formData.append('db_name', dbName);

        // Invia al server
        fetch('/preview-jsonl', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                console.log('Preview response:', data);

                if (data.success) {
                    currentSessionId = data.session_id;
                    showJsonPreview(data);
                } else {
                    alert('Errore: ' + (data.error || 'Errore sconosciuto'));
                }

                // Completa la barra di progresso
                completeJsonProgress();
                submitBtn.disabled = false;
                btnText.classList.remove('d-none');
                btnSpinner.classList.add('d-none');
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Errore nella comunicazione con il server: ' + error.message);
                submitBtn.disabled = false;
                btnText.classList.remove('d-none');
                btnSpinner.classList.add('d-none');
                progressSection.classList.add('d-none');
            });
    }

    function simulateProgress() {
        const progressBar = document.getElementById('jsonProgressBar');
        const progressMessage = document.getElementById('jsonProgressMessage');
        let progress = 0;

        const interval = setInterval(() => {
            progress += Math.random() * 25;
            if (progress > 90) progress = 90;

            progressBar.style.width = progress + '%';
            progressBar.textContent = Math.round(progress) + '%';
            progressMessage.textContent = 'Validazione file JSONL...';

            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 200);
    }

    function completeJsonProgress() {
        const progressBar = document.getElementById('jsonProgressBar');
        const progressMessage = document.getElementById('jsonProgressMessage');

        progressBar.style.width = '100%';
        progressBar.textContent = '100%';
        progressMessage.textContent = 'Validazione completata!';
    }

    function showJsonPreview(data) {
        document.getElementById('jsonTotalPersone').textContent = data.persone_count;
        document.getElementById('jsonTotalServizi').textContent = data.servizi_count;
        document.getElementById('jsonTotalBisogni').textContent = data.bisogni_count;
        document.getElementById('jsonTotalMonitor').textContent = data.monitor_count;

        // Nascondi il form e mostra la preview
        document.getElementById('importJsonForm').classList.add('d-none');
        document.getElementById('jsonPreviewSection').classList.remove('d-none');
    }

    function handleJsonImportConfirm() {
        if (!currentSessionId) {
            alert('Sessione non valida');
            return;
        }

        const confirmBtn = document.getElementById('confirmJsonImportBtn');
        const confirmBtnText = document.getElementById('confirmJsonBtnText');
        const confirmBtnSpinner = document.getElementById('confirmJsonBtnSpinner');

        // Disabilita il pulsante e mostra lo spinner
        confirmBtn.disabled = true;
        confirmBtnText.classList.add('d-none');
        confirmBtnSpinner.classList.remove('d-none');

        // Invia la richiesta di conferma
        fetch('/confirm-import-jsonl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: currentSessionId
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Confirm response:', data);

                if (data.success) {
                    showJsonImportSuccess(data);
                } else {
                    alert('Errore: ' + (data.error || 'Errore sconosciuto'));
                }

                confirmBtn.disabled = false;
                confirmBtnText.classList.remove('d-none');
                confirmBtnSpinner.classList.add('d-none');
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Errore nella comunicazione con il server: ' + error.message);
                confirmBtn.disabled = false;
                confirmBtnText.classList.remove('d-none');
                confirmBtnSpinner.classList.add('d-none');
            });
    }

    function showJsonImportSuccess(data) {
        // Nascondi la sezione preview
        document.getElementById('jsonPreviewSection').classList.add('d-none');

        // Mostra il riepilogo dei risultati
        const resultHtml = `
            <div class="alert alert-success" role="alert">
                <h5>✓ Importazione Completata con Successo!</h5>
                <p class="mb-0">Database "<strong>${data.db_name}</strong>" creato con:</p>
                <ul class="mb-0 mt-2">
                    <li><strong>${data.num_persone}</strong> persone</li>
                    <li><strong>${data.num_servizi}</strong> servizi</li>
                    <li><strong>${data.num_bisogni}</strong> bisogni</li>
                    <li><strong>${data.num_monitor}</strong> monitor</li>
                </ul>
            </div>
            <div class="mt-3">
                <button class="btn btn-primary" onclick="location.reload()">Ricarica Pagina</button>
            </div>
        `;

        document.getElementById('jsonResultSection').innerHTML = resultHtml;
        document.getElementById('jsonResultSection').classList.remove('d-none');
    }

    function handleJsonImportCancel() {
        // Reimposta i file input
        document.getElementById('importJsonForm').reset();
        
        // Nascondi la preview
        document.getElementById('jsonPreviewSection').classList.add('d-none');
        
        // Mostra il form
        document.getElementById('importJsonForm').classList.remove('d-none');
        
        // Nascondi il risultato
        document.getElementById('jsonResultSection').classList.add('d-none');
        document.getElementById('jsonResultSection').innerHTML = '';
        
        currentSessionId = null;
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    ImportJsonData.init();
});
