import os
import pandas as pd

from ..dbi import DBI

from .loader import XLSXLoader

class DBStorer:
    
    def __init__(self):
        pass
    
    def _store_servizi(self):
        
        servizi_columns = [
            "sportello",
            "guardaroba",
            "kit_emergenza",
            "equipe_marginalita",
            "presa_in_carico_case_management",
            "assessment_orientamento",
            "orientamento_lavoro",
            "consulenza_amm_legale",
            "accompagnamento_residenza_fittizia",
            "accoglienza_notturna",
            "servizi_igiene_personale",
            "distribuzione_beni_essenziali",
            "servizi_mediazione_linguistico_culturale",
            "corsi_lingua_italiana",
            "front_office"
        ]
        
        data_servizi = [
            {
                'nome_servizio': sc,
                'descrizione_servizio': sc.replace('_', ' ').title()
            }   
            for sc in servizi_columns
        ]
        df_servizi = pd.DataFrame(data_servizi)
        
        # DBI.db: insert doc in collection 'servizi' and get back the inserted _id
        df_servizi['_id'] = DBI.db['servizi'].insert_many(data_servizi).inserted_ids
        df_servizi
        
        return df_servizi
    
    def _store_persone(self, df_persone):
        
        persone = df_persone.to_dict(orient='records')

        doc_servizi = list(DBI.db['servizi'].find())

        for persona in persone:
            
            servizi = {}
            for servizio in doc_servizi:
                if servizio['nome_servizio'] not in persona:
                    continue
                if persona[servizio['nome_servizio']] != '' and not pd.isnull(persona[servizio['nome_servizio']]):
                    servizi[str(servizio['_id'])] = []
                del persona[servizio['nome_servizio']]
                    
            bisogni = dict()
            
            persona['servizi'] = servizi
            persona['bisogni'] = bisogni
            
        # insert persone in collection 'persone'
        ids_persone = DBI.db['persone'].insert_many(persone).inserted_ids
        for persona, _id in zip(persone, ids_persone):
            persona['_id'] = _id
            
        df_persone = pd.DataFrame(persone)
        return df_persone
    
    def _store_bisogni(self):
        
        lista_bisogni = [
            # ------------------------ BISOGNI ABITATIVI ------------------------
            {"nome_bisogno": "Posto letto", "categoria_bisogno": "Abitativi", "descrizione_bisogno": "Richiesta di un posto per dormire temporaneo o in emergenza."},
            {"nome_bisogno": "Ospitalità per rinnovo permesso di soggiorno", "categoria_bisogno": "Abitativi", "descrizione_bisogno": "Richiesta di un luogo dove soggiornare durante il rinnovo del permesso."},
            {"nome_bisogno": "Richiesta ospitalità", "categoria_bisogno": "Abitativi", "descrizione_bisogno": "Domanda generica di ospitalità abitativa."},
            {"nome_bisogno": "Permanenza in albergo sociale", "categoria_bisogno": "Abitativi", "descrizione_bisogno": "Supporto per prolungare o attivare un posto in albergo sociale."},
            {"nome_bisogno": "Alloggio stabile", "categoria_bisogno": "Abitativi", "descrizione_bisogno": "Ricerca di una soluzione abitativa più duratura."},
            {"nome_bisogno": "Casa / abitazione", "categoria_bisogno": "Abitativi", "descrizione_bisogno": "Richiesta o mantenimento di una soluzione abitativa."},
            {"nome_bisogno": "Ricerca casa / alloggio", "categoria_bisogno": "Abitativi", "descrizione_bisogno": "Supporto nella ricerca di un alloggio adatto."},
            {"nome_bisogno": "Residenza", "categoria_bisogno": "Abitativi", "descrizione_bisogno": "Richiesta o aggiornamento della residenza ufficiale."},
            {"nome_bisogno": "Residenza fittizia / domicilio fittizio", "categoria_bisogno": "Abitativi", "descrizione_bisogno": "Necessità di ottenere una residenza fittizia per tutelare i diritti."},
            {"nome_bisogno": "Supporto per richiesta residenza", "categoria_bisogno": "Abitativi", "descrizione_bisogno": "Aiuto nella procedura per ottenere la residenza, anche fittizia."},
            {"nome_bisogno": "Casa non registrata → perdita residenza", "categoria_bisogno": "Abitativi", "descrizione_bisogno": "Situazione in cui la perdita della residenza deriva da casa irregolare."},
            {"nome_bisogno": "Ospitalità, domicilio, residenza fittizia", "categoria_bisogno": "Abitativi", "descrizione_bisogno": "Richiesta combinata di ospitalità o soluzioni domiciliari fittizie."},
            {"nome_bisogno": "Supporto post-sfratto", "categoria_bisogno": "Abitativi", "descrizione_bisogno": "Aiuto per affrontare le conseguenze di uno sfratto."},

            # ------------------------ BISOGNI SANITARI ------------------------
            {"nome_bisogno": "Accesso a cure mediche", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Richiesta generica di accesso a servizi sanitari."},
            {"nome_bisogno": "Supporto sanitario", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Aiuto con percorsi sanitari e presa in carico."},
            {"nome_bisogno": "Supporto sanitario per occhiali", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Aiuto nell'ottenimento di occhiali o visite oculistiche."},
            {"nome_bisogno": "Supporto sanitario + telefonino", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Supporto sanitario con necessità di contatto tramite telefono."},
            {"nome_bisogno": "Aggiornamento medico di base", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Richiesta di cambio o aggiornamento del medico di base."},
            {"nome_bisogno": "Modulo scelta medico", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Aiuto nella compilazione del modulo per la scelta del medico."},
            {"nome_bisogno": "Cambio medico / revoca medico", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Assistenza per cambiare o revocare il medico assegnato."},
            {"nome_bisogno": "Supporto fascicolo sanitario elettronico", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Aiuto per SPID e accesso al fascicolo sanitario online."},
            {"nome_bisogno": "Prenotazione visite mediche", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Supporto nella prenotazione di visite o esami."},
            {"nome_bisogno": "Farmaci / contributo farmaci", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Richiesta di farmaci o contributi economici per acquistarli."},
            {"nome_bisogno": "Richiesta esenzione ticket sanitario", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Domanda di esenzione dai costi del ticket sanitario."},
            {"nome_bisogno": "Cambio medico ed esenzione", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Assistenza con pratiche di cambio medico più esenzione."},
            {"nome_bisogno": "Follow-up sanitario", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Accompagnamento e monitoraggio dopo la presa in carico sanitaria."},
            {"nome_bisogno": "Informazioni sanitarie e burocratiche", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Chiarimenti su procedure sanitarie e documenti correlati."},
            {"nome_bisogno": "Raccordo con medico di base", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Aiuto nel collegamento con il medico di base."},
            {"nome_bisogno": "Primo accesso con raccordo di rete", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Supporto all’ingresso nei servizi sanitari con rete territoriale."},
            {"nome_bisogno": "Documenti sanitari", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Richiesta o gestione di documenti sanitari personali."},
            {"nome_bisogno": "Ambulanza", "categoria_bisogno": "Sanitari", "descrizione_bisogno": "Richiesta di intervento sanitario urgente tramite ambulanza."},

            # ------------------------ DOCUMENTALI E BUROCRATICI ------------------------
            {"nome_bisogno": "Supporto documenti", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Aiuto generico nella gestione di documenti personali."},
            {"nome_bisogno": "Aggiornamento / rinnovo documenti", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Assistenza nel rinnovo o aggiornamento di documenti ufficiali."},
            {"nome_bisogno": "Compilazione documenti per residenza", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Aiuto nella compilazione di moduli per la residenza."},
            {"nome_bisogno": "Firme documenti", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Supporto nella raccolta o gestione di firme per documenti."},
            {"nome_bisogno": "Pratiche documenti", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Supporto generico nelle pratiche documentali."},
            {"nome_bisogno": "Supporto burocratico", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Aiuto generale nella gestione di pratiche burocratiche."},
            {"nome_bisogno": "Supporto burocratico gestione documenti", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Aiuto specifico per organizzare e gestire documenti."},
            {"nome_bisogno": "Pratiche burocratiche ADI/lavoro/sanitarie", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Assistenza nella compilazione di pratiche specifiche."},
            {"nome_bisogno": "Aggiornamenti amministrativi", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Supporto con variazioni e aggiornamenti amministrativi."},
            {"nome_bisogno": "Supporto raccomandata", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Aiuto nell'invio o gestione di raccomandate."},
            {"nome_bisogno": "Denuncia documenti persi/furto", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Supporto nella denuncia per smarrimento o furto di documenti."},
            {"nome_bisogno": "Richiesta copia denunce", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Aiuto nell'ottenere copie di denunce presentate."},
            {"nome_bisogno": "Accesso pratiche burocratiche", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Richiesta di consultazione di pratiche amministrative."},
            {"nome_bisogno": "Consegna documenti esenzione sanitaria", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Supporto nella consegna della documentazione per esenzione."},
            {"nome_bisogno": "Pratiche burocratiche per ADI", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Aiuto specifico per le pratiche dell'Assegno di Inclusione."},
            {"nome_bisogno": "Orientamento per documenti", "categoria_bisogno": "Documentali", "descrizione_bisogno": "Informazioni su quali documenti servono e come ottenerli."},

            # ------------------------ BISOGNI ECONOMICI ------------------------
            {"nome_bisogno": "Supporto economico", "categoria_bisogno": "Economici", "descrizione_bisogno": "Richiesta di aiuto economico generico."},
            {"nome_bisogno": "Supporto assegno di inclusione", "categoria_bisogno": "Economici", "descrizione_bisogno": "Assistenza nella domanda o gestione dell'ADI."},
            {"nome_bisogno": "Sostegno economico per viaggio", "categoria_bisogno": "Economici", "descrizione_bisogno": "Richiesta fondi per biglietti o spese di spostamento."},
            {"nome_bisogno": "Supporto documentazione NASPI", "categoria_bisogno": "Economici", "descrizione_bisogno": "Aiuto nella preparazione della documentazione per NASPI."},
            {"nome_bisogno": "Supporto per sussidi", "categoria_bisogno": "Economici", "descrizione_bisogno": "Richiesta di accesso a contributi economici."},
            {"nome_bisogno": "Beni di prima necessità", "categoria_bisogno": "Economici", "descrizione_bisogno": "Richiesta di generi alimentari o materiali essenziali."},
            {"nome_bisogno": "Supporto multa + conto corrente", "categoria_bisogno": "Economici", "descrizione_bisogno": "Aiuto nella gestione di multe e pratiche bancarie correlate."},
            {"nome_bisogno": "Contributo per farmaci", "categoria_bisogno": "Economici", "descrizione_bisogno": "Richiesta di sostegno economico per acquistare farmaci."},

            # ------------------------ BISOGNI LEGALI ------------------------
            {"nome_bisogno": "Supporto legale", "categoria_bisogno": "Legali", "descrizione_bisogno": "Assistenza legale generica."},
            {"nome_bisogno": "Assistenza sfruttamento lavoro", "categoria_bisogno": "Legali", "descrizione_bisogno": "Supporto legale per casi di sfruttamento lavorativo."},
            {"nome_bisogno": "Pratiche divorzio", "categoria_bisogno": "Legali", "descrizione_bisogno": "Aiuto nelle procedure di separazione o divorzio."},
            {"nome_bisogno": "Supporto per violenza di genere", "categoria_bisogno": "Legali", "descrizione_bisogno": "Assistenza legale e di protezione in caso di violenza."},
            {"nome_bisogno": "Protezione per violenza", "categoria_bisogno": "Legali", "descrizione_bisogno": "Richiesta di protezione, anche durante gravidanza."},
            {"nome_bisogno": "Posto letto + violenza", "categoria_bisogno": "Legali", "descrizione_bisogno": "Ricerca di alloggio sicuro per persone vittime di violenza."},
            {"nome_bisogno": "Info su protezione internazionale", "categoria_bisogno": "Legali", "descrizione_bisogno": "Orientamento sulla richiesta di asilo o protezione."},
            {"nome_bisogno": "Confronto iter protezione", "categoria_bisogno": "Legali", "descrizione_bisogno": "Chiarimento sulle fasi della procedura di protezione."},
            {"nome_bisogno": "Orientamento SERD", "categoria_bisogno": "Legali", "descrizione_bisogno": "Indirizzamento ai servizi per dipendenze."},
            {"nome_bisogno": "Percorso CSM", "categoria_bisogno": "Legali", "descrizione_bisogno": "Orientamento verso i servizi di salute mentale territoriali."},
            {"nome_bisogno": "Assistenza sociale", "categoria_bisogno": "Legali", "descrizione_bisogno": "Presa in carico da parte di servizi sociali."},

            # ------------------------ BISOGNI LAVORATIVI ------------------------
            {"nome_bisogno": "Supporto ricerca lavoro", "categoria_bisogno": "Lavorativi", "descrizione_bisogno": "Aiuto nella ricerca di opportunità lavorative."},
            {"nome_bisogno": "Ricerca lavoro", "categoria_bisogno": "Lavorativi", "descrizione_bisogno": "Richiesta generica di sostegno occupazionale."},
            {"nome_bisogno": "Orientamento lavorativo", "categoria_bisogno": "Lavorativi", "descrizione_bisogno": "Indirizzamento e orientamento professionale."},
            {"nome_bisogno": "Orientamento tirocini", "categoria_bisogno": "Lavorativi", "descrizione_bisogno": "Supporto per avviare o trovare un tirocinio."},
            {"nome_bisogno": "Comunicazione avvio tirocinio", "categoria_bisogno": "Lavorativi", "descrizione_bisogno": "Assistenza nelle comunicazioni obbligatorie per i tirocini."},
            {"nome_bisogno": "Tutela lavorativa", "categoria_bisogno": "Lavorativi", "descrizione_bisogno": "Supporto su diritti e tutele sul posto di lavoro."},
            {"nome_bisogno": "ADI e tirocinio", "categoria_bisogno": "Lavorativi", "descrizione_bisogno": "Orientamento su legami tra ADI e percorsi di tirocinio."},
            {"nome_bisogno": "Pratiche burocratiche lavorative", "categoria_bisogno": "Lavorativi", "descrizione_bisogno": "Aiuto nelle pratiche amministrative legate al lavoro."},
            {"nome_bisogno": "Richiesta lavoro", "categoria_bisogno": "Lavorativi", "descrizione_bisogno": "Domanda esplicita di trovare un'occupazione."},

            # ------------------------ BISOGNI FORMATIVI ------------------------
            {"nome_bisogno": "Creazione curriculum", "categoria_bisogno": "Formativi", "descrizione_bisogno": "Aiuto per creare un CV da zero."},
            {"nome_bisogno": "Aggiornamento CV", "categoria_bisogno": "Formativi", "descrizione_bisogno": "Modifica e aggiornamento del proprio curriculum."},
            {"nome_bisogno": "Copie CV", "categoria_bisogno": "Formativi", "descrizione_bisogno": "Richiesta di stampe o copie del proprio CV."},
            {"nome_bisogno": "Supporto grafica CV", "categoria_bisogno": "Formativi", "descrizione_bisogno": "Assistenza nella formattazione grafica del curriculum."},
            {"nome_bisogno": "Traduzione CV", "categoria_bisogno": "Formativi", "descrizione_bisogno": "Aiuto nel tradurre il proprio curriculum."},
            {"nome_bisogno": "Orientamento ricerca lavoro", "categoria_bisogno": "Formativi", "descrizione_bisogno": "Consigli e supporto per la ricerca attiva di lavoro."},
            {"nome_bisogno": "Scuola di italiano", "categoria_bisogno": "Formativi", "descrizione_bisogno": "Accesso a corsi di lingua italiana."},
            {"nome_bisogno": "Creazione mail", "categoria_bisogno": "Formativi", "descrizione_bisogno": "Supporto nella creazione e gestione di email personali."},
            {"nome_bisogno": "Supporto corsi formativi", "categoria_bisogno": "Formativi", "descrizione_bisogno": "Orientamento verso corsi di formazione professionale."},

            # ------------------------ BISOGNI SOCIALI / PSICOLOGICI ------------------------
            {"nome_bisogno": "Sostegno psicologico", "categoria_bisogno": "Psicosociali", "descrizione_bisogno": "Richiesta di supporto psicologico o colloqui."},
            {"nome_bisogno": "Supporto emotivo", "categoria_bisogno": "Psicosociali", "descrizione_bisogno": "Spazio di ascolto e sostegno emotivo."},
            {"nome_bisogno": "Supporto per violenza domestica", "categoria_bisogno": "Psicosociali", "descrizione_bisogno": "Aiuto nell'affrontare situazioni di violenza in famiglia."},
            {"nome_bisogno": "Aggiornamento situazioni personali", "categoria_bisogno": "Psicosociali", "descrizione_bisogno": "Condivisione e valutazione di aggiornamenti personali."},
            {"nome_bisogno": "Supporto con servizi sociali", "categoria_bisogno": "Psicosociali", "descrizione_bisogno": "Aiuto nel collegamento con assistenti sociali."},
            {"nome_bisogno": "Orientamento sul territorio", "categoria_bisogno": "Psicosociali", "descrizione_bisogno": "Informazioni sui servizi territoriali disponibili."},
            {"nome_bisogno": "Informazioni sullo sportello", "categoria_bisogno": "Psicosociali", "descrizione_bisogno": "Chiarimenti sul funzionamento e le offerte dello sportello."},

            # ------------------------ BISOGNI SPECIFICI E VARI ------------------------
            {"nome_bisogno": "Apertura conto corrente", "categoria_bisogno": "Specifici", "descrizione_bisogno": "Aiuto per aprire un conto anche senza residenza."},
            {"nome_bisogno": "Verifica conto corrente", "categoria_bisogno": "Specifici", "descrizione_bisogno": "Supporto nel controllare lo stato del conto bancario."},
            {"nome_bisogno": "Supporto SIM / telefonino", "categoria_bisogno": "Specifici", "descrizione_bisogno": "Richiesta di aiuto con SIM, credito o telefono."},
            {"nome_bisogno": "Deposito bagagli", "categoria_bisogno": "Specifici", "descrizione_bisogno": "Richiesta di un luogo sicuro per depositare bagagli."},
            {"nome_bisogno": "Doccia", "categoria_bisogno": "Specifici", "descrizione_bisogno": "Accesso a servizi igienici per lavarsi."},
            {"nome_bisogno": "Assistenza alimentare", "categoria_bisogno": "Specifici", "descrizione_bisogno": "Richiesta di cibo o pacchi alimentari."},
            {"nome_bisogno": "Supporto con canile", "categoria_bisogno": "Specifici", "descrizione_bisogno": "Aiuto per la gestione di animali domestici tramite canile."},
            {"nome_bisogno": "Ricerca mezzo sequestrato", "categoria_bisogno": "Specifici", "descrizione_bisogno": "Aiuto nel ritrovare un mezzo sequestrato dalle autorità."},
            {"nome_bisogno": "Aggiornamento lavoro e posto letto", "categoria_bisogno": "Specifici", "descrizione_bisogno": "Verifica o aggiornamento sulla situazione lavorativa e abitativa."},
            {"nome_bisogno": "Accompagnamento", "categoria_bisogno": "Specifici", "descrizione_bisogno": "Richiesta di accompagnamento fisico a un servizio."},
            {"nome_bisogno": "Dichiarazione ospitalità", "categoria_bisogno": "Specifici", "descrizione_bisogno": "Info su come redigere o ottenere una dichiarazione di ospitalità."},
            {"nome_bisogno": "Supporto con sgombero", "categoria_bisogno": "Specifici", "descrizione_bisogno": "Aiuto legato a situazioni di sgombero abitativo."}
        ]
        
        df_bisogni = pd.DataFrame(lista_bisogni)
        
        df_bisogni['_id'] = DBI.db['bisogni'].insert_many(lista_bisogni).inserted_ids
        
        return df_bisogni
    
    def _store_monitor(self):
        
        monitor = [
            'situazione_familiare_relazionale',
            'situazione_lavorativa',
            'situazione_sanitaria',
            'situazione_documenti',
            'condizione_abitativa',
            'progettualità',
            'generale',
        ]
        
        df_monitor = pd.DataFrame({ 'nome_monitor': monitor })
        df_monitor['descrizione_monitor'] = df_monitor['nome_monitor'].str.replace('_', ' ').str.capitalize()
        
        data_monitor = df_monitor.to_dict(orient='records')
        df_monitor['_id'] = DBI.db['monitor'].insert_many(data_monitor).inserted_ids
        
        return df_monitor
    
    
    def new_db_from_xlsx_loader(self, xlsx_loader: XLSXLoader, db_name):
        DBI.set_db(db_name)
        
        if xlsx_loader.df_persone is None:
            xlsx_loader.load_persone()
        
        df_persone = xlsx_loader.df_persone
        
        df_servizi = self._store_servizi()
        df_persone = self._store_persone(df_persone)
        df_bisogni = self._store_bisogni()
        df_monitor = self._store_monitor()
        
        return df_servizi, df_persone, df_bisogni, df_monitor
        