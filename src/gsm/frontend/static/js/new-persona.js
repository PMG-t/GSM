const NewPersona = (() => {

    let tomSelectInstances = [];

    function init() {
        console.log('Inizializzazione form nuova persona');
        initializeSelectFields();
        setupSaveButton();
    }

    function initializeSelectFields() {
        const selectFields = document.querySelectorAll('[data-select="true"]');
        
        selectFields.forEach(input => {
            const fieldName = input.id;
            const allowNew = input.getAttribute('data-select-new') === 'true';
            
            // Fetch valori univoci per questo campo
            fetch(`/unique-values/${fieldName}`)
                .then(response => response.json())
                .then(data => {
                    const values = data.values || [];
                    
                    // Converti input in select
                    const select = document.createElement('select');
                    select.id = input.id;
                    select.className = input.className;
                    
                    // Opzione vuota
                    const emptyOption = document.createElement('option');
                    emptyOption.value = '';
                    emptyOption.textContent = '-- Seleziona --';
                    select.appendChild(emptyOption);
                    
                    // Aggiungi opzioni
                    values.forEach(value => {
                        const option = document.createElement('option');
                        option.value = value;
                        option.textContent = value;
                        select.appendChild(option);
                    });
                    
                    // Sostituisci input con select
                    input.parentNode.replaceChild(select, input);
                    
                    // Inizializza TomSelect
                    const tomSelect = new TomSelect(select, {
                        create: allowNew,
                        sortField: 'text',
                        placeholder: '-- Seleziona --',
                        createOnBlur: true,
                        createFilter: (value) => value.trim().length > 0
                    });
                    
                    tomSelectInstances.push(tomSelect);
                })
                .catch(error => console.error(`Errore caricamento valori per ${fieldName}:`, error));
        });
    }

    function setupSaveButton() {
        const btnSave = document.getElementById('btnSave');
        btnSave.addEventListener('click', () => {
            if (validateForm()) {
                savePersona();
            }
        });
    }

    function validateForm() {
        const cognome = document.getElementById('cognome').value.trim();
        const nome = document.getElementById('nome').value.trim();

        if (!cognome || !nome) {
            alert('Cognome e Nome sono obbligatori');
            return false;
        }

        return true;
    }

    function getFormData() {
        const data = {
            cognome: document.getElementById('cognome').value.trim(),
            nome: document.getElementById('nome').value.trim(),
            data_nascita: document.getElementById('data_nascita').value || null,
            luogo_nascita: document.getElementById('luogo_nascita').value.trim(),
            genere: document.getElementById('genere').value,
            citta: document.getElementById('citta').value.trim(),
            documento: document.getElementById('documento').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            stato_civile: document.getElementById('stato_civile').value.trim(),
            figli: document.getElementById('figli').value.trim(),
            condizione_abitativa: document.getElementById('condizione_abitativa').value.trim(),
            categoria_ethos: document.getElementById('categoria_ethos').value.trim(),
            residenza: document.getElementById('residenza').value.trim(),
            servizi_sociali: document.getElementById('servizi_sociali').value.trim(),
            lavoro: document.getElementById('lavoro').value.trim(),
            istruzione: document.getElementById('istruzione').value.trim(),
            in_carico_presso: document.getElementById('in_carico_presso').value.trim(),
            servizi: {},
            bisogni: {}
        };

        // Calcola età se data_nascita è presente
        if (data.data_nascita) {
            const birthDate = new Date(data.data_nascita);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            data.eta = age;
        }

        return data;
    }

    function savePersona() {
        const personaData = getFormData();
        console.log('Salvataggio persona:', personaData);

        fetch('/create-persona', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(personaData)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Persona salvata:', data);
                if (data.success) {
                    alert('Persona creata con successo!');
                    window.location.href = `/persona/${data.persona_id}`;
                } else {
                    alert('Errore nel salvataggio: ' + (data.error || 'Errore sconosciuto'));
                }
            })
            .catch(error => {
                console.error('Errore:', error);
                alert('Errore nel salvataggio della persona');
            });
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    NewPersona.init();
});
