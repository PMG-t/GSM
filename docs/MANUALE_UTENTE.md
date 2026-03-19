# GSM — Manuale Utente

> Guida all'utilizzo dell'applicazione per operatori dello sportello sociale.

---

## Indice

1. [Installazione e Avvio](#1-installazione-e-avvio)
2. [Accesso e Configurazione Iniziale](#2-accesso-e-configurazione-iniziale)
   - 2.1 [Login](#21-login)
   - 2.2 [Selezione del Database](#22-selezione-del-database)
3. [Navigazione](#3-navigazione)
4. [Persone](#4-persone)
   - 4.1 [Lista Persone](#41-lista-persone)
   - 4.2 [Ricerca e Filtri](#42-ricerca-e-filtri)
   - 4.3 [Gestione Colonne](#43-gestione-colonne)
   - 4.4 [Esportazione](#44-esportazione)
   - 4.5 [Nuova Persona](#45-nuova-persona)
5. [Scheda Persona](#5-scheda-persona)
   - 5.1 [Informazioni Anagrafiche](#51-informazioni-anagrafiche)
   - 5.2 [Situazione Abitativa e Sociale](#52-situazione-abitativa-e-sociale)
   - 5.3 [Lavoro e Istruzione](#53-lavoro-e-istruzione)
   - 5.4 [Situazioni da Monitorare](#54-situazioni-da-monitorare)
   - 5.5 [Servizi](#55-servizi)
   - 5.6 [Bisogni](#56-bisogni)
   - 5.7 [Eliminare una Persona](#57-eliminare-una-persona)
6. [Servizi](#6-servizi)
   - 6.1 [Lista Servizi](#61-lista-servizi)
   - 6.2 [Dettaglio Servizio](#62-dettaglio-servizio)
   - 6.3 [Creare un Nuovo Servizio](#63-creare-un-nuovo-servizio)
7. [Bisogni](#7-bisogni)
   - 7.1 [Lista Bisogni](#71-lista-bisogni)
   - 7.2 [Vista Lista e Vista Griglia](#72-vista-lista-e-vista-griglia)
   - 7.3 [Dettaglio Categoria](#73-dettaglio-categoria)
   - 7.4 [Creare un Nuovo Bisogno](#74-creare-un-nuovo-bisogno)
8. [Aggiornamenti](#8-aggiornamenti)
9. [Report](#9-report)
10. [Importazione Dati da Excel](#10-importazione-dati-da-excel)

---

## 1. Installazione e Avvio

> Questa sezione è rivolta a chi installa l'applicazione per la prima volta.

La cartella del progetto contiene alcuni file `.bat` per Windows che permettono di eseguire le operazioni principali senza usare la riga di comando.

| File | Cosa fa |
|---|---|
| `install-git.bat` | Installa Git sul computer (richiesto una sola volta) |
| `clone-repo.bat` | Scarica il codice dell'applicazione da GitHub |
| `update-repo.bat` | Aggiorna il codice all'ultima versione disponibile |
| `launch.bat` | **Avvia l'applicazione** |

**Prima installazione:**
1. Eseguire `install-git.bat` (solo la prima volta).
2. Eseguire `clone-repo.bat` per scaricare il progetto.
3. Assicurarsi che MongoDB sia in esecuzione sul computer.
4. Eseguire `launch.bat`.

**Avvio normale:**
- Fare doppio clic su `launch.bat`.
- Aprire il browser e andare su `http://localhost:5000`.

**Aggiornamenti:**
- Prima di avviare, eseguire `update-repo.bat` per scaricare le ultime modifiche.

---

## 2. Accesso e Configurazione Iniziale

Quando si apre l'applicazione per la prima volta (o dopo un logout) si arriva alla **pagina di configurazione** (`/`), che si divide in due sezioni: login utente e selezione del database.

### 2.1 Login

Il pannello di login mostra il nome utente e la password.

- Inserire le credenziali fornite dall'amministratore.
- Cliccare **Accedi**.
- Se le credenziali sono errate appare un messaggio in rosso sotto il form.
- Una volta autenticati, il pannello mostra il nome utente con un tasto **Esci**.

La sessione rimane attiva per 7 giorni. Alla scadenza, o dopo il logout, è necessario rieseguire il login.

### 2.2 Selezione del Database

Dopo il login, nella sezione **Database** si può:

- Scegliere un database esistente dall'elenco a tendina (con ricerca testuale integrata).
- Cliccare **Seleziona** per confermare.

Una volta selezionato, il nome del database appare nella sidebar. Da quel momento in poi tutte le pagine operative sono accessibili.

Per cambiare database: cliccare sul nome del DB nella sidebar (link alla pagina di configurazione) e scegliere un database diverso.

---

## 3. Navigazione

La **sidebar** è presente in tutte le pagine operative. Contiene:

**In alto:**
- Nome del database attivo e utente corrente — cliccando su questa area si torna alla pagina di configurazione per cambiare DB o utente.

**Sezione Persone:**
- **Persone** — lista di tutte le persone registrate.
- **Servizi** — elenco dei servizi disponibili.
- **Bisogni** — elenco dei bisogni per categoria.
- **Aggiornamenti** — log globale di tutti gli aggiornamenti.

**Sezione Strumenti:**
- **Report** — grafici e statistiche.
- **Importa Dati** — caricamento dati da file Excel.

---

## 4. Persone

### 4.1 Lista Persone

La pagina **Persone** (`/persone`) mostra tutte le persone nel database in una griglia tabellare interattiva.

Le colonne visibili di default sono: cognome, nome, data di nascita, età, luogo di nascita, città, genere, servizi, bisogni.

La prima colonna (fissa a sinistra) contiene il pulsante **Apri** per andare alla scheda della persona.

Le colonne **Servizi** e **Bisogni** mostrano badge colorati con i nomi (anteprima dei primi 3, più un badge _"+N"_ se ce ne sono altri). Cliccando su una cella servizi o bisogni si apre una modale con l'elenco completo.

Tutte le colonne supportano:
- **Ordinamento** — clic sull'intestazione per ordinare in ordine crescente/decrescente.
- **Filtro per colonna** — clic sull'icona filtro nell'intestazione per filtrare i valori.
- **Ridimensionamento** — trascinare il bordo dell'intestazione.

### 4.2 Ricerca e Filtri

In cima alla pagina c'è un campo **Cerca in tutte le colonne**. La ricerca è immediata (senza premere Invio) e filtra la griglia su tutti i campi visibili, incluse le descrizioni di servizi e bisogni.

### 4.3 Gestione Colonne

Il **pannello colonne** si trova a destra della griglia. Contiene:

- **Mostra tutte** — rende visibili tutte le colonne (tranne quelle nascoste di sistema).
- **Solo colonne base** — riporta la visualizzazione alle colonne predefinite.
- Una **checkbox per ogni campo** — attiva o disattiva singolarmente ogni colonna.

Le modifiche alla visibilità sono immediate.

### 4.4 Esportazione

Il pulsante **📥 Esporta** (in alto a destra) apre un menu con due opzioni:

- **📄 CSV** — esporta i dati filtrati correnti in formato CSV. Le colonne servizi e bisogni vengono espanse con i nomi leggibili separati da punto e virgola.
- **📋 JSON Lines** — esporta i dati filtrati correnti come JSONL (un oggetto JSON per riga). Utile per elaborazioni successive.

Il file viene nominato automaticamente `persone_AAAA-MM-GG.csv` o `.jsonl`.

> L'esportazione rispetta i filtri attivi: se è attiva una ricerca, vengono esportati solo i risultati visibili.

### 4.5 Nuova Persona

Il pulsante **+ Nuova Persona** porta al form di creazione (`/new-persona`).

**Campi obbligatori:** Cognome, Nome.

**Tutti gli altri campi** sono facoltativi:

| Sezione | Campi |
|---|---|
| Informazioni Personali | Data di nascita, Luogo di nascita, Genere, Città, Documento, Telefono, Stato civile, Figli |
| Situazione Abitativa e Sociale | Condizione abitativa, Categoria ETHOS, Residenza, Servizi sociali |
| Lavoro e Istruzione | Lavoro, Istruzione, In carico presso |

I campi con il selettore a tendina (documento, stato civile, condizione abitativa, ecc.) supportano la **creazione di nuovi valori**: se il valore desiderato non è in lista, è sufficiente digitarlo e premere Invio o selezionarlo dall'opzione che appare.

Cliccare **Salva Persona** per confermare. La pagina reindirizza automaticamente alla scheda della persona appena creata.

---

## 5. Scheda Persona

La pagina di dettaglio (`/persona/<id>`) è divisa in più sezioni.

### 5.1 Informazioni Anagrafiche

La card **Informazioni Personali** mostra in sola lettura tutti i dati anagrafici. Ogni campo ha un pulsante ✏️ per modificarlo.

**Modificare un campo:**
1. Cliccare ✏️ accanto al campo.
2. Il valore diventa un input (testo, data o select).
3. Modificare il valore.
4. Cliccare **Salva** (o premere Invio per i campi testo). Il dato viene aggiornato immediatamente.
5. Per annullare, cliccare **Annulla** senza salvare.

> Modificare la **data di nascita** aggiorna automaticamente anche il campo **Età**.

Campi modificabili: Cognome, Nome, Data di nascita, Luogo di nascita, Genere, Città, Documento, Telefono, Stato civile, Figli.

### 5.2 Situazione Abitativa e Sociale

Card separata con gli stessi controlli inline-edit per: Condizione abitativa, Categoria ETHOS, Residenza, Servizi sociali.

### 5.3 Lavoro e Istruzione

Card con inline-edit per: Lavoro, Istruzione, In carico presso.

### 5.4 Situazioni da Monitorare

La sezione **Situazioni da Monitorare** è una AG Grid espandibile con colonne collassabili, simile a quella delle persone. Mostra le situazioni monitorate per la persona con i rispettivi aggiornamenti.

**Pulsanti disponibili:**

- **+ Aggiungi situazione da monitorare** — apre una modale per associare una nuova situazione (es. *situazione lavorativa*, *condizione abitativa*, ecc.) alla persona.
- **+ Aggiungi riga di aggiornamento** — apre una modale per registrare un aggiornamento su una situazione già associata, scegliendo quale situazione aggiornare, data/ora e note.
- **Espandi** — alterna tra altezza compatta e altezza estesa della griglia.
- Barra di ricerca dedicata per filtrare nella griglia monitor.

Il pannello colonne (a destra della griglia) consente di mostrare/nascondere le colonne anche qui.

### 5.5 Servizi

La sezione **Servizi** è un accordion (collassato di default). Cliccando su *Servizi* nella barra si espande.

**Contenuto:**
- Pulsante **+ Aggiungi servizio** — apre una modale per selezionare un servizio dall'elenco e associarlo alla persona.
- Per ogni servizio già associato: un **badge blu** con il nome del servizio e il numero di aggiornamenti.

**Espandere un singolo servizio:** cliccare sul badge. Si apre una sezione con:
- Pulsante **+ Aggiungi aggiornamento** — registra un accesso/intervento per quel servizio.
- Pulsante **Disiscrivi dal servizio** — rimuove il servizio dalla persona (previa conferma).
- Lista degli aggiornamenti esistenti, ordinata dal più recente.

**Ogni aggiornamento** mostra: data con badge grigio, testo delle note, e due pulsanti:
- ✏️ — modifica data e/o note.
- 🗑️ — elimina l'aggiornamento.

**Aggiungere un aggiornamento:**
1. Cliccare **+ Aggiungi aggiornamento** sul servizio desiderato.
2. Nella modale: la data è precompilata con l'ora corrente (modificabile).
3. Scrivere le note nel campo testuale.
4. Cliccare **Salva**.

**Modificare un aggiornamento:**
1. Cliccare ✏️ sull'aggiornamento.
2. Nella modale: modificare data e/o note.
3. Cliccare **Salva**.

**Eliminare un aggiornamento:**
1. Cliccare 🗑️ sull'aggiornamento.
2. Confermare nel dialog di conferma del browser.

### 5.6 Bisogni

La sezione **Bisogni** funziona esattamente come quella dei Servizi. La differenza visiva è che i badge dei bisogni sono di colore azzurro/info e mostrano anche la categoria (es. *Sanitari – Accesso a cure mediche*).

**Interazioni disponibili:**
- **+ Aggiungi bisogno** — associa un bisogno dalla lista catalogata.
- Click sul badge del bisogno → espande la sezione aggiornamenti.
- **+ Aggiungi aggiornamento** — modale con data e note.
- ✏️ / 🗑️ su ogni aggiornamento per modificare o eliminare.
- **Disiscrivi dal bisogno** — rimuove il bisogno dalla persona.

### 5.7 Eliminare una Persona

In cima alla scheda, a destra del nome, c'è il pulsante **🗑️ Elimina scheda**.

Cliccandolo viene richiesta una conferma. Confermando, la persona viene eliminata definitivamente e si viene reindirizzati alla lista persone.

---

## 6. Servizi

### 6.1 Lista Servizi

La pagina **Servizi** (`/servizi`) mostra tutti i servizi come card. Ogni card riporta:
- Nome del servizio.
- Badge blu con il **numero di persone** che lo utilizzano.

I servizi sono ordinati con priorità: prima *Sportello*, poi *Guardaroba*, poi il resto in ordine alfabetico.

Cliccare su una card porta al dettaglio del servizio.

Il pulsante **📥 Esporta** (in alto a destra) esporta la lista servizi in CSV o JSONL.

### 6.2 Dettaglio Servizio

La pagina di dettaglio (`/servizio/<id>`) mostra:

- **Card informazioni**: nome, descrizione e numero di persone associate.
- **Sezione Persone** (accordion collassato): griglia AG Grid con tutte le persone che hanno quel servizio associato. Include la colonna *Num. aggiornamenti*. Cliccando su una riga si va alla scheda persona.
- **Sezione Aggiornamenti** (accordion collassato): griglia con tutti gli aggiornamenti registrati per quel servizio su qualsiasi persona, ordinati dal più recente.

Il pulsante **Torna ai servizi** riporta alla lista.

### 6.3 Creare un Nuovo Servizio

Nella lista servizi, l'ultima card ha bordo tratteggiato con il testo **+ Nuovo Servizio**. Cliccandola si apre una modale con:
- Campo **Nome** (codice interno, es. `nuovo_servizio`).
- Campo **Descrizione** (nome leggibile).
- Pulsante **Crea**.

---

## 7. Bisogni

### 7.1 Lista Bisogni

La pagina **Bisogni** (`/bisogni`) mostra i bisogni organizzati per **categoria** (Abitativi, Sanitari, Documentali, Economici, Legali, Lavorativi, Formativi, Psicosociali, Specifici).

Per ogni categoria viene mostrato il numero di persone che hanno almeno un bisogno di quella categoria attivo.

Il campo di **ricerca globale** in cima alla pagina filtra per nome categoria o nome bisogno.

### 7.2 Vista Lista e Vista Griglia

Due pulsanti in alto a destra permettono di alternare la visualizzazione:

- **Vista Lista** (icona ≡): ogni categoria è un blocco con l'elenco dei bisogni al suo interno.
- **Vista Griglia** (icona ⊞): i bisogni sono disposti come card compatte.

### 7.3 Dettaglio Categoria

Cliccando su una categoria si va alla pagina di dettaglio (`/categoria-bisogno/<categoria>`), che mostra:

- Il numero di bisogni in quella categoria.
- **Sezione Persone**: griglia con le persone che hanno almeno un bisogno della categoria, con il numero totale di aggiornamenti.
- **Sezione Aggiornamenti**: griglia con tutti gli aggiornamenti per tutti i bisogni della categoria, con colonna *Nome bisogno*.

### 7.4 Creare un Nuovo Bisogno

Nella lista bisogni è presente un pulsante o card **+ Nuovo Bisogno** che apre una modale con:
- Campo **Nome bisogno**.
- Campo **Categoria**.
- Campo **Descrizione**.
- Pulsante **Crea**.

---

## 8. Aggiornamenti

La pagina **Aggiornamenti** (`/aggiornamenti`) è una griglia globale che raccoglie **tutti** gli aggiornamenti di tutte le persone per tutti i servizi e bisogni.

**Colonne:**
- Pulsante **Apri** (colonna fissa a sinistra) — porta direttamente alla scheda persona con lo scroll posizionato sull'aggiornamento specifico.
- **Data** — formato gg/mm/aaaa hh:mm, ordinata per default dal più recente.
- **Cognome**, **Nome**.
- **Tipo** — `servizio` o `bisogno`.
- **Item** — nome del servizio o bisogno.
- **Note** — testo dell'aggiornamento.

**Funzionalità disponibili:**
- Ricerca testuale tramite il campo **Cerca...** in cima.
- Ordinamento e filtro per colonna.
- Il filtro data supporta filtri per intervallo di date (maggiore, minore, tra due date).

**Deep link:** il pulsante Apri porta alla pagina persona con la sezione corretta già espansa e l'aggiornamento evidenziato in giallo per qualche secondo.

---

## 9. Report

La pagina **Report** (`/report`) mostra visualizzazioni grafiche basate sui dati del database corrente.

**Grafici disponibili:**

| Grafico | Descrizione |
|---|---|
| Andamento Accessi nel Tempo | Serie temporale degli accessi registrati |
| Distribuzione per Genere | Ripartizione M/F/Altro |
| (altri grafici in sviluppo) | — |

Ogni grafico è in un accordion collassabile: cliccare sul titolo della card per aprire/chiudere.

Il pulsante **📥 Esporta** (in alto a destra) consente di esportare i dati sottostanti in CSV o JSONL.

---

## 10. Importazione Dati da Excel

La pagina **Importa Dati** (`/import`) permette di caricare dati da file Excel. È accessibile anche senza un database selezionato (utile per creare un nuovo database da zero).

> ⚠️ **Attenzione:** l'importazione sovrascrive i dati esistenti nel database indicato. Eseguire solo su database vuoti o come operazione iniziale.

### Formato dei file richiesti

Sono necessari **due file Excel**:

1. **File Sportello HR** — deve contenere il foglio `SPORTELLO HR ACCESSI` con le colonne standard (cognome, nome, data di nascita, servizi, ecc.).
2. **File Guardaroba** — deve contenere il foglio `ACCESSI` con le colonne standard.

### Procedura di importazione

**Passo 1 — Caricamento e anteprima:**

1. Nella sezione *Carica File Excel*, selezionare il file Sportello HR nel primo campo.
2. Selezionare il file Guardaroba nel secondo campo.
3. Nel campo **Nome Database** inserire il nome del database da creare (default: `gs`).
4. Cliccare **Carica e Mostra Anteprima**.
5. Attendere il caricamento (barra di progresso animata).

**Passo 2 — Verifica anteprima:**

Una volta elaborati i file, appare la sezione **Anteprima Dati Persone**:
- Viene mostrato il totale di persone trovate nei due file combinati.
- Vengono visualizzate fino alle prime **200 righe** in una griglia AG Grid.
- Controllare che i dati siano corretti (nomi, date, ecc.).

**Passo 3 — Conferma o annullamento:**

- Cliccare **✓ Conferma Importazione** per procedere all'importazione effettiva. Attende qualche secondo mentre scrive su MongoDB.
- Cliccare **✕ Annulla** per interrompere senza salvare nulla.

**Risultato:**

Dopo la conferma viene mostrato un riepilogo con i conteggi:
- Numero di servizi creati
- Numero di persone importate
- Numero di bisogni creati
- Numero di monitor creati

Il sistema crea automaticamente in MongoDB:
- Tutti i **servizi** predefiniti (15 servizi).
- Tutte le **persone** con i relativi servizi già associati (dedotti dai dati Excel).
- Il catalogo completo di **bisogni** (~100 voci in 9 categorie).
- Le 7 **situazioni di monitoraggio** predefinite.

Dopo l'importazione, selezionare il nuovo database dalla pagina di configurazione per iniziare a lavorarci.
