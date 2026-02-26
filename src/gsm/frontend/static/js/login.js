const LoginManager = (() => {

    function init() {
        console.log('Inizializzazione pagina login');
        checkCurrentUser();
        setupEventListeners();
    }

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

    function setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await login();
        });

        document.getElementById('logoutBtn').addEventListener('click', async () => {
            await logout();
        });
    }

    async function login() {
        const loginBtn = document.getElementById('loginBtn');
        const btnText = document.getElementById('loginBtnText');
        const btnSpinner = document.getElementById('loginBtnSpinner');
        const errorMessage = document.getElementById('errorMessage');
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            showError('Inserisci username e password');
            return;
        }
        
        // Mostra loading
        loginBtn.disabled = true;
        btnText.textContent = 'Accesso in corso...';
        btnSpinner.classList.remove('d-none');
        errorMessage.classList.add('d-none');
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showUserLogged(username);
            } else {
                showError(result.error || 'Username o password non validi');
            }
        } catch (error) {
            console.error('Error during login:', error);
            showError('Errore di connessione al server');
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
        btnText.textContent = 'Disconnessione...';
        btnSpinner.classList.remove('d-none');
        
        try {
            const response = await fetch('/api/logout', {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showLoginForm();
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
            } else {
                console.error('Logout error:', result.error);
            }
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            logoutBtn.disabled = false;
            btnText.textContent = 'Disconnetti';
            btnSpinner.classList.add('d-none');
        }
    }

    function showUserLogged(username) {
        document.getElementById('currentUsername').textContent = username;
        document.getElementById('userLoggedInfo').classList.remove('d-none');
        document.getElementById('loginForm').classList.add('d-none');
        document.getElementById('loggedActions').classList.remove('d-none');
    }

    function showLoginForm() {
        document.getElementById('userLoggedInfo').classList.add('d-none');
        document.getElementById('loginForm').classList.remove('d-none');
        document.getElementById('loggedActions').classList.add('d-none');
        document.getElementById('errorMessage').classList.add('d-none');
    }

    function showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    LoginManager.init();
});
