const DBSelector = (() => {

    let tomSelectInstance = null;

    function init() {
        console.log('Inizializzazione DB Selector');
        checkCurrentDatabase();
        loadAvailableDatabases();
        setupEventListeners();
    }

    async function checkCurrentDatabase() {
        try {
            const response = await fetch('/api/current-db');
            const result = await response.json();
            
            if (result.success && result.db_name) {
                showDatabaseSelected(result.db_name);
            } else {
                showDatabaseSelector();
            }
        } catch (error) {
            console.error('Error checking current database:', error);
            showDatabaseSelector();
        }
    }

    async function loadAvailableDatabases() {
        try {
            const response = await fetch('/api/list-databases');
            const result = await response.json();
            
            if (result.success) {
                populateDbSelect(result.databases);
            } else {
                console.error('Error loading databases:', result.error);
            }
        } catch (error) {
            console.error('Error fetching databases:', error);
        }
    }

    function populateDbSelect(databases) {
        const selectElement = document.getElementById('dbSelect');
        
        // Pulisci select
        selectElement.innerHTML = '<option value="">-- Seleziona database esistente --</option>';
        
        // Aggiungi database
        databases.forEach(db => {
            const option = document.createElement('option');
            option.value = db;
            option.textContent = db;
            selectElement.appendChild(option);
        });
        
        // Inizializza Tom Select
        if (tomSelectInstance) {
            tomSelectInstance.destroy();
        }
        
        tomSelectInstance = new TomSelect('#dbSelect', {
            create: false,
            sortField: 'text',
            placeholder: 'Seleziona un database...',
            maxOptions: null
        });
    }

    function setupEventListeners() {
        document.getElementById('selectDbBtn').addEventListener('click', selectDatabase);
        document.getElementById('changeDbBtn').addEventListener('click', showDatabaseSelector);
    }

    async function selectDatabase() {
        const selectBtn = document.getElementById('selectDbBtn');
        const btnText = document.getElementById('selectBtnText');
        const btnSpinner = document.getElementById('selectBtnSpinner');
        const errorMessage = document.getElementById('errorMessage');
        
        // Prendi il valore dal select
        const selectedDb = tomSelectInstance ? tomSelectInstance.getValue() : '';
        
        if (!selectedDb) {
            showError('Seleziona un database dalla lista');
            return;
        }
        
        // Mostra loading
        selectBtn.disabled = true;
        btnText.textContent = 'Connessione...';
        btnSpinner.classList.remove('d-none');
        errorMessage.classList.add('d-none');
        
        try {
            const response = await fetch('/api/select-db', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    db_name: selectedDb
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showDatabaseSelected(selectedDb);
            } else {
                showError(result.error || 'Errore durante la selezione del database');
            }
        } catch (error) {
            console.error('Error selecting database:', error);
            showError('Errore di connessione al server');
        } finally {
            selectBtn.disabled = false;
            btnText.textContent = 'Seleziona Database';
            btnSpinner.classList.add('d-none');
        }
    }

    function showDatabaseSelected(dbName) {
        document.getElementById('currentDbName').textContent = dbName;
        document.getElementById('dbSelectedInfo').classList.remove('d-none');
        document.getElementById('dbSelectorForm').classList.add('d-none');
        document.getElementById('dbSelectedActions').classList.remove('d-none');
    }

    function showDatabaseSelector() {
        document.getElementById('dbSelectedInfo').classList.add('d-none');
        document.getElementById('dbSelectorForm').classList.remove('d-none');
        document.getElementById('dbSelectedActions').classList.add('d-none');
        document.getElementById('errorMessage').classList.add('d-none');
        
        // Ricarica i database disponibili
        loadAvailableDatabases();
    }

    function showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    DBSelector.init();
});
