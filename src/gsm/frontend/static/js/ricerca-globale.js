const RicercaGlobale = (() => {

    let tsFields = null;
    let tsContent = null;

    function init() {
        tsFields = new TomSelect('#fieldsSelect', {
            plugins: ['remove_button', 'checkbox_options'],
            maxOptions: null,
            placeholder: 'Seleziona campi...',
            render: {
                optgroup_header: function(data, escape) {
                    return `<div class="d-flex align-items-center gap-2 px-2 py-1" style="user-select:none;">
                        <input type="checkbox" class="form-check-input group-select-all flex-shrink-0"
                            data-group="${escape(data.value)}" style="cursor:pointer; margin-top:0;">
                        <strong class="small text-muted">${escape(data.label)}</strong>
                    </div>`;
                }
            },
        });

        // Intercetta i click sulle checkbox di gruppo
        tsFields.dropdown.addEventListener('click', function(e) {
            const cb = e.target.closest('.group-select-all');
            if (!cb) return;
            e.preventDefault();
            e.stopPropagation();
            const groupId = cb.dataset.group;
            const vals = getGroupOptions(groupId);
            const selected = new Set(tsFields.getValue());
            const allSelected = vals.length > 0 && vals.every(v => selected.has(v));
            toggleGroupSelection(groupId, !allSelected);
        });

        // Aggiorna le checkbox di gruppo al cambio di selezione o apertura dropdown
        tsFields.on('item_add',      syncGroupCheckboxes);
        tsFields.on('item_remove',   syncGroupCheckboxes);
        tsFields.on('dropdown_open', syncGroupCheckboxes);

        tsContent = new TomSelect('#searchInput', {
            plugins: ['remove_button'],
            persist: false,
            create: true,
            createOnBlur: false,
            maxOptions: 0,
            openOnFocus: false,
            placeholder: 'Scrivi e premi Invio...',
            shouldLoad: () => false,
        });

        fetchFields();
        bindEvents();
    }

    // Restituisce i valori di tutte le opzioni che appartengono a un gruppo
    function getGroupOptions(groupId) {
        return Object.values(tsFields.options)
            .filter(opt => opt.optgroup === groupId)
            .map(opt => opt.value);
    }

    // Seleziona o deseleziona tutte le opzioni di un gruppo
    function toggleGroupSelection(groupId, select) {
        const vals = getGroupOptions(groupId);
        vals.forEach(v => {
            if (select) tsFields.addItem(v, true);
            else tsFields.removeItem(v, true);
        });
        tsFields.refreshItems();
        setTimeout(syncGroupCheckboxes, 0);
    }

    // Aggiorna lo stato visivo (checked / indeterminate) delle checkbox di gruppo
    function syncGroupCheckboxes() {
        const checkboxes = tsFields.dropdown.querySelectorAll('.group-select-all');
        if (!checkboxes.length) return;
        const selected = new Set(tsFields.getValue());
        checkboxes.forEach(cb => {
            const vals = getGroupOptions(cb.dataset.group);
            const n = vals.filter(v => selected.has(v)).length;
            if (n === 0) {
                cb.checked = false;
                cb.indeterminate = false;
            } else if (n === vals.length) {
                cb.checked = true;
                cb.indeterminate = false;
            } else {
                cb.checked = false;
                cb.indeterminate = true;
            }
        });
    }

    function fetchFields() {
        fetch('/api/global-search-fields')
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    console.error('Errore nel caricamento dei campi:', data.error);
                    return;
                }
                data.groups.forEach(group => {
                    tsFields.addOptionGroup(group.id, { label: group.label, value: group.id });
                    group.fields.forEach(field => {
                        tsFields.addOption({ value: `${group.id}:${field}`, text: field, optgroup: group.id });
                    });
                });
                tsFields.refreshOptions(false);
            })
            .catch(err => console.error('Errore fetchFields:', err));
    }

    function bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', search);
        document.getElementById('clearBtn').addEventListener('click', clear);
    }

    function clear() {
        tsFields.clear();
        tsContent.clear();
        document.getElementById('searchStatus').textContent = '';
        document.getElementById('searchResults').innerHTML = '';
    }

    function search() {
        const rawFields = tsFields.getValue();   // ["persona:cognome", "servizi:Sportello HR", ...]
        const terms = tsContent.getValue();

        const statusEl = document.getElementById('searchStatus');
        const resultsEl = document.getElementById('searchResults');

        if (!terms.length) {
            statusEl.textContent = 'Aggiungi almeno un termine da cercare.';
            return;
        }

        // Raggruppa i campi selezionati per sezione
        const fields = {};
        rawFields.forEach(v => {
            const sep = v.indexOf(':');
            const group = v.slice(0, sep);
            const field = v.slice(sep + 1);
            if (!fields[group]) fields[group] = [];
            fields[group].push(field);
        });

        statusEl.textContent = 'Ricerca in corso...';
        resultsEl.innerHTML = '';

        fetch('/api/global-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields, terms }),
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                statusEl.textContent = 'Errore: ' + (data.error || 'sconosciuto');
                return;
            }
            statusEl.textContent = `${data.total} risultat${data.total === 1 ? 'o' : 'i'} trovat${data.total === 1 ? 'o' : 'i'}.`;
            renderResults(data.results, resultsEl);
        })
        .catch(err => {
            console.error('Errore global search:', err);
            statusEl.textContent = 'Errore di rete.';
        });
    }

    function renderResults(results, container) {
        if (!results.length) return;

        // Raggruppa per persona, separando campi scalari da nested
        const byPersona = {};
        results.forEach(r => {
            const pid = r.persona_id;
            if (!byPersona[pid]) byPersona[pid] = { nome: r.nome, cognome: r.cognome, persona: [], nested: [] };
            if (r.tipo === 'persona') byPersona[pid].persona.push(r);
            else                      byPersona[pid].nested.push(r);
        });

        const html = Object.entries(byPersona).map(([pid, p]) => {
            let sections = '';

            if (p.persona.length) {
                const rows = p.persona.map(m => `<tr>
                    <td class="text-muted small">${esc(m.campo)}</td>
                    <td>${esc(m.valore)}</td>
                </tr>`).join('');
                sections += `
                    <div class="px-3 pt-3 pb-1">
                        <p class="text-muted small mb-1 fw-semibold text-uppercase" style="letter-spacing:.05em;">Campi persona</p>
                        <table class="table table-sm mb-2" style="table-layout:fixed;">
                            <colgroup><col style="width:160px"><col></colgroup>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>`;
            }

            if (p.nested.length) {
                const tipoLabel = t => ({ servizi: 'servizio', bisogni: 'bisogno', monitor: 'monitor' }[t] || t);
                const badgeColor = t => ({ servizi: 'bg-success', bisogni: 'bg-warning text-dark', monitor: 'bg-info text-dark' }[t] || 'bg-primary');
                const rows = p.nested.map(m => `<tr>
                    <td><span class="badge ${badgeColor(m.tipo)}">${esc(tipoLabel(m.tipo))}</span></td>
                    <td class="small">${esc(m.nome_tipo)}</td>
                    <td class="text-muted small" style="white-space:nowrap;">${esc(m.data ? m.data.slice(0, 10) : '')}</td>
                    <td class="small">${esc(m.note)}</td>
                </tr>`).join('');
                sections += `
                    <div class="px-3 pt-${p.persona.length ? 0 : 3} pb-1">
                        <p class="text-muted small mb-1 fw-semibold text-uppercase" style="letter-spacing:.05em;">Servizi / Bisogni / Monitor</p>
                        <table class="table table-sm mb-2">
                            <thead class="table-light">
                                <tr>
                                    <th style="width:80px">Tipo</th>
                                    <th>Nome</th>
                                    <th style="width:90px">Data</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>`;
            }

            return `<div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center py-2">
                    <strong>${esc(p.cognome)} ${esc(p.nome)}</strong>
                    <a href="/persona/${esc(pid)}" class="btn btn-sm btn-outline-primary">Apri scheda</a>
                </div>
                ${sections}
            </div>`;
        }).join('');

        container.innerHTML = html;
    }

    function esc(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    return { init };

})();

document.addEventListener('DOMContentLoaded', RicercaGlobale.init);

