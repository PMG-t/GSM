const PersonaDetail = (() => {

    let personaData = null;
    let serviziMap = {};
    let bisogniMap = {};
    let serviziList = [];
    let bisogniList = [];
    let monitorList = [];
    let monitorMap = {};
    let monitorGridApi = null;

    function init() {
        console.log('Inizializzazione dettaglio persona');
        personaData = window.personaData;
        console.log('Dati persona:', personaData);
        
        fetchServiziBisogni();
        
        // Controlla se ci sono parametri URL per espandere un aggiornamento specifico
        checkUrlParams();
    }

    function checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const tipo = urlParams.get('tipo');
        const itemId = urlParams.get('item_id');
        const dataISO = urlParams.get('data');
        
        if (tipo && itemId && dataISO) {
            // Aspetta che i dati siano caricati e renderizzati
            setTimeout(() => {
                // Espandi l'accordion corretto
                const accordionId = tipo === 'servizio' ? 'collapseServizi' : 'collapseBisogni';
                const accordionElement = document.getElementById(accordionId);
                if (accordionElement) {
                    const bsCollapse = new bootstrap.Collapse(accordionElement, { toggle: true });
                }
                
                // Espandi la sezione dell'aggiornamento specifico
                setTimeout(() => {
                    const sectionId = `${tipo}-${itemId}`;
                    const section = document.getElementById(sectionId);
                    if (section) {
                        section.style.display = 'block';
                        
                        // Trova e evidenzia l'aggiornamento specifico
                        setTimeout(() => {
                            const aggItems = section.querySelectorAll('.aggiornamento-item');
                            for (let item of aggItems) {
                                const badge = item.querySelector('.badge');
                                if (badge) {
                                    const badgeText = badge.textContent.trim();
                                    // Controlla se la data corrisponde (confronto approssimativo)
                                    if (badgeText.includes(new Date(dataISO).toLocaleDateString('it-IT'))) {
                                        // Scrolla fino all'elemento
                                        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        // Evidenzia temporaneamente
                                        item.style.backgroundColor = '#fff3cd';
                                        setTimeout(() => {
                                            item.style.backgroundColor = '';
                                        }, 3000);
                                        break;
                                    }
                                }
                            }
                        }, 300);
                    }
                }, 500);
            }, 1000);
        }
    }

    function fetchServiziBisogni() {
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
                serviziList = data.data;
                serviziMap = data.data.reduce((map, servizio) => {
                    map[servizio._id] = servizio.descrizione_servizio || servizio.nome_servizio;
                    return map;
                }, {});
                
                renderServizi();
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
                bisogniList = data.data;
                bisogniMap = data.data.reduce((map, bisogno) => {
                    map[bisogno._id] = bisogno.descrizione_bisogno || bisogno.nome_bisogno;
                    return map;
                }, {});
                
                renderBisogni();
            })
            .catch(error => console.error('Errore nel caricamento bisogni:', error));

        // Fetch monitor
        fetch('/q', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'monitor'
            })
        })
            .then(response => response.json())
            .then(data => {
                monitorList = data.data;
                monitorMap = data.data.reduce((map, monitor) => {
                    map[monitor._id] = monitor.descrizione_monitor || monitor.nome_monitor;
                    return map;
                }, {});
                renderMonitorGrid();
            })
            .catch(error => console.error('Errore nel caricamento monitor:', error));
    }

    function renderServizi() {
        const container = document.getElementById('servizi-content');
        
        let html = `
            <button class="btn btn-sm btn-primary mb-3" onclick="PersonaDetail.showAddItemModal('servizio')">
                + Aggiungi servizio
            </button>
        `;
        
        if (!personaData.servizi || Object.keys(personaData.servizi).length === 0) {
            container.innerHTML = html + '<p class="text-muted">Nessun servizio associato</p>';
            return;
        }

        const serviziIds = Object.keys(personaData.servizi);
        const serviziList = serviziIds.map(id => {
            const nome = serviziMap[id] || id;
            const aggiornamenti = personaData.servizi[id] || [];
            return `
                <div class="servizio-item mb-3">
                    <span class="badge bg-primary" style="cursor: pointer;" onclick="PersonaDetail.toggleAggiornamenti('servizio-${id}')">
                        ${nome} <span class="badge bg-light text-dark ms-1">${aggiornamenti.length}</span>
                    </span>
                    <div id="servizio-${id}" class="aggiornamenti-section" style="display: none;">
                        <button class="btn btn-sm btn-success mb-2" onclick="PersonaDetail.showAddAggModal('servizio', '${id}', '${nome.replace(/'/g, "\\'")}')">
                            + Aggiungi aggiornamento
                        </button>
                        ${renderAggiornamenti(aggiornamenti, 'servizio', id)}
                    </div>
                </div>`;
        }).join('');

        container.innerHTML = html + serviziList;
    }

    function renderBisogni() {
        const container = document.getElementById('bisogni-content');
        
        let html = `
            <button class="btn btn-sm btn-primary mb-3" onclick="PersonaDetail.showAddItemModal('bisogno')">
                + Aggiungi bisogno
            </button>
        `;
        
        if (!personaData.bisogni || Object.keys(personaData.bisogni).length === 0) {
            container.innerHTML = html + '<p class="text-muted">Nessun bisogno associato</p>';
            return;
        }

        const bisogniIds = Object.keys(personaData.bisogni);
        const bisogniList = bisogniIds.map(id => {
            const nome = bisogniMap[id] || id;
            const aggiornamenti = personaData.bisogni[id] || [];
            return `
                <div class="bisogno-item mb-3">
                    <span class="badge bg-info" style="cursor: pointer;" onclick="PersonaDetail.toggleAggiornamenti('bisogno-${id}')">
                        ${nome} <span class="badge bg-light text-dark ms-1">${aggiornamenti.length}</span>
                    </span>
                    <div id="bisogno-${id}" class="aggiornamenti-section" style="display: none;">
                        <button class="btn btn-sm btn-success mb-2" onclick="PersonaDetail.showAddAggModal('bisogno', '${id}', '${nome.replace(/'/g, "\\'")}')">
                            + Aggiungi aggiornamento
                        </button>
                        ${renderAggiornamenti(aggiornamenti, 'bisogno', id)}
                    </div>
                </div>`;
        }).join('');

        container.innerHTML = html + bisogniList;
    }

    function renderAggiornamenti(aggiornamenti, tipo, itemId) {
        if (!aggiornamenti || aggiornamenti.length === 0) {
            return '<p class="text-muted mt-2 ms-3">Nessun aggiornamento</p>';
        }

        // Ordina dal più recente al più vecchio
        const sorted = [...aggiornamenti].sort((a, b) => {
            return new Date(b.data) - new Date(a.data);
        });

        const aggList = sorted.map(agg => {
            const data = new Date(agg.data).toLocaleDateString('it-IT');
            const dataISO = new Date(agg.data).toISOString();
            return `
                <div class="aggiornamento-item">
                    <div class="d-flex align-items-start">
                        <span class="badge bg-secondary me-2">${data}</span>
                        <div class="flex-grow-1">${agg.note || 'Nessuna nota'}</div>
                        <div class="ms-2">
                            <button class="btn btn-sm btn-outline-primary py-0 px-1" style="font-size: 0.75rem;" onclick="PersonaDetail.showEditAggModal('${tipo}', '${itemId}', '${dataISO}', '${(agg.note || '').replace(/'/g, "\\'").replace(/"/g, '&quot;')}')">✏️</button>
                            <button class="btn btn-sm btn-outline-danger py-0 px-1 ms-1" style="font-size: 0.75rem;" onclick="PersonaDetail.deleteAggiornamento('${tipo}', '${itemId}', '${dataISO}')">🗑️</button>
                        </div>
                    </div>
                </div>`;
        }).join('');

        return `<div class="aggiornamenti-list">${aggList}</div>`;
    }

    function toggleAggiornamenti(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = section.style.display === 'none' ? 'block' : 'none';
        }
    }

    function showAddAggModal(tipo, itemId, itemNome) {
        const tipoLabel = tipo === 'servizio' ? 'servizio' : 'bisogno';
        const modalHtml = `
            <div class="modal fade" id="addAggModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Aggiornamento per ${tipoLabel} "${itemNome}"</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <label for="aggNote" class="form-label">Note</label>
                            <textarea id="aggNote" class="form-control" rows="4" style="resize: vertical; max-height: 200px;"></textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-primary" id="btnSaveAgg">Salva</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        let existingModal = document.getElementById('addAggModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('addAggModal'));
        modal.show();

        // Aggiungi listener al bottone salva
        document.getElementById('btnSaveAgg').addEventListener('click', () => {
            const note = document.getElementById('aggNote').value;
            saveAggiornamento(tipo, itemId, note);
            modal.hide();
        });

        document.getElementById('addAggModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    function showEditAggModal(tipo, itemId, dataISO, note) {
        const tipoLabel = tipo === 'servizio' ? 'servizio' : 'bisogno';
        const itemNome = tipo === 'servizio' ? serviziMap[itemId] : bisogniMap[itemId];
        const modalHtml = `
            <div class="modal fade" id="editAggModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Modifica aggiornamento per ${tipoLabel} "${itemNome}"</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <label for="editAggNote" class="form-label">Note</label>
                            <textarea id="editAggNote" class="form-control" rows="4" style="resize: vertical; max-height: 200px;">${note}</textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-primary" id="btnEditAgg">Salva</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        let existingModal = document.getElementById('editAggModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('editAggModal'));
        modal.show();

        // Aggiungi listener al bottone salva
        document.getElementById('btnEditAgg').addEventListener('click', () => {
            const newNote = document.getElementById('editAggNote').value;
            editAggiornamento(tipo, itemId, dataISO, newNote);
            modal.hide();
        });

        document.getElementById('editAggModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    function saveAggiornamento(tipo, itemId, note) {
        const payload = {
            persona_id: personaData._id,
            tipo: tipo,
            item_id: itemId,
            note: note,
            data: new Date().toISOString()
        };

        console.log('Salvataggio aggiornamento:', payload);

        fetch('/add-aggiornamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Aggiornamento salvato:', data);
                if (data.success) {
                    // Aggiorna i dati locali
                    const nuovoAgg = {
                        data: payload.data,
                        note: note
                    };
                    
                    const campo = tipo === 'servizio' ? 'servizi' : 'bisogni';
                    if (!personaData[campo][itemId]) {
                        personaData[campo][itemId] = [];
                    }
                    personaData[campo][itemId].push(nuovoAgg);
                    
                    // Re-renderizza la sezione specifica
                    if (tipo === 'servizio') {
                        renderServizi();
                    } else {
                        renderBisogni();
                    }
                    
                    // Riapri la sezione appena aggiornata
                    setTimeout(() => {
                        const section = document.getElementById(`${tipo}-${itemId}`);
                        if (section) {
                            section.style.display = 'block';
                        }
                    }, 100);
                }
            })
            .catch(error => console.error('Errore nel salvataggio:', error));
    }

    function editAggiornamento(tipo, itemId, oldDataISO, newNote) {
        const payload = {
            persona_id: personaData._id,
            tipo: tipo,
            item_id: itemId,
            old_data: oldDataISO,
            new_note: newNote,
            new_data: new Date().toISOString()
        };

        console.log('Modifica aggiornamento:', payload);

        fetch('/edit-aggiornamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Aggiornamento modificato:', data);
                if (data.success) {
                    // Aggiorna i dati locali
                    const campo = tipo === 'servizio' ? 'servizi' : 'bisogni';
                    const aggList = personaData[campo][itemId];
                    
                    // Rimuovi vecchio e aggiungi nuovo
                    const index = aggList.findIndex(agg => new Date(agg.data).toISOString() === oldDataISO);
                    if (index !== -1) {
                        aggList.splice(index, 1);
                    }
                    aggList.push({
                        data: payload.new_data,
                        note: newNote
                    });
                    
                    // Re-renderizza la sezione specifica
                    if (tipo === 'servizio') {
                        renderServizi();
                    } else {
                        renderBisogni();
                    }
                    
                    // Riapri la sezione appena aggiornata
                    setTimeout(() => {
                        const section = document.getElementById(`${tipo}-${itemId}`);
                        if (section) {
                            section.style.display = 'block';
                        }
                    }, 100);
                }
            })
            .catch(error => console.error('Errore nella modifica:', error));
    }

    function deleteAggiornamento(tipo, itemId, dataISO) {
        if (!confirm('Sei sicuro di voler eliminare questo aggiornamento?')) {
            return;
        }

        const payload = {
            persona_id: personaData._id,
            tipo: tipo,
            item_id: itemId,
            data: dataISO
        };

        console.log('Eliminazione aggiornamento:', payload);

        fetch('/delete-aggiornamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Aggiornamento eliminato:', data);
                if (data.success) {
                    // Aggiorna i dati locali
                    const campo = tipo === 'servizio' ? 'servizi' : 'bisogni';
                    const aggList = personaData[campo][itemId];
                    
                    // Rimuovi l'aggiornamento
                    const index = aggList.findIndex(agg => new Date(agg.data).toISOString() === dataISO);
                    if (index !== -1) {
                        aggList.splice(index, 1);
                    }
                    
                    // Re-renderizza la sezione specifica
                    if (tipo === 'servizio') {
                        renderServizi();
                    } else {
                        renderBisogni();
                    }
                    
                    // Riapri la sezione appena aggiornata
                    setTimeout(() => {
                        const section = document.getElementById(`${tipo}-${itemId}`);
                        if (section) {
                            section.style.display = 'block';
                        }
                    }, 100);
                }
            })
            .catch(error => console.error('Errore nell\'eliminazione:', error));
    }

    function showAddItemModal(tipo) {
        if (tipo === 'bisogno') {
            showAddBisognoModal();
        } else {
            showAddServizioModal();
        }
    }

    function showAddServizioModal() {
        const options = serviziList.map(item => {
            const nome = serviziMap[item._id];
            return `<option value="${item._id}">${nome}</option>`;
        }).join('');

        const modalHtml = `
            <div class="modal fade" id="addItemModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Aggiungi servizio per ${personaData.cognome} ${personaData.nome}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <label for="itemSelect" class="form-label">Seleziona servizio</label>
                            <select id="itemSelect" class="form-select">
                                <option value="">-- Seleziona --</option>
                                ${options}
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-primary" id="btnSaveItem">Aggiungi</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        let existingModal = document.getElementById('addItemModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('addItemModal'));
        modal.show();

        // Inizializza TomSelect
        const selectElement = document.getElementById('itemSelect');
        const tomSelect = new TomSelect(selectElement, {
            create: false,
            sortField: 'text',
            placeholder: 'Cerca servizio...'
        });

        // Aggiungi listener al bottone salva
        document.getElementById('btnSaveItem').addEventListener('click', () => {
            const itemId = tomSelect.getValue();
            if (itemId) {
                saveNewItem('servizio', itemId);
                modal.hide();
            }
        });

        document.getElementById('addItemModal').addEventListener('hidden.bs.modal', function () {
            tomSelect.destroy();
            this.remove();
        });
    }

    function showAddBisognoModal() {
        // Estrai categorie uniche
        const categorie = [...new Set(bisogniList.map(b => b.categoria_bisogno))].sort();
        const categorieOptions = categorie.map(cat => `<option value="${cat}">${cat}</option>`).join('');

        const modalHtml = `
            <div class="modal fade" id="addItemModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Aggiungi bisogno per ${personaData.cognome} ${personaData.nome}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="categoriaSelect" class="form-label">Categoria bisogno</label>
                                <select id="categoriaSelect" class="form-select">
                                    <option value="">-- Seleziona categoria --</option>
                                    ${categorieOptions}
                                </select>
                            </div>
                            <div>
                                <label for="bisognoSelect" class="form-label">Bisogno</label>
                                <select id="bisognoSelect" class="form-select" disabled>
                                    <option value="">-- Prima seleziona una categoria --</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-primary" id="btnSaveItem">Aggiungi</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        let existingModal = document.getElementById('addItemModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('addItemModal'));
        modal.show();

        // Inizializza TomSelect per categoria
        const categoriaElement = document.getElementById('categoriaSelect');
        const categoriaTomSelect = new TomSelect(categoriaElement, {
            create: false,
            sortField: 'text',
            placeholder: 'Seleziona categoria...'
        });

        // Inizializza TomSelect per bisogno (disabilitato)
        const bisognoElement = document.getElementById('bisognoSelect');
        let bisognoTomSelect = new TomSelect(bisognoElement, {
            create: false,
            sortField: 'text',
            placeholder: 'Seleziona bisogno...'
        });
        bisognoTomSelect.disable();

        // Listener per cambio categoria
        categoriaTomSelect.on('change', (categoria) => {
            bisognoTomSelect.clear();
            bisognoTomSelect.clearOptions();
            
            if (categoria) {
                // Filtra bisogni per categoria
                const bisogniFiltrati = bisogniList.filter(b => b.categoria_bisogno === categoria);
                bisogniFiltrati.forEach(bisogno => {
                    const nome = bisogniMap[bisogno._id];
                    bisognoTomSelect.addOption({ value: bisogno._id, text: nome });
                });
                bisognoTomSelect.enable();
            } else {
                bisognoTomSelect.disable();
            }
        });

        // Aggiungi listener al bottone salva
        document.getElementById('btnSaveItem').addEventListener('click', () => {
            const bisognoId = bisognoTomSelect.getValue();
            if (bisognoId) {
                saveNewItem('bisogno', bisognoId);
                modal.hide();
            }
        });

        document.getElementById('addItemModal').addEventListener('hidden.bs.modal', function () {
            categoriaTomSelect.destroy();
            bisognoTomSelect.destroy();
            this.remove();
        });
    }

    function saveNewItem(tipo, itemId) {
        const endpoint = tipo === 'servizio' ? '/add-servizio' : '/add-bisogno';
        const payload = {
            persona_id: personaData._id,
            item_id: itemId
        };

        console.log('Aggiunta nuovo item:', payload);

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Item aggiunto:', data);
                if (data.success) {
                    // Aggiorna i dati locali
                    const campo = tipo === 'servizio' ? 'servizi' : 'bisogni';
                    if (!personaData[campo]) {
                        personaData[campo] = {};
                    }
                    personaData[campo][itemId] = [];
                    
                    // Re-renderizza la sezione specifica
                    if (tipo === 'servizio') {
                        renderServizi();
                    } else {
                        renderBisogni();
                    }
                }
            })
            .catch(error => console.error('Errore nell\'aggiunta:', error));
    }

    function renderMonitorGrid() {
        const monitorData = personaData.monitor || {};
        const monitorIds = Object.keys(monitorData);
        console.log('monitorIds estratti:', monitorIds);
        
        const gridDiv = document.querySelector('#monitor-grid');
        if (!gridDiv) {
            console.log('gridDiv non trovato');
            return;
        }
        
        // Se non ci sono monitor, mostra un messaggio
        if (monitorIds.length === 0) {
            console.log('Nessun monitor da visualizzare');
            
            // Se esiste già una griglia, distruggila
            if (monitorGridApi) {
                monitorGridApi.destroy();
                monitorGridApi = null;
            }
            
            gridDiv.innerHTML = '<p class="text-muted">Nessuna situazione da monitorare. Aggiungi una situazione per iniziare.</p>';
            return;
        }
        
        // Prepara le colonne dinamiche
        const columnDefs = [
            {
                headerName: 'Data',
                field: 'data',
                sortable: true,
                filter: true,
                width: 150,
                valueFormatter: params => {
                    if (!params.value) return '';
                    return new Date(params.value).toLocaleDateString('it-IT', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                },
                sort: 'desc'
            }
        ];

        // Aggiungi una colonna per ogni monitor (editabile)
        monitorIds.forEach(monitorId => {
            const monitorNome = monitorMap[monitorId] || monitorId;
            columnDefs.push({
                headerName: monitorNome,
                field: monitorId,
                sortable: true,
                filter: true,
                editable: false,
                resizable: true,
                cellEditor: 'agTextCellEditor',
                onCellClicked: params => {
                    // Apri modale per editare la nota
                    showEditMonitorNoteModal(monitorId, monitorNome, params.data.data, params.value || '');
                }
            });
        });

        // Aggrega i dati: una riga per ogni data unica
        const dataMap = {};
        monitorIds.forEach(monitorId => {
            const aggiornamenti = monitorData[monitorId] || [];
            aggiornamenti.forEach(agg => {
                const dataKey = new Date(agg.data).toISOString();
                if (!dataMap[dataKey]) {
                    dataMap[dataKey] = { data: agg.data };
                }
                dataMap[dataKey][monitorId] = agg.note || '';
            });
        });

        const rowData = Object.values(dataMap);

        console.log('Monitor grid - Colonne:', columnDefs.length);
        console.log('Monitor grid - Righe:', rowData.length);

        // Se la griglia esiste già, aggiorna colonne e dati
        if (monitorGridApi) {
            monitorGridApi.setGridOption('columnDefs', columnDefs);
            monitorGridApi.setGridOption('rowData', rowData);
            if (rowData.length === 0) {
                monitorGridApi.showNoRowsOverlay();
            } else {
                monitorGridApi.hideOverlay();
            }
            monitorGridApi.sizeColumnsToFit();
            
            // Aggiorna anche il pannello colonne
            createMonitorFieldPanel(columnDefs);
        } else {
           
            const gridOptions = {
                columnDefs: columnDefs,
                rowData: rowData,
                defaultColDef: {
                    sortable: true,
                    filter: true,
                    resizable: true
                },
                editType: 'fullRow',
                overlayNoRowsTemplate: '<span style="padding: 10px; border: 2px solid #ddd; background: #f9f9f9;">Nessun aggiornamento. Clicca su "Aggiungi riga di aggiornamento" per iniziare.</span>'
            };

            gridDiv.innerHTML = ''; 
            
            try {
                monitorGridApi = agGrid.createGrid(gridDiv, gridOptions);
                
                // Usa setTimeout per permettere al DOM di stabilizzarsi
                setTimeout(() => {
                    if (rowData.length === 0) {
                        monitorGridApi.showNoRowsOverlay();
                    }
                    monitorGridApi.sizeColumnsToFit();
                }, 50);
                
                // Crea il pannello di selezione colonne
                createMonitorFieldPanel(columnDefs);
        
            } catch (error) {
                console.error('ERRORE nella creazione della griglia:', error);
                console.error('Stack:', error.stack);
            }
        }
    }

    function createMonitorFieldPanel(columnDefs) {
        const panel = document.querySelector('#monitor-field-panel');
        if (!panel) return;
        
        panel.innerHTML = '<h5 class="mb-3">Colonne</h5>';
        
        columnDefs.forEach(colDef => {
            const field = colDef.field;
            const headerName = colDef.headerName;
            const isVisible = !colDef.hide;
            
            const div = document.createElement('div');
            div.className = 'form-check mb-1';
            div.innerHTML = `
                <input class="form-check-input" type="checkbox" id="col-monitor-${field}" ${isVisible ? 'checked' : ''}>
                <label class="form-check-label" for="col-monitor-${field}">${headerName}</label>
            `;
            panel.appendChild(div);
            
            const checkbox = div.querySelector('input');
            checkbox.addEventListener('change', (e) => {
                if (monitorGridApi) {
                    monitorGridApi.setColumnsVisible([field], e.target.checked);
                    monitorGridApi.sizeColumnsToFit();
                }
            });
        });
    }

    function saveMonitorAggiornamento(monitorId, data, note) {
        
        if (!note || note.trim() === '') {
            console.log('Nota vuota, non salvo');
            return;
        }

        // Converti la data in oggetto Date e poi in ISO string
        let dataISO;
        try {
            const dataObj = new Date(data);
            // Imposta l'ora a mezzanotte UTC per evitare problemi di timezone
            dataISO = new Date(Date.UTC(dataObj.getFullYear(), dataObj.getMonth(), dataObj.getDate())).toISOString();
            console.log('Data convertita in ISO:', dataISO);
        } catch (error) {
            console.error('Errore nella conversione della data:', error);
            alert('Errore nella conversione della data');
            return;
        }

        const payload = {
            persona_id: personaData._id,
            tipo: 'monitor',
            item_id: monitorId,
            data: dataISO,
            note: note
        };

        console.log('Payload inviato:', payload);

        fetch('/add-aggiornamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Aggiornamento salvato:', data);
                if (data.success) {
                    // Aggiorna i dati locali
                    if (!personaData.monitor[monitorId]) {
                        personaData.monitor[monitorId] = [];
                    }
                    // Trova e aggiorna o aggiungi
                    const existingIdx = personaData.monitor[monitorId].findIndex(
                        agg => new Date(agg.data).toISOString() === dataISO
                    );
                    if (existingIdx >= 0) {
                        personaData.monitor[monitorId][existingIdx].note = note;
                    } else {
                        personaData.monitor[monitorId].push({ data: dataISO, note: note });
                    }
                    // Ri-renderizza la griglia per mostrare i nuovi dati
                    renderMonitorGrid();
                }
            })
            .catch(error => {
                console.error('Errore nel salvataggio:', error);
                alert('Errore nel salvataggio dell\'aggiornamento');
            });
    }

    function showEditMonitorNoteModal(monitorId, monitorNome, data, currentNote) {
        const dataFormatted = new Date(data).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        const modalHtml = `
            <div class="modal fade" id="editMonitorNoteModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Modifica Nota - ${monitorNome}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="text-muted mb-2">Data: ${dataFormatted}</p>
                            <label for="noteTextarea" class="form-label">Nota</label>
                            <textarea id="noteTextarea" class="form-control" rows="5" placeholder="Inserisci la nota...">${currentNote}</textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-primary" id="btnSaveNote">Salva</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        let existingModal = document.getElementById('editMonitorNoteModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('editMonitorNoteModal'));
        modal.show();

        const textarea = document.getElementById('noteTextarea');
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);

        document.getElementById('btnSaveNote').addEventListener('click', () => {
            const newNote = textarea.value.trim();
            if (newNote) {
                saveMonitorAggiornamento(monitorId, data, newNote);
                modal.hide();
            } else {
                alert('La nota non può essere vuota');
            }
        });

        document.getElementById('editMonitorNoteModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    function showAddMonitorRowModal() {
        const modalHtml = `
            <div class="modal fade" id="addMonitorRowModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Aggiungi Riga di Aggiornamento</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <label for="rowDate" class="form-label">Data</label>
                            <input type="date" id="rowDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-primary" id="btnSaveRow">Aggiungi</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        let existingModal = document.getElementById('addMonitorRowModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('addMonitorRowModal'));
        modal.show();

        document.getElementById('btnSaveRow').addEventListener('click', () => {
            const dateValue = document.getElementById('rowDate').value;
            if (!dateValue) {
                alert('Seleziona una data');
                return;
            }
            
            // Aggiungi una riga vuota con la data
            const newRow = { data: new Date(dateValue).toISOString() };
            
            // Aggiungi la riga alla griglia
            if (monitorGridApi) {
                monitorGridApi.applyTransaction({ add: [newRow] });
                monitorGridApi.sizeColumnsToFit();
            }
            
            modal.hide();
        });

        document.getElementById('addMonitorRowModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    function showAddMonitorModal() {
        const options = monitorList.map(item => {
            const nome = item.nome_monitor || item.descrizione_monitor;
            return `<option value="${item._id}">${nome}</option>`;
        }).join('');

        const modalHtml = `
            <div class="modal fade" id="addMonitorModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Aggiungi Situazione da Monitorare</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <label for="monitorSelect" class="form-label">Seleziona situazione</label>
                            <select id="monitorSelect" class="form-select">
                                <option value="">-- Seleziona --</option>
                                ${options}
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-primary" id="btnSaveMonitor">Aggiungi</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        let existingModal = document.getElementById('addMonitorModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('addMonitorModal'));
        modal.show();

        const selectElement = document.getElementById('monitorSelect');
        const tomSelect = new TomSelect(selectElement, {
            create: true,
            createOnBlur: true,
            sortField: 'text',
            placeholder: 'Cerca o crea nuova situazione...',
            create: function(input) {
                return {
                    value: 'new:' + input,
                    text: input
                };
            }
        });

        document.getElementById('btnSaveMonitor').addEventListener('click', () => {
            const monitorId = tomSelect.getValue();
            if (!monitorId) {
                alert('Seleziona una situazione da monitorare');
                return;
            }
            saveNewMonitor(monitorId);
            modal.hide();
        });

        document.getElementById('addMonitorModal').addEventListener('hidden.bs.modal', function () {
            tomSelect.destroy();
            this.remove();
        });
    }

    function saveNewMonitor(monitorIdOrValue) {
        console.log('saveNewMonitor chiamato con:', monitorIdOrValue);
        
        // Controlla se è una nuova situazione da creare
        if (monitorIdOrValue.startsWith('new:')) {
            const nuovaSituazione = monitorIdOrValue.substring(4);
            console.log('Creazione nuova situazione:', nuovaSituazione);
            
            // Prima crea il monitor nella collection
            const createPayload = {
                nome_monitor: nuovaSituazione.toLowerCase().replace(/\s+/g, '_'),
                descrizione_monitor: nuovaSituazione
            };
            
            fetch('/create-monitor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(createPayload)
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Monitor creato:', data);
                    if (data.success && data.monitor_id) {
                        // Aggiorna monitorList e monitorMap
                        const newMonitor = {
                            _id: data.monitor_id,
                            nome_monitor: createPayload.nome_monitor,
                            descrizione_monitor: createPayload.descrizione_monitor
                        };
                        monitorList.push(newMonitor);
                        monitorMap[data.monitor_id] = createPayload.descrizione_monitor;
                        
                        // Ora aggiungi alla persona
                        addMonitorToPersona(data.monitor_id);
                    } else {
                        alert('Errore nella creazione della situazione: ' + (data.error || 'Unknown error'));
                    }
                })
                .catch(error => {
                    console.error('Errore nella creazione del monitor:', error);
                    alert('Errore nella creazione della situazione');
                });
        } else {
            // Situazione esistente
            addMonitorToPersona(monitorIdOrValue);
        }
    }
    
    function addMonitorToPersona(monitorId) {
        const payload = {
            persona_id: personaData._id,
            item_id: monitorId
        };

        console.log('Aggiunta monitor alla persona:', payload);

        fetch('/add-monitor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => {
                console.log('Risposta raw:', response);
                return response.json();
            })
            .then(data => {
                console.log('=== RISPOSTA ADD MONITOR ===');
                console.log('Monitor aggiunto - Risposta completa:', data);
                console.log('data.success:', data.success);
                
                if (data.success) {
                    // Aggiorna i dati locali
                    if (!personaData.monitor) {
                        personaData.monitor = {};
                    }
                    personaData.monitor[monitorId] = [];
                    
                    renderMonitorGrid();
                    
                    console.log('renderMonitorGrid completato');
                    alert('Situazione aggiunta con successo!');
                } else {
                    console.error('Errore nella risposta:', data);
                    alert('Errore nell\'aggiunta del monitor: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Errore nell\'aggiunta del monitor:', error);
                alert('Errore nell\'aggiunta del monitor');
            });
    }

    return { init, toggleAggiornamenti, showAddAggModal, showEditAggModal, showAddItemModal, showAddMonitorModal, showAddMonitorRowModal, deleteAggiornamento, checkUrlParams };
})();

document.addEventListener('DOMContentLoaded', () => {
    PersonaDetail.init();
});
