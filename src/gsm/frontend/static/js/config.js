const ConfigManager = (() => {

    let tomSelectInstance = null;

    function init() {
        console.log('Inizializzazione configurazione sistema');
        checkCurrentUser();
        checkCurrentDatabase();
        loadAvailableDatabases();
        setupEventListeners();
    }

    // ==================== User Management ====================

    async function checkCurrentUser() {
        try {
            const response = await fetch('/api/current-user');
            const result = await response.json();
            
            if (result.success && result.username) {
                showUserLogged(result.username);
            } else {
                showLoginForm();
            }
        } catch (error) {
            console.error('Error checking current user:', error);
            showLoginForm();
        }
    }

    function showUserLogged(username) {
        document.getElementById('currentUsername').textContent = username;
        document.getElementById('userLoggedInfo').classList.remove('d-none');
        document.getElementById('loginForm').classList.add('d-none');
        updateNavigationVisibility();
    }

    function showLoginForm() {
        document.getElementById('userLoggedInfo').classList.add('d-none');
        document.getElementById('loginForm').classList.remove('d-none');
        document.getElementById('loginErrorMessage').classList.add('d-none');
        updateNavigationVisibility();
    }

    async function login(e) {
        e.preventDefault();
        
        const loginBtn = document.getElementById('loginBtn');
        const btnText = document.getElementById('loginBtnText');
        const btnSpinner = document.getElementById('loginBtnSpinner');
        const errorMessage = document.getElementById('loginErrorMessage');
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            showLoginError('Inserisci username e password!');
            return;
        }
        
        loginBtn.disabled = true;
        btnText.textContent = 'Sto entrando...';
        btnSpinner.classList.remove('d-none');
        errorMessage.classList.add('d-none');
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showUserLogged(username);
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
            } else {
                showLoginError(result.error || 'Ops, qualcosa non va...');
            }
        } catch (error) {
            console.error('Error during login:', error);
            showLoginError('Non riesco a connettermi al server');
        } finally {
            loginBtn.disabled = false;
            btnText.textContent = 'Accedi';
            btnSpinner.classList.add('d-none');
        }
    }

    async function logout() {
        const logoutBtn = document.getElementById('logoutBtn');
        const btnText = document.getElementById('logoutBtnText');
        const btnSpinner = document.getElementById('logoutBtnSpinner');
        
        logoutBtn.disabled = true;
        btnText.textContent = 'Sto uscendo...';
        btnSpinner.classList.remove('d-none');
        
        try {
            const response = await fetch('/api/logout', { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                showLoginForm();
            }
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            logoutBtn.disabled = false;
            btnText.textContent = 'Esci';
            btnSpinner.classList.add('d-none');
        }
    }

    function showLoginError(message) {
        const errorMessage = document.getElementById('loginErrorMessage');
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }

    // ==================== Database Management ====================

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
            }
        } catch (error) {
            console.error('Error fetching databases:', error);
        }
    }

    function populateDbSelect(databases) {
        const selectElement = document.getElementById('dbSelect');
        
        selectElement.innerHTML = '<option value="">-- Seleziona database --</option>';
        
        databases.forEach(db => {
            const option = document.createElement('option');
            option.value = db;
            option.textContent = db;
            selectElement.appendChild(option);
        });
        
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

    async function selectDatabase() {
        const selectBtn = document.getElementById('selectDbBtn');
        const btnText = document.getElementById('selectBtnText');
        const btnSpinner = document.getElementById('selectBtnSpinner');
        const errorMessage = document.getElementById('dbErrorMessage');
        
        const selectedDb = tomSelectInstance ? tomSelectInstance.getValue() : '';
        
        if (!selectedDb) {
            showDbError('Scegli un database dalla lista!');
            return;
        }
        
        selectBtn.disabled = true;
        btnText.textContent = 'Caricamento...';
        btnSpinner.classList.remove('d-none');
        errorMessage.classList.add('d-none');
        
        try {
            const response = await fetch('/api/select-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ db_name: selectedDb })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showDatabaseSelected(selectedDb);
            } else {
                showDbError(result.error || 'Ops, non riesco a caricare il database');
            }
        } catch (error) {
            console.error('Error selecting database:', error);
            showDbError('Non riesco a connettermi al server');
        } finally {
            selectBtn.disabled = false;
            btnText.textContent = 'Ok, usa questo';
            btnSpinner.classList.add('d-none');
        }
    }

    function showDatabaseSelected(dbName) {
        document.getElementById('currentDbName').textContent = dbName;
        document.getElementById('dbSelectedInfo').classList.remove('d-none');
        document.getElementById('dbSelectorForm').classList.add('d-none');
        updateNavigationVisibility();
    }

    function showDatabaseSelector() {
        document.getElementById('dbSelectedInfo').classList.add('d-none');
        document.getElementById('dbSelectorForm').classList.remove('d-none');
        document.getElementById('dbErrorMessage').classList.add('d-none');
        updateNavigationVisibility();
        loadAvailableDatabases();
    }

    function showDbError(message) {
        const errorMessage = document.getElementById('dbErrorMessage');
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }

    // ==================== Navigation ====================

    function updateNavigationVisibility() {
        const userLogged = !document.getElementById('loginForm').classList.contains('d-none') ? false : true;
        const dbSelected = !document.getElementById('dbSelectorForm').classList.contains('d-none') ? false : true;
        
        const navigationLinks = document.getElementById('navigationLinks');
        if (userLogged && dbSelected) {
            navigationLinks.style.display = 'block';
        } else {
            navigationLinks.style.display = 'none';
        }
    }

    // ==================== Event Listeners ====================

    function setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', login);
        document.getElementById('logoutBtn').addEventListener('click', logout);
        document.getElementById('selectDbBtn').addEventListener('click', selectDatabase);
        document.getElementById('changeDbBtn').addEventListener('click', showDatabaseSelector);
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    ConfigManager.init();
});
