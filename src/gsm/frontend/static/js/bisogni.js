const Bisogni = (() => {

    let bisogniData = [];
    let personeData = [];
    let currentView = 'list'; // 'list' or 'grid'

    function init() {
        console.log('Inizializzazione pagina bisogni');
        fetchData();
        setupExportButtons();
        setupViewToggle();
        setupGlobalSearch();
    }

    async function fetchData() {
        try {
            // Fetch bisogni
            const bisogniResponse = await fetch('/q', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: 'bisogni' })
            });
            const bisogniResult = await bisogniResponse.json();
            bisogniData = bisogniResult.data;

            // Fetch persone per contare i bisogni
            const personeResponse = await fetch('/q', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: 'persone' })
            });
            const personeResult = await personeResponse.json();
            personeData = personeResult.data;

            console.log('Bisogni ricevuti:', bisogniData);
            console.log('Persone ricevute:', personeData);

            renderBisogni();
        } catch (error) {
            console.error('Errore nel caricamento dati:', error);
        }
    }

    function countPersonePerCategoria(categoria) {
        // Conta quante persone hanno almeno un bisogno di questa categoria
        const bisogniInCategoria = bisogniData
            .filter(b => b.categoria_bisogno === categoria)
            .map(b => b._id);

        const personeConBisogno = new Set();
        personeData.forEach(persona => {
            if (persona.bisogni) {
                const hasBisognoInCategoria = bisogniInCategoria.some(bisognoId => 
                    persona.bisogni[bisognoId] && persona.bisogni[bisognoId].length > 0
                );
                if (hasBisognoInCategoria) {
                    personeConBisogno.add(persona._id);
                }
            }
        });

        return personeConBisogno.size;
    }

    function countPersonePerBisogno(bisognoId) {
        // Conta quante persone hanno questo bisogno specifico
        let count = 0;
        personeData.forEach(persona => {
            if (persona.bisogni && persona.bisogni[bisognoId] && persona.bisogni[bisognoId].length > 0) {
                count++;
            }
        });
        return count;
    }

    function renderBisogni() {
        const container = document.getElementById('bisogni-container');
        
        if (!bisogniData || bisogniData.length === 0) {
            container.innerHTML = '<p class="text-muted">Nessun bisogno disponibile</p>';
            return;
        }

        // Raggruppa bisogni per categoria
        const bisogniPerCategoria = {};
        bisogniData.forEach(bisogno => {
            const categoria = bisogno.categoria_bisogno || 'Altro';
            if (!bisogniPerCategoria[categoria]) {
                bisogniPerCategoria[categoria] = [];
            }
            bisogniPerCategoria[categoria].push(bisogno);
        });

        // Ordina le categorie alfabeticamente
        const categorieOrdinate = Object.keys(bisogniPerCategoria).sort();

        // Crea le card per ogni categoria
        const cards = categorieOrdinate.map(categoria => {
            const bisogni = bisogniPerCategoria[categoria];
            const numPersone = countPersonePerCategoria(categoria);
            const categoriaId = categoria.replace(/\s+/g, '-').toLowerCase();

            // Ordina i bisogni per numero di persone (decrescente)
            const bisogniOrdinati = bisogni.map(bisogno => ({
                ...bisogno,
                numPersone: countPersonePerBisogno(bisogno._id)
            })).sort((a, b) => b.numPersone - a.numPersone);

            const chipsHtml = bisogniOrdinati.map(bisogno => {
                const nomeBisogno = bisogno.nome_bisogno || 'N/A';
                const descrizione = bisogno.descrizione_bisogno || '';
                const numPersoneBisogno = bisogno.numPersone;
                const badgeHtml = numPersoneBisogno > 0 
                    ? `<span class="badge bg-primary ms-2" style="font-size: 0.75rem;">${numPersoneBisogno}</span>`
                    : '';
                return `
                    <span class="badge bg-light text-dark border bisogno-chip" 
                          data-categoria="${categoria}"
                          data-nome="${nomeBisogno.toLowerCase()}"
                          title="${descrizione}"
                          style="cursor: pointer; margin: 0.25rem; padding: 0.5rem 0.75rem; font-size: 0.9rem;">
                        ${nomeBisogno}
                        ${badgeHtml}
                    </span>
                `;
            }).join('');

            const colClass = currentView === 'list' ? 'col-12' : 'col-md-6 col-lg-4';
            
            return `
                <div class="${colClass} mb-4 categoria-card-wrapper" data-categoria="${categoria.toLowerCase()}">
                    <div class="card bisogno-categoria-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="card-title mb-0" style="cursor: pointer;" onclick="window.location.href='/categoria-bisogno/${encodeURIComponent(categoria)}'">${categoria}</h5>
                                <span class="badge bg-primary">${numPersone} ${numPersone === 1 ? 'persona' : 'persone'}</span>
                            </div>
                            <input type="text" 
                                   class="form-control form-control-sm mb-3 bisogno-filter" 
                                   data-categoria="${categoriaId}"
                                   placeholder="Filtra bisogni in questa categoria..."
                                   style="max-width: 300px;">
                            <div class="bisogni-chips-container ${currentView === 'grid' ? 'grid-view' : ''}" data-categoria="${categoriaId}">
                                ${chipsHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = cards;

        // Setup filtri
        setupFilters();
    }

    function setupFilters() {
        const filterInputs = document.querySelectorAll('.bisogno-filter');
        
        filterInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const filterText = e.target.value.toLowerCase();
                const categoria = e.target.dataset.categoria;
                const container = document.querySelector(`.bisogni-chips-container[data-categoria="${categoria}"]`);
                const chips = container.querySelectorAll('.bisogno-chip');

                chips.forEach(chip => {
                    const nomeBisogno = chip.dataset.nome;
                    if (nomeBisogno.includes(filterText)) {
                        chip.style.display = 'inline-block';
                    } else {
                        chip.style.display = 'none';
                    }
                });
            });
        });
    }

    function downloadCsv() {
        const today = new Date().toISOString().split('T')[0];
        
        if (!bisogniData || bisogniData.length === 0) {
            alert('Nessun dato da esportare');
            return;
        }
        
        // Prepara le colonne
        const headers = ['_id', 'nome_bisogno', 'categoria_bisogno', 'descrizione_bisogno'];
        
        // Crea CSV
        const csvRows = [];
        csvRows.push(headers.join(','));
        
        bisogniData.forEach(bisogno => {
            const row = headers.map(header => {
                const value = bisogno[header] || '';
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
        a.download = `bisogni_${today}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    function downloadJsonLines() {
        const today = new Date().toISOString().split('T')[0];
        
        if (!bisogniData || bisogniData.length === 0) {
            alert('Nessun dato da esportare');
            return;
        }
        
        // Converti in JSON Lines (una riga JSON per record)
        const jsonLines = bisogniData.map(record => JSON.stringify(record)).join('\n');
        
        // Crea e scarica il file
        const blob = new Blob([jsonLines], { type: 'application/jsonl' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bisogni_${today}.jsonl`;
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

    function setupViewToggle() {
        const viewListBtn = document.getElementById('viewListBtn');
        const viewGridBtn = document.getElementById('viewGridBtn');
        
        // Imposta lo stato iniziale
        viewListBtn.classList.add('active');
        
        viewListBtn.addEventListener('click', () => {
            currentView = 'list';
            viewListBtn.classList.add('active');
            viewGridBtn.classList.remove('active');
            renderBisogni();
        });
        
        viewGridBtn.addEventListener('click', () => {
            currentView = 'grid';
            viewGridBtn.classList.add('active');
            viewListBtn.classList.remove('active');
            renderBisogni();
        });
    }

    function setupGlobalSearch() {
        const globalSearchInput = document.getElementById('globalSearchInput');
        
        if (!globalSearchInput) return;
        
        globalSearchInput.addEventListener('input', (e) => {
            const searchText = e.target.value.toLowerCase().trim();
            const cardWrappers = document.querySelectorAll('.categoria-card-wrapper');
            
            cardWrappers.forEach(wrapper => {
                const categoria = wrapper.dataset.categoria;
                const chipsContainer = wrapper.querySelector('.bisogni-chips-container');
                const chips = chipsContainer.querySelectorAll('.bisogno-chip');
                
                if (!searchText) {
                    // Nessun filtro: mostra tutto
                    wrapper.style.display = '';
                    chips.forEach(chip => chip.style.display = 'inline-block');
                    return;
                }
                
                // Verifica se la categoria matcha
                const categoriaMatches = categoria.includes(searchText);
                
                if (categoriaMatches) {
                    // Se la categoria matcha, mostra la card e tutte le chips
                    wrapper.style.display = '';
                    chips.forEach(chip => chip.style.display = 'inline-block');
                } else {
                    // Se la categoria non matcha, verifica le singole chips
                    let hasVisibleChips = false;
                    
                    chips.forEach(chip => {
                        const nomeBisogno = chip.dataset.nome;
                        if (nomeBisogno.includes(searchText)) {
                            chip.style.display = 'inline-block';
                            hasVisibleChips = true;
                        } else {
                            chip.style.display = 'none';
                        }
                    });
                    
                    // Mostra la card solo se ha almeno una chip visibile
                    wrapper.style.display = hasVisibleChips ? '' : 'none';
                }
            });
        });
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    Bisogni.init();
});
