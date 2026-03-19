# GSM — Documentazione Tecnica

> **GSM** (*La programmazione per le persone*) è un'applicazione web per la gestione di uno sportello di supporto sociale. Permette di tracciare persone, servizi erogati, bisogni rilevati, situazioni monitorate e i relativi aggiornamenti nel tempo.

---

## Indice

1. [Panoramica del Progetto](#1-panoramica-del-progetto)
2. [Stack Tecnologico](#2-stack-tecnologico)
3. [Struttura del Progetto](#3-struttura-del-progetto)
4. [Backend (Python / Flask)](#4-backend-python--flask)
   - 4.1 [Entry point — `app.py`](#41-entry-point--apppy)
   - 4.2 [Database Interface — `dbi.py`](#42-database-interface--dbipy)
   - 4.3 [Query Layer — `query.py`](#43-query-layer--querypy)
   - 4.4 [Autenticazione — `auth_manager.py`](#44-autenticazione--auth_managerpy)
   - 4.5 [Route HTTP — `routes.py`](#45-route-http--routespy)
5. [Migrator (Import Dati)](#5-migrator-import-dati)
   - 5.1 [Loader — `loader.py`](#51-loader--loaderpy)
   - 5.2 [Storer — `storer.py`](#52-storer--storerpy)
6. [Frontend (HTML + Vanilla JS)](#6-frontend-html--vanilla-js)
   - 6.1 [Architettura Frontend](#61-architettura-frontend)
   - 6.2 [Template HTML](#62-template-html)
   - 6.3 [Moduli JavaScript](#63-moduli-javascript)
7. [Modello Dati (MongoDB)](#7-modello-dati-mongodb)
   - 7.1 [Collection `persone`](#71-collection-persone)
   - 7.2 [Collection `servizi`](#72-collection-servizi)
   - 7.3 [Collection `bisogni`](#73-collection-bisogni)
   - 7.4 [Collection `monitor`](#74-collection-monitor)
   - 7.5 [Database `utent3db` — Collection `users`](#75-database-utent3db--collection-users)
8. [API Reference](#8-api-reference)
   - 8.1 [Autenticazione](#81-autenticazione)
   - 8.2 [Selezione Database](#82-selezione-database)
   - 8.3 [Query Generica `/q`](#83-query-generica-q)
   - 8.4 [Persone](#84-persone)
   - 8.5 [Servizi](#85-servizi)
   - 8.6 [Bisogni](#86-bisogni)
   - 8.7 [Monitor](#87-monitor)
   - 8.8 [Aggiornamenti](#88-aggiornamenti)
   - 8.9 [Import Dati](#89-import-dati)
9. [Flussi Applicativi Principali](#9-flussi-applicativi-principali)
   - 9.1 [Login e Selezione Database](#91-login-e-selezione-database)
   - 9.2 [Navigazione con `require_db`](#92-navigazione-con-require_db)
   - 9.3 [Import da Excel](#93-import-da-excel)
   - 9.4 [Tracciamento degli Aggiornamenti](#94-tracciamento-degli-aggiornamenti)
10. [Installazione e Avvio](#10-installazione-e-avvio)
11. [Configurazione](#11-configurazione)
12. [Note di Sicurezza](#12-note-di-sicurezza)

---

## 1. Panoramica del Progetto

GSM è pensato per operatori sociali (es. sportelli HR, guardaroba, case manager) che hanno bisogno di:

- **Registrare persone** prese in carico, con dati anagrafici completi.
- **Associare servizi** (sportello, guardaroba, equipe marginalità, ecc.) alle persone.
- **Registrare bisogni** espressi (abitativi, sanitari, lavorativi, legali, ecc.) per categoria.
- **Monitorare situazioni** individuali (situazione lavorativa, sanitaria, documenti, ecc.).
- **Loggare aggiornamenti** datati con note testuali per ogni servizio, bisogno o situazione monitorata.
- **Importare** dati storici da fogli Excel strutturati (Sportello HR + Guardaroba).
- **Esportare** report in CSV o JSONL.
- **Gestire più database** MongoDB sulla stessa istanza (es. per organizzazioni diverse).

---

## 2. Stack Tecnologico

| Livello | Tecnologia |
|---|---|
| Web framework | [Flask](https://flask.palletsprojects.com/) |
| Database | [MongoDB](https://www.mongodb.com/) via [PyMongo](https://pymongo.readthedocs.io/) |
| ORM / Query | Layer custom basato su decorator (`query.py`) |
| Autenticazione | Flask sessions + [passlib](https://passlib.readthedocs.io/) (PBKDF2-SHA256) |
| Gestione env | [python-dotenv](https://github.com/theskumar/python-dotenv) |
| Manipolazione dati | [pandas](https://pandas.pydata.org/) + [numpy](https://numpy.org/) |
| Import Excel | `pandas.read_excel` |
| CORS | [Flask-CORS](https://flask-cors.readthedocs.io/) |
| UI Components | [Bootstrap 5.3](https://getbootstrap.com/) |
| Data Grid | [AG Grid Community](https://www.ag-grid.com/) |
| Select avanzato | [Tom Select 2.4](https://tom-select.js.org/) |
| Linguaggio frontend | Vanilla JavaScript (module pattern IIFE) |

---

## 3. Struttura del Progetto

```
GSM/
├── pyproject.toml              # Configurazione build e dipendenze
├── launch.bat                  # Script di avvio (Windows)
├── clone-repo.bat / update-repo.bat / install-git.bat
├── accessi-guardaroba.tsv      # File TSV temporanei generati dal migrator
├── accessi-sportello.tsv
│
├── data/                       # Dati di esempio / sviluppo
│   ├── csv/
│   ├── json/
│   └── og/
│
├── migrator_test_data/         # TSV di test per il migrator
│
├── test/                       # Notebook Jupyter di test e utilità
│   ├── popdb.ipynb             # Popolamento DB di test
│   ├── utenze.ipynb            # Gestione utenti
│   └── ...
│
└── src/
    └── gsm/                    # Package principale
        ├── __init__.py
        ├── app.py              # Flask application factory
        ├── backend/
        │   ├── __init__.py
        │   └── routes.py       # Tutte le route HTTP
        ├── db/
        │   ├── __init__.py     # Riesporta DBI e Q
        │   ├── dbi.py          # DatabaseInterface (singleton)
        │   ├── query.py        # Funzioni di query registrate
        │   ├── auth_manager.py # Gestione utenti e autenticazione
        │   └── migrator/
        │       ├── __init__.py
        │       ├── loader.py   # Caricamento e normalizzazione Excel
        │       └── storer.py   # Scrittura su MongoDB
        └── frontend/
            ├── templates/      # Template HTML (Jinja2)
            └── static/
                ├── css/
                ├── js/         # Moduli JavaScript (uno per pagina)
                └── libs/       # Librerie terze parti vendored
```

---

## 4. Backend (Python / Flask)

### 4.1 Entry point — `app.py`

```python
# src/gsm/app.py
app = create_app()
```

La factory `create_app()`:
1. Crea l'istanza Flask con `static_folder` e `template_folder` puntati sul frontend.
2. Imposta `SECRET_KEY` e `PERMANENT_SESSION_LIFETIME` (7 giorni).
3. Abilita CORS.
4. Importa il modulo `routes` nel contesto dell'app (registration pattern Flask).
5. Connette MongoDB tramite `DBI.connect()` (chiamato al momento dell'import di `dbi.py`).

> **Nota**: Il `SECRET_KEY` hardcodato è un placeholder da sostituire in produzione tramite variabile d'ambiente.

---

### 4.2 Database Interface — `dbi.py`

Il modulo espone il singleton `DBI` (istanza di `DatabaseInterface`).

```
DBI
 ├── connection_string   # Letta da .env: CONNECTION_STRING
 ├── db_name             # None al boot, impostato a runtime
 ├── db                  # Oggetto database MongoDB attivo
 ├── auth_db             # Punta sempre a 'utent3db' (utenti)
 └── client              # MongoClient
```

**Metodi chiave**:

| Metodo | Descrizione |
|---|---|
| `connect()` | Apre connessione, inizializza `auth_db` |
| `set_db(db_name)` | Cambia il database attivo a runtime |
| `get_db_name()` | Restituisce il nome del DB corrente |
| `is_db_selected()` | `True` se un DB è stato selezionato |
| `list_databases()` | Lista tutti i DB disponibili (esclude `admin`, `local`, `config`, `utent3db`) |
| `get_users_collection()` | Collection `users` in `utent3db` |

Il DB di autenticazione (`utent3db`) è **separato** dai DB operativi, permettendo di avere utenti condivisi tra più database di dati.

---

### 4.3 Query Layer — `query.py`

Il modulo usa un pattern di **registrazione mediante decorator**:

```python
QUERY_NAMES_MAP = dict()

def q(func):
    QUERY_NAMES_MAP[func.__name__] = func
    return func

@q
def persone(filters=dict(), projection=dict()):
    ...
```

Ogni funzione decorata con `@q` viene registrata nel dizionario `QUERY_NAMES_MAP` con la propria chiave uguale al nome della funzione. Le route la usano così:

```python
result = Q.QUERY_NAMES_MAP['persone']()
```

La route `/q` (endpoint generico) permette anche al frontend di invocare direttamente le query per nome:

```javascript
fetch('/q', { method: 'POST', body: JSON.stringify({ query: 'persone' }) })
```

**Funzioni di query registrate**:

| Funzione | Descrizione |
|---|---|
| `get(collection, filters, projection)` | Query generica su qualsiasi collection |
| `persone()` | Tutti i documenti `persone`, restituiti come `{data, columns}` |
| `servizi()` | Tutti i servizi + conteggio persone per ciascuno |
| `bisogni()` | Tutti i bisogni |
| `monitor()` | Tutte le situazioni monitorabili |
| `persona(persona_id)` | Singola persona per ObjectId |
| `servizio(servizio_id)` | Singolo servizio + conteggio persone |
| `persone_con_servizio(servizio_id)` | Persone che hanno quel servizio |
| `aggiornamenti_servizio(servizio_id)` | Tutti gli aggiornamenti di un servizio, ordinati per data desc |
| `persone_con_bisogno_categoria(categoria)` | Persone con almeno un bisogno della categoria |
| `aggiornamenti_categoria_bisogno(categoria)` | Aggiornamenti di tutti i bisogni di una categoria |
| `tutti_aggiornamenti()` | Tutti gli aggiornamenti (servizi + bisogni) di tutte le persone |
| `add_aggiornamento(persona_id, tipo, item_id, note, data)` | Aggiunge un aggiornamento (`$push`) |
| `remove_aggiornamento(persona_id, tipo, item_id, data)` | Rimuove per data (`$pull`) |
| `update_aggiornamento(...)` | Modifica filtrando il vecchio, inserendo il nuovo, riscrivendo l'array con `$set` |
| `delete_aggiornamento(...)` | Rimozione con tolleranza di 1 secondo sulla data |
| `edit_aggiornamento(...)` | Alias di `update_aggiornamento` |
| `add_servizio_to_persona(persona_id, servizio_id)` | `$set` array vuoto per il servizio |
| `add_bisogno_to_persona(persona_id, bisogno_id)` | `$set` array vuoto per il bisogno |
| `add_monitor_to_persona(persona_id, monitor_id)` | `$set` array vuoto per il monitor |
| `remove_servizio_from_persona(persona_id, servizio_id)` | `$unset` dal campo servizi |
| `remove_bisogno_from_persona(persona_id, bisogno_id)` | `$unset` dal campo bisogni |
| `create_persona(persona_data)` | Insert in collection `persone` |
| `update_persona(persona_id, field_name, field_value)` | `$set` su un singolo campo |
| `delete_persona(persona_id)` | Delete documento persona |
| `create_servizio(nome, descrizione)` | Insert in collection `servizi` |
| `create_bisogno(nome, categoria, descrizione)` | Insert in collection `bisogni` |
| `create_monitor(nome, descrizione)` | Insert in collection `monitor` |
| `get_unique_values(field_name)` | `distinct()` su un campo di `persone` |

---

### 4.4 Autenticazione — `auth_manager.py`

Classe statica `AuthManager` che opera sulla collection `users` in `utent3db`.

**Metodi**:

| Metodo | Descrizione |
|---|---|
| `create_user(username, password, role='user')` | Hash PBKDF2-SHA256 + insert |
| `validate_user(username, password)` | Verifica hash; restituisce `{success, username, role}` |
| `get_user(username)` | Legge utente senza esporre `password_hash` |
| `update_password(username, new_password)` | Rigenera hash e aggiorna |
| `list_users()` | Lista tutti gli utenti senza `password_hash` |
| `delete_user(username)` | Elimina utente |

Le password vengono hashate con **PBKDF2-SHA256** tramite `passlib`. Non vengono mai salvate in chiaro.

La sessione Flask, dopo il login, memorizza:
```python
session['username'] = username
session['role'] = role      # 'user' | 'admin'
session.permanent = True    # durata: 7 giorni
```

---

### 4.5 Route HTTP — `routes.py`

#### Decorator `require_db`

La maggior parte delle route è protetta da `@require_db`:

```python
def require_db(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not DBI.is_db_selected():
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function
```

Se nessun database è selezionato, l'utente viene reindirizzato alla homepage di configurazione.

#### Gruppi di route

| Gruppo | Prefisso | Descrizione |
|---|---|---|
| Autenticazione API | `/api/login`, `/api/logout`, `/api/current-user` | Login/logout, stato sessione |
| Database API | `/api/current-db`, `/api/list-databases`, `/api/select-db` | Selezione DB runtime |
| Pagine principali | `/`, `/persone`, `/aggiornamenti`, `/servizi`, `/bisogni`, `/report` | Render template HTML |
| Dettaglio | `/persona/<id>`, `/servizio/<id>`, `/categoria-bisogno/<cat>` | Pagine di dettaglio |
| Query generica | `/q` (POST) | Esegue query registrate per nome |
| CRUD Persona | `/create-persona`, `/update-persona`, `/delete-persona` | Gestione anagrafica |
| CRUD Servizi/Bisogni/Monitor | `/add-servizio`, `/remove-servizio`, `/create-servizio`, … | Associazione entità |
| Aggiornamenti | `/add-aggiornamento`, `/remove-aggiornamento`, `/update-aggiornamento`, `/delete-aggiornamento`, `/edit-aggiornamento` | Log degli interventi |
| Import | `/import`, `/preview-excel`, `/confirm-import` | Import da Excel |
| Utility | `/unique-values/<field>`, `/dati_servizio`, `/dati_categoria_bisogno` | Dati aggregati per UI |

---

## 5. Migrator (Import Dati)

### 5.1 Loader — `loader.py`

Classe `XLSXLoader(sportello_xlsx_path, guardaroba_xlsx_path)`.

**Flusso di caricamento**:

1. **`_import_sportello(xlsx)`**: legge il foglio `SPORTELLO HR ACCESSI` dall'Excel dello sportello, normalizza i nomi delle colonne (lowercase, underscore), rimuove colonne non necessarie, rinomina per portarle allo schema interno. Verifica con `assert` che le colonne finali siano esattamente quelle attese.

2. **`_import_guardaroba(xlsx)`**: stesso processo per il foglio `ACCESSI` dell'Excel del guardaroba.

3. **`_merge_persone(df_sportello, df_guardaroba)`**: unisce le due sorgenti con `merge(..., on='nome_cognome', how='outer')`, deduplica per `nome_cognome` (tenendo l'ultimo record), propaga i valori mancanti da una sorgente all'altra usando le colonne con suffisso `_gs`.

4. **`load_persone()`**: chiama i tre metodi sopra in sequenza e restituisce il DataFrame unificato.

Il metodo intermedio `_xlsx2tsv` converte ogni foglio in un file `.tsv` temporaneo sul filesystem (`accessi-sportello.tsv`, `accessi-guardaroba.tsv`) prima di leggerlo con `pandas`.

---

### 5.2 Storer — `storer.py`

Classe `DBStorer()`.

**Metodo principale**: `new_db_from_xlsx_loader(xlsx_loader, db_name)`

1. Imposta il database attivo (`DBI.set_db(db_name)`).
2. **`_store_servizi()`**: inserisce nella collection `servizi` la lista statica predefinita di 15 servizi (sportello, guardaroba, equipe marginalità, ecc.); restituisce un DataFrame con gli `_id` assegnati da MongoDB.
3. **`_store_persone(df_persone)`**: per ogni persona, converte le colonne servizi (valori non nulli) nel formato `{"servizio_id": []}`, imposta `bisogni: {}`, ed esegue l'insert massiccio.
4. **`_store_bisogni()`**: inserisce ~100 bisogni predefiniti organizzati in 8 categorie: Abitativi, Sanitari, Documentali, Economici, Legali, Lavorativi, Formativi, Psicosociali, Specifici.
5. **`_store_monitor()`**: inserisce 7 situazioni di monitoraggio predefinite: situazione familiare/relazionale, lavorativa, sanitaria, documenti, condizione abitativa, progettualità, generale.

Restituisce `(df_servizi, df_persone, df_bisogni, df_monitor)`.

---

## 6. Frontend (HTML + Vanilla JS)

### 6.1 Architettura Frontend

Il frontend è **server-rendered (SSR) con interattività client-side**:

- Flask renderizza i template HTML con Jinja2.
- Ogni pagina include il proprio file JS, strutturato come **IIFE module pattern**:

```javascript
const NomeModulo = (() => {
    // stato privato
    let data = [];

    function init() { ... }

    // funzioni private
    function fetchData() { ... }

    return { init };  // API pubblica
})();

document.addEventListener('DOMContentLoaded', () => {
    NomeModulo.init();
});
```

- La comunicazione col backend avviene **esclusivamente tramite fetch API** (JSON), tranne per la pagina di import che usa `FormData`.
- La libreria AG Grid gestisce tutte le tabelle dati (con sorting, filtering, quick search, export CSV).
- Tom Select trasforma le `<select>` normali in controlli avanzati con ricerca e creazione di nuove voci.

---

### 6.2 Template HTML

| Template | Route | Descrizione |
|---|---|---|
| `index.html` | `/` | Home: login e selezione database. Pagina di configurazione iniziale. |
| `sidebar.html` | (incluso) | Sidebar di navigazione con DB/utente corrente. Iniettata via `{% include %}` nelle altre pagine. |
| `persone.html` | `/persone` | Griglia persone con filtri, ricerca, esportazione. |
| `persona.html` | `/persona/<id>` | Dettaglio persona con accordion servizi, bisogni, monitor e log aggiornamenti. |
| `new-persona.html` | `/new-persona` | Form di creazione nuova persona con campi con autocomplete. |
| `servizi.html` | `/servizi` | Elenco servizi come card. |
| `servizio.html` | `/servizio/<id>` | Dettaglio servizio: griglia persone associate e log aggiornamenti. |
| `bisogni.html` | `/bisogni` | Lista/griglia bisogni raggruppati per categoria. |
| `categoria-bisogno.html` | `/categoria-bisogno/<cat>` | Dettaglio categoria: persone e aggiornamenti. |
| `aggiornamenti.html` | `/aggiornamenti` | Griglia globale di tutti gli aggiornamenti (servizi + bisogni). |
| `report.html` | `/report` | Pagina report con grafici e statistiche aggregate. |
| `import.html` | `/import` | Wizard di importazione dati da Excel. |

---

### 6.3 Moduli JavaScript

#### `config.js` — `ConfigManager`

Gestisce la pagina home (`/`). Controlla lo stato di autenticazione e selezione DB. Mostra/nasconde la sezione di login e quella di selezione database. Reindirizza all'area operativa una volta che entrambe le condizioni sono soddisfatte.

#### `db-selector.js` — `DBSelector`

Usato nella pagina di configurazione per listare i database disponibili (via `/api/list-databases`) e consentire la selezione con un Tom Select. Mostra un badge "database attivo" una volta selezionato.

#### `login.js` — `LoginManager`

Gestisce il form di login/logout in pagine che non usano `ConfigManager`. Chiama `/api/login` e `/api/logout`.

#### `persone.js` — `GridPersone`

- Carica persone, servizi e bisogni in parallelo tramite `/q`.
- Crea una AG Grid con colonne configurabili, pinning della colonna azioni a sinistra.
- `BASE_COLUMN_NAMES`: colonne visibili per default.
- `HIDE_COLUMN_NAMES`: colonne sempre nascoste (es. `monitor`).
- Colonne `servizi` e `bisogni`: cell renderer con badge colorati (anteprima primi 3 + badge `+N`); click apre una modale.
- Panel laterale con checkbox per mostrare/nascondere colonne individualmente, con shortcut "Mostra tutte" / "Solo colonne base".
- Export CSV e JSONL (dati filtrati dalla griglia).
- Quick filter testuale tramite `setGridOption('quickFilterText', ...)`.

#### `persona.js` — `PersonaDetail`

- Pagina di dettaglio di una singola persona. I dati vengono iniettati da Flask tramite `window.personaData = {{ persona | tojson }}`.  
- Carica servizi, bisogni e monitor associati.
- Accordion Bootstrap per visualizzare le sezioni: servizi, bisogni, situazioni monitorate.
- Per ogni entità associata: lista di aggiornamenti con data e note, possibilità di aggiungere/modificare/eliminare aggiornamenti.
- Deep link: se la URL contiene parametri `?tipo=...&item_id=...&data=...`, la pagina scrolla automaticamente all'aggiornamento corrispondente.
- Campo anagrafica inline editabile (click sul valore → input → salvataggio automatico via `/update-persona`).

#### `new-persona.js` — `NewPersona`

- Form di creazione con campi testo base + campi `data-select="true"` che vengono trasformati dinamicamente in Tom Select con valori recuperati da `/unique-values/<field>`.
- Attivando `data-select-new="true"`, consente la creazione di nuovi valori dall'input.

#### `servizi.js` — `Servizi`

Renderizza i servizi come card Bootstrap. Ordine: "sportello" → "guardaroba" → alfabetico. Click sulla card naviga al dettaglio (`/servizio/<id>`). Include form modale per creare un nuovo servizio.

#### `servizio.js` — `ServizioDetail`

Carica persone e aggiornamenti relativi a un servizio da `/dati_servizio`. Mostra due AG Grid: persone associate (con link alla persona) e log aggiornamenti.

#### `bisogni.js` — `Bisogni`

Vista duale (lista / griglia). Raggruppa i bisogni per categoria. Per ogni categoria mostra il numero di persone che l'hanno attiva. Toggle tra vista compatta e vista espansa.

#### `categoria-bisogno.js` — `CategoriaBisogno`

Analoga a `servizio.js`, carica persone e aggiornamenti di tutti i bisogni di una categoria da `/dati_categoria_bisogno`.

#### `aggiornamenti.js` — `GridAggiornamenti`

AG Grid globale di tutti gli aggiornamenti (`tutti_aggiornamenti`). Colonne: data, cognome, nome, tipo (servizio/bisogno), item_nome, note. Link diretto `Apri` che porta alla pagina persona con deep link all'aggiornamento specifico.

#### `report.js` — `Report`

Carica persone, servizi, bisogni e aggiornamenti. Calcola e renderizza statistiche aggregate (es. numero persone per servizio, distribuzione per genere, età media, distribuzione bisogni per categoria). Supporta esportazione.

#### `import.js` — `ImportData`

Flusso a due fasi:
1. **Preview**: invia i due file Excel via `FormData` a `/preview-excel`, mostra i primi 200 record in una AG Grid di anteprima.
2. **Conferma**: invia il `session_id` ricevuto a `/confirm-import`, attende la risposta con il conteggio dei record importati, mostra il riepilogo.

Include barra di progresso simulata e gestione degli errori.

---

## 7. Modello Dati (MongoDB)

### 7.1 Collection `persone`

Documento rappresentante una persona presa in carico.

```jsonc
{
  "_id": ObjectId("..."),
  "data_inserimento": ISODate("..."),
  "cognome": "Rossi",
  "nome": "Mario",
  "data_nascita": ISODate("1985-03-15"),
  "eta": 40,
  "luogo_nascita": "Roma",
  "citta": "Milano",
  "genere": "M",
  "documento": "CI",
  "telefono": "333...",
  "stato_civile": "celibe",
  "figli": "0",
  "condizione_abitativa": "senza dimora",
  "categoria_ethos": "1.1",
  "lavoro": "disoccupato",
  "in_carico_presso": "sportello",
  "istruzione": "media",
  "residenza": "fittizia",
  "servizi_sociali": "...",

  // Mappa servizi: chiave = _id del servizio (stringa), valore = array di aggiornamenti
  "servizi": {
    "6973d70aafb5b1cfa22b210a": [
      { "data": ISODate("2024-01-10"), "note": "Primo accesso" },
      { "data": ISODate("2024-03-05"), "note": "Follow-up" }
    ]
  },

  // Mappa bisogni: chiave = _id del bisogno (stringa), valore = array di aggiornamenti
  "bisogni": {
    "6973d70aafb5b1cfa22b210f": [
      { "data": ISODate("2024-01-10"), "note": "Richiesta residenza fittizia" }
    ]
  },

  // Mappa monitor: chiave = _id del monitor (stringa), valore = array di aggiornamenti
  "monitor": {
    "6973d70aafb5b1cfa22b2150": [
      { "data": ISODate("2024-02-01"), "note": "Situazione stabile" }
    ]
  }
}
```

> **Nota sul modello di aggiornamenti**: il campo `servizi`, `bisogni` e `monitor` all'interno di `persone` è una **mappa annidata**. Questo design denormalizzato permette di recuperare tutti gli aggiornamenti di una persona con una singola query `find_one`. Il trade-off è che le query per aggregare aggiornamenti trasversalmente a tutte le persone richiedono di caricare tutte le persone e iterare in Python.

---

### 7.2 Collection `servizi`

```jsonc
{
  "_id": ObjectId("..."),
  "nome_servizio": "equipe_marginalita",
  "descrizione_servizio": "Equipe Marginalita"
}
```

**Servizi predefiniti** (popolati dal migrator):

| nome_servizio | Descrizione |
|---|---|
| `sportello` | Sportello |
| `guardaroba` | Guardaroba |
| `kit_emergenza` | Kit Emergenza |
| `equipe_marginalita` | Equipe Marginalita |
| `presa_in_carico_case_management` | Presa In Carico Case Management |
| `assessment_orientamento` | Assessment Orientamento |
| `orientamento_lavoro` | Orientamento Lavoro |
| `consulenza_amm_legale` | Consulenza Amm Legale |
| `accompagnamento_residenza_fittizia` | Accompagnamento Residenza Fittizia |
| `accoglienza_notturna` | Accoglienza Notturna |
| `servizi_igiene_personale` | Servizi Igiene Personale |
| `distribuzione_beni_essenziali` | Distribuzione Beni Essenziali |
| `servizi_mediazione_linguistico_culturale` | Servizi Mediazione Linguistico Culturale |
| `corsi_lingua_italiana` | Corsi Lingua Italiana |
| `front_office` | Front Office |

---

### 7.3 Collection `bisogni`

```jsonc
{
  "_id": ObjectId("..."),
  "nome_bisogno": "Residenza fittizia / domicilio fittizio",
  "categoria_bisogno": "Abitativi",
  "descrizione_bisogno": "Necessità di ottenere una residenza fittizia per tutelare i diritti."
}
```

**Categorie predefinite**: `Abitativi`, `Sanitari`, `Documentali`, `Economici`, `Legali`, `Lavorativi`, `Formativi`, `Psicosociali`, `Specifici`.

Il catalogo include circa **100 bisogni** predefiniti.

---

### 7.4 Collection `monitor`

```jsonc
{
  "_id": ObjectId("..."),
  "nome_monitor": "situazione_lavorativa",
  "descrizione_monitor": "Situazione lavorativa"
}
```

**Situazioni predefinite**: `situazione_familiare_relazionale`, `situazione_lavorativa`, `situazione_sanitaria`, `situazione_documenti`, `condizione_abitativa`, `progettualità`, `generale`.

---

### 7.5 Database `utent3db` — Collection `users`

Database separato, condiviso tra tutti i database operativi.

```jsonc
{
  "_id": ObjectId("..."),
  "username": "operatore1",
  "password_hash": "$pbkdf2-sha256$...",
  "role": "user",
  "created_at": ISODate("...")
}
```

---

## 8. API Reference

Tutte le API restituiscono JSON. In caso di successo: `{"success": true, ...}`. In caso di errore: `{"success": false, "error": "messaggio"}` con HTTP status appropriato.

---

### 8.1 Autenticazione

#### `GET /api/current-user`
Restituisce l'utente in sessione.
```json
{ "success": true, "username": "mario", "is_authenticated": true }
```

#### `POST /api/login`
```json
// Request
{ "username": "mario", "password": "secret" }

// Response 200
{ "success": true, "username": "mario", "role": "user" }

// Response 401
{ "success": false, "error": "Password errata" }
```

#### `POST /api/logout`
```json
// Response 200
{ "success": true, "message": "Logout effettuato per mario" }
```

---

### 8.2 Selezione Database

#### `GET /api/current-db`
```json
{ "success": true, "db_name": "gsm_2024", "is_selected": true }
```

#### `GET /api/list-databases`
```json
{ "success": true, "databases": ["gsm_2024", "gsm_test"] }
```

#### `POST /api/select-db`
```json
// Request
{ "db_name": "gsm_2024" }

// Response 200
{ "success": true, "db_name": "gsm_2024", "message": "..." }
```

---

### 8.3 Query Generica `/q`

#### `POST /q`
Esegue una delle funzioni registrate nel `QUERY_NAMES_MAP`.

```json
// Request
{ "query": "persone" }

// Response
{
  "columns": ["_id", "cognome", "nome", "eta", ...],
  "data": [
    { "_id": "...", "cognome": "Rossi", "nome": "Mario", ... },
    ...
  ]
}
```

Nomi di query disponibili: `persone`, `servizi`, `bisogni`, `monitor`, `tutti_aggiornamenti`, e tutte le altre funzioni `@q`.

---

### 8.4 Persone

#### `POST /create-persona`
```json
// Request
{
  "cognome": "Bianchi", "nome": "Luca", "data_nascita": "1990-05-20",
  "genere": "M", "citta": "Roma", ...
}
// Response
{ "success": true, "persona_id": "..." }
```

#### `POST /update-persona`
Aggiorna un singolo campo. Se il campo è `data_nascita`, ricalcola automaticamente `eta`.
```json
// Request
{ "persona_id": "...", "field_name": "citta", "field_value": "Torino" }
// Response
{ "success": true, "modified_count": 1 }
```

#### `POST /delete-persona`
```json
{ "persona_id": "..." }
```

#### `GET /unique-values/<field_name>`
Restituisce valori distinti non vuoti per un campo da `persone`.
```json
{ "values": ["celibe", "coniugato", "divorziato", ...] }
```

---

### 8.5 Servizi

#### `POST /create-servizio`
```json
{ "nome_servizio": "nuovo_servizio", "descrizione_servizio": "Nuovo Servizio" }
```

#### `POST /add-servizio`
Associa un servizio a una persona (inizializza con array vuoto).
```json
{ "persona_id": "...", "item_id": "<servizio_id>" }
```

#### `POST /remove-servizio`
```json
{ "persona_id": "...", "servizio_id": "..." }
```

#### `POST /dati_servizio`
Ritorna persone e aggiornamenti di un servizio specifico.
```json
// Request
{ "servizio_id": "..." }
// Response
{ "persone": [...], "aggiornamenti": [...] }
```

---

### 8.6 Bisogni

#### `POST /create-bisogno`
```json
{ "nome_bisogno": "...", "categoria_bisogno": "Abitativi", "descrizione_bisogno": "..." }
```

#### `POST /add-bisogno`
```json
{ "persona_id": "...", "item_id": "<bisogno_id>" }
```

#### `POST /remove-bisogno`
```json
{ "persona_id": "...", "bisogno_id": "..." }
```

#### `POST /dati_categoria_bisogno`
```json
// Request
{ "categoria": "Sanitari" }
// Response
{ "persone": [...], "aggiornamenti": [...], "num_bisogni": 25 }
```

---

### 8.7 Monitor

#### `POST /create-monitor`
```json
{ "nome_monitor": "...", "descrizione_monitor": "..." }
```

#### `POST /add-monitor`
```json
{ "persona_id": "...", "item_id": "<monitor_id>" }
```

---

### 8.8 Aggiornamenti

Un aggiornamento è sempre identificato dalla terna `(persona_id, tipo, item_id, data)`.  
`tipo` può essere: `"servizio"`, `"bisogno"`, `"monitor"`.

#### `POST /add-aggiornamento`
```json
{
  "persona_id": "...",
  "tipo": "servizio",
  "item_id": "...",
  "data": "2024-03-15T10:00:00Z",
  "note": "Colloquio di orientamento"
}
```

#### `POST /remove-aggiornamento`
```json
{ "persona_id": "...", "tipo": "servizio", "item_id": "...", "data": "..." }
```

#### `POST /delete-aggiornamento`
Come `remove-aggiornamento`, ma con tolleranza di 1 secondo nel confronto date.

#### `POST /update-aggiornamento` / `POST /edit-aggiornamento`
Equivalenti. Modificano data e/o note di un aggiornamento esistente.
```json
{
  "persona_id": "...",
  "tipo": "bisogno",
  "item_id": "...",
  "old_data": "2024-03-15T10:00:00Z",
  "new_data": "2024-03-16T09:00:00Z",
  "new_note": "Aggiornamento corretto"
}
```

---

### 8.9 Import Dati

#### `POST /preview-excel`
Multipart form data.

| Campo | Tipo | Descrizione |
|---|---|---|
| `sportello_file` | File | Excel Sportello HR Accessi |
| `guardaroba_file` | File | Excel Guardaroba |
| `db_name` | String | Nome del nuovo database da creare |

```json
// Response
{
  "success": true,
  "session_id": "uuid-...",
  "preview_data": [...],   // max 200 righe
  "total_rows": 450
}
```

#### `POST /confirm-import`
```json
// Request
{ "session_id": "uuid-..." }

// Response
{
  "success": true,
  "num_servizi": 15,
  "num_persone": 450,
  "num_bisogni": 98,
  "num_monitor": 7
}
```

---

## 9. Flussi Applicativi Principali

### 9.1 Login e Selezione Database

```
Utente → GET /
  └─ index.html caricato
     └─ ConfigManager.init()
        ├─ checkCurrentUser()   → GET /api/current-user
        │   ├─ (loggato) → showUserLogged()
        │   └─ (non loggato) → showLoginForm()
        │
        ├─ checkCurrentDatabase() → GET /api/current-db
        │   ├─ (DB selezionato) → showDatabaseSelected()
        │   └─ (nessun DB) → showDatabaseSelector()
        │
        └─ (entrambi OK) → abilita navigazione
```

### 9.2 Navigazione con `require_db`

Tutte le route operative (es. `/persone`, `/persona/<id>`) sono protette dal decorator `@require_db`. Se `DBI.db is None`, Flask redirige a `/`. Questo garantisce che nessuna operazione sul DB venga eseguita senza un database selezionato.

Il database selezionato viene mantenuto **nella variabile di modulo `DBI.db`** (in memoria del processo), non nella sessione HTTP. Di conseguenza, in deployment multi-processo (es. gunicorn con più worker) la selezione del database deve essere gestita diversamente.

---

### 9.3 Import da Excel

```
Utente → GET /import
  └─ import.html

Utente carica due file + nome DB → POST /preview-excel
  └─ Flask:
     1. Salva file in tempdir
     2. XLSXLoader.load_persone()
     3. Genera session_id (UUID)
     4. Salva percorsi in session[session_id]
     5. Restituisce preview (max 200 righe) + session_id

Utente conferma → POST /confirm-import { session_id }
  └─ Flask:
     1. Recupera percorsi da sessione
     2. XLSXLoader.load_persone()
     3. DBStorer.new_db_from_xlsx_loader()
        ├─ DBI.set_db(db_name)
        ├─ _store_servizi()
        ├─ _store_persone()
        ├─ _store_bisogni()
        └─ _store_monitor()
     4. Pulizia tempdir
     5. Rimuove session[session_id]
     6. Restituisce conteggi
```

---

### 9.4 Tracciamento degli Aggiornamenti

Ogni intervento su una persona viene salvato come entry nell'array annidato nel documento persona:

```
MongoDB: persone.{persona_id}.servizi.{servizio_id} → Array<{data, note}>
MongoDB: persone.{persona_id}.bisogni.{bisogno_id}  → Array<{data, note}>
MongoDB: persone.{persona_id}.monitor.{monitor_id}  → Array<{data, note}>
```

**Aggiunta**: `$push` — atomica e non richiede lettura preliminare.  
**Rimozione**: `$pull` con match esatto sulla data (tolleranza ±1s).  
**Modifica**: read-modify-write con `$set` sull'intero array (non atomica, ma sicura per uso monoutente o bassa concorrenza).

---

## 10. Installazione e Avvio

### Prerequisiti

- Python ≥ 3.8
- MongoDB in esecuzione su `localhost:27017` (o configurabile via `.env`)
- (Windows) Git, disponibile tramite `install-git.bat`

### Installazione

```bash
# Clone del repository
git clone <repo-url>
cd GSM

# Installazione dipendenze
pip install -e .
```

Oppure su Windows: eseguire `clone-repo.bat` per clonare e `launch.bat` per avviare.

### Configurazione `.env`

```env
CONNECTION_STRING=mongodb://localhost:27017/
```

### Avvio

```bash
flask --app src/gsm/app run
# oppure
python -m flask --app src/gsm/app run --debug
```

### Creare il primo utente

Usare il notebook `test/utenze.ipynb` oppure eseguire direttamente:

```python
from gsm.db.auth_manager import AuthManager
AuthManager.create_user("admin", "password_sicura", role="admin")
```

### Import dati iniziali

1. Navigare a `/import` (non richiede DB selezionato).
2. Caricare i file Excel: **Sportello HR Accessi** e **Guardaroba**.
3. Specificare il nome del nuovo database.
4. Verificare l'anteprima e confermare.

---

## 11. Configurazione

| Parametro | Fonte | Default | Note |
|---|---|---|---|
| `CONNECTION_STRING` | `.env` | `mongodb://localhost:27017/` | Stringa connessione MongoDB |
| `SECRET_KEY` | `app.py` hardcoded | `your-secret-key-change-in-production` | **Da cambiare in produzione** |
| `PERMANENT_SESSION_LIFETIME` | `app.py` | 7 giorni | Durata sessione |
| DB operativo | UI / `/api/select-db` | `None` (nessuno) | Selezionato a runtime |
| DB autenticazione | `dbi.py` hardcoded | `utent3db` | Non configurabile |

---

## 12. Note di Sicurezza

1. **SECRET_KEY**: il valore hardcoded in `app.py` deve essere sostituito con una stringa casuale lunga almeno 24 caratteri in ambiente di produzione, caricata da variabile d'ambiente.

2. **Multi-processo**: la variabile `DBI.db` è in-process. In deployment con più worker Flask (gunicorn, uWSGI), la selezione del database non è condivisa tra worker. Per ambienti multi-processo è necessario spostare la selezione del DB nella sessione HTTP o in un middleware condiviso.

3. **Autenticazione sulle route**: attualmente solo il decorator `@require_db` è attivo. Non esiste un controllo che l'utente sia autenticato (`@require_user`) sulle route operative. Il login è gestito lato client e non blocca server-side l'accesso se la sessione non è presente.

4. **CORS**: abilitato globalmente con `Flask-CORS` senza restrizioni di origine. In produzione, limitare al dominio effettivo.

5. **Import file**: i file Excel caricati vengono salvati in `tempfile.mkdtemp()` con `secure_filename` di Werkzeug. Il `temp_dir` viene eliminato dopo l'import; in caso di errore, potrebbe rimanere sul filesystem.

6. **Password**: hashate con PBKDF2-SHA256 via `passlib`. Non vengono mai esposte nelle risposte API.
