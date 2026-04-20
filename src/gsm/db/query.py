import json
import pandas as pd

from . import DBI


QUERY_NAMES_MAP = dict()
def q(func):
    """Decorator to register query functions."""
    QUERY_NAMES_MAP[func.__name__] = func
    return func


@q
def get(collection, filters=dict(), projection=dict()):
    """
    Returns all documents from the specified collection.
    """
    return list(DBI.db[collection].find(filters, projection))

@q
def persone(filters=dict(), projection=dict()):
    """
    Returns all documents from the 'persone' collection.
    """
    persone = list(DBI.db['persone'].find(filters, projection))
    df = pd.DataFrame(persone)
    df = df.where(pd.notnull(df), '')
    result = {
        'data': df.to_dict(orient='records',),
        'columns': list(df.columns),
    }
    return result

@q
def servizi(filters=dict(), projection=dict()):
    """
    Returns all documents from the 'servizi' collection.
    """
    servizi = list(DBI.db['servizi'].find(filters, projection))
    
    # Conta quante persone hanno ogni servizio
    persone = list(DBI.db['persone'].find())
    servizi_count = {}
    
    for persona in persone:
        if 'servizi' in persona:
            for servizio_id in persona['servizi'].keys():
                servizi_count[servizio_id] = servizi_count.get(servizio_id, 0) + 1
    
    # Aggiungi il conteggio a ogni servizio
    for servizio in servizi:
        servizio_id = str(servizio['_id'])
        servizio['num_persone'] = servizi_count.get(servizio_id, 0)
    
    df = pd.DataFrame(servizi)
    df = df.where(pd.notnull(df), '')
    result = {
        'data': df.to_dict(orient='records',),
        'columns': list(df.columns),
    }
    return result

@q
def bisogni(filters=dict(), projection=dict()):
    """
    Returns all documents from the 'bisogni' collection, with num_persone count.
    """
    bisogni = list(DBI.db['bisogni'].find(filters, projection))

    # Conta quante persone hanno ogni bisogno
    persone = list(DBI.db['persone'].find())
    bisogni_count = {}
    for persona in persone:
        if 'bisogni' in persona:
            for bisogno_id, aggiornamenti in persona['bisogni'].items():
                bisogni_count[bisogno_id] = bisogni_count.get(bisogno_id, 0) + 1

    for bisogno in bisogni:
        bisogno_id = str(bisogno['_id'])
        bisogno['num_persone'] = bisogni_count.get(bisogno_id, 0)

    df = pd.DataFrame(bisogni)
    df = df.where(pd.notnull(df), '')
    result = {
        'data': df.to_dict(orient='records',),
        'columns': list(df.columns),
    }
    return result

@q
def monitor(filters=dict(), projection=dict()):
    """
    Returns all documents from the 'monitor' collection.
    """
    monitor = list(DBI.db['monitor'].find(filters, projection))
    df = pd.DataFrame(monitor)
    df = df.where(pd.notnull(df), '')
    result = {
        'data': df.to_dict(orient='records',),
        'columns': list(df.columns),
    }
    return result

@q
def persona(persona_id):
    """
    Returns a single document from the 'persone' collection by ID.
    """
    from bson import ObjectId
    persona = DBI.db['persone'].find_one({'_id': ObjectId(persona_id)})
    if persona:
        persona['_id'] = str(persona['_id'])
    return persona

@q
def servizio(servizio_id):
    """
    Returns a single document from the 'servizi' collection by ID.
    """
    from bson import ObjectId
    servizio = DBI.db['servizi'].find_one({'_id': ObjectId(servizio_id)})
    if servizio:
        servizio['_id'] = str(servizio['_id'])
        
        # Conta quante persone hanno questo servizio
        persone = list(DBI.db['persone'].find())
        count = 0
        for persona in persone:
            if 'servizi' in persona and servizio_id in persona['servizi']:
                count += 1
        servizio['num_persone'] = count
    
    return servizio

@q
def bisogno(bisogno_id):
    """
    Returns a single document from the 'bisogni' collection by ID.
    """
    from bson import ObjectId
    bisogno = DBI.db['bisogni'].find_one({'_id': ObjectId(bisogno_id)})
    if bisogno:
        bisogno['_id'] = str(bisogno['_id'])
        
        # Conta quante persone hanno questo bisogni
        persone = list(DBI.db['persone'].find())
        count = 0
        for persona in persone:
            if 'bisogni' in persona and bisogno_id in persona['bisogni']:
                count += 1
        bisogno['num_persone'] = count
    
    return bisogno

@q
def persone_con_servizio(servizio_id):
    """
    Returns all persone that have a specific servizio.
    """
    persone = list(DBI.db['persone'].find())
    persone_con = []
    
    for persona in persone:
        if 'servizi' in persona and servizio_id in persona['servizi']:
            # Copia tutti i campi della persona tranne servizi e bisogni
            persona_data = {k: v for k, v in persona.items() if k not in ['servizi', 'bisogni']}
            persona_data['_id'] = str(persona_data['_id'])
            # Aggiungi il conteggio degli aggiornamenti
            persona_data['num_aggiornamenti'] = len(persona['servizi'][servizio_id])
            persone_con.append(persona_data)
            
    df_persone = pd.DataFrame(persone_con)
    df_persone = df_persone.where(pd.notnull(df_persone), '')
    persone_con = df_persone.to_dict(orient='records')
    
    return persone_con

@q
def persone_con_bisogno(bisogno_id):
    """
    Returns all persone that have a specific bisogno.
    """
    persone = list(DBI.db['persone'].find())
    persone_con = []
    
    for persona in persone:
        if 'bisogni' in persona and bisogno_id in persona['bisogni']:
            # Copia tutti i campi della persona tranne bisogni e bisogni
            persona_data = {k: v for k, v in persona.items() if k not in ['bisogni', 'bisogni']}
            persona_data['_id'] = str(persona_data['_id'])
            # Aggiungi il conteggio degli aggiornamenti
            persona_data['num_aggiornamenti'] = len(persona['bisogni'][bisogno_id])
            persone_con.append(persona_data)
            
    df_persone = pd.DataFrame(persone_con)
    df_persone = df_persone.where(pd.notnull(df_persone), '')
    persone_con = df_persone.to_dict(orient='records')
    
    return persone_con

@q
def aggiornamenti_servizio(servizio_id):
    """
    Returns all aggiornamenti for a specific servizio from all persone.
    """
    persone = list(DBI.db['persone'].find())
    aggiornamenti_list = []
    
    for persona in persone:
        if 'servizi' in persona and servizio_id in persona['servizi']:
            persona_id = str(persona['_id'])
            cognome = persona.get('cognome', '')
            nome = persona.get('nome', '')
            
            for agg in persona['servizi'][servizio_id]:
                aggiornamenti_list.append({
                    'persona_id': persona_id,
                    'cognome': cognome,
                    'nome': nome,
                    'data': agg['data'],
                    'note': agg.get('note', '')
                })
    
    # Ordina dal più recente al più vecchio
    aggiornamenti_list.sort(key=lambda x: x['data'], reverse=True)
    
    return aggiornamenti_list

@q
def aggiornamenti_bisogno(bisogno_id):
    """
    Returns all aggiornamenti for a specific bisogno from all persone.
    """
    persone = list(DBI.db['persone'].find())
    aggiornamenti_list = []
    
    for persona in persone:
        if 'bisogni' in persona and bisogno_id in persona['bisogni']:
            persona_id = str(persona['_id'])
            cognome = persona.get('cognome', '')
            nome = persona.get('nome', '')
            
            for agg in persona['bisogni'][bisogno_id]:
                aggiornamenti_list.append({
                    'persona_id': persona_id,
                    'cognome': cognome,
                    'nome': nome,
                    'data': agg['data'],
                    'note': agg.get('note', '')
                })
    
    # Ordina dal più recente al più vecchio
    aggiornamenti_list.sort(key=lambda x: x['data'], reverse=True)
    
    return aggiornamenti_list


@q
def add_aggiornamento(persona_id, tipo, item_id, note, data):
    """
    Adds an aggiornamento to a servizio, bisogno or monitor for a persona.
    """
    from bson import ObjectId
    from datetime import datetime
    
    # Determina il campo da aggiornare
    if tipo == 'servizio':
        field = 'servizi'
    elif tipo == 'bisogno':
        field = 'bisogni'
    elif tipo == 'monitor':
        field = 'monitor'
    else:
        return {'success': False, 'error': 'Invalid tipo'}
    
    # Crea l'oggetto aggiornamento con data naive
    data_dt = datetime.fromisoformat(data.replace('Z', '+00:00'))
    data_dt = data_dt.replace(tzinfo=None)  # Rimuovi timezone info
    
    aggiornamento = {
        'data': data_dt,
        'note': note
    }
    
    # Update: push aggiornamento nell'array del servizio/bisogno/monitor specifico
    result = DBI.db['persone'].update_one(
        {'_id': ObjectId(persona_id)},
        {'$push': {f'{field}.{item_id}': aggiornamento}}
    )
    
    return {
        'success': result.modified_count > 0,
        'modified_count': result.modified_count
    }

@q
def remove_aggiornamento(persona_id, tipo, item_id, data):
    """
    Removes an aggiornamento from a servizio, bisogno or monitor for a persona.
    """
    from bson import ObjectId
    from datetime import datetime
    
    # Determina il campo da aggiornare
    if tipo == 'servizio':
        field = 'servizi'
    elif tipo == 'bisogno':
        field = 'bisogni'
    elif tipo == 'monitor':
        field = 'monitor'
    else:
        return {'success': False, 'error': 'Invalid tipo'}
    
    # Converti la data in naive datetime
    data_dt = datetime.fromisoformat(data.replace('Z', '+00:00'))
    data_dt = data_dt.replace(tzinfo=None)
    
    # Remove: pull aggiornamento dall'array
    result = DBI.db['persone'].update_one(
        {'_id': ObjectId(persona_id)},
        {'$pull': {f'{field}.{item_id}': {'data': data_dt}}}
    )
    
    return {
        'success': result.modified_count > 0,
        'modified_count': result.modified_count
    }

@q
def update_aggiornamento(persona_id, tipo, item_id, old_data, new_data, new_note):
    """
    Updates an aggiornamento by replacing the entire array.
    This is more robust than pull+push as it's a single atomic operation.
    """
    from bson import ObjectId
    from datetime import datetime
    from email.utils import parsedate_to_datetime
    
    # Determina il campo da aggiornare
    if tipo == 'servizio':
        field = 'servizi'
    elif tipo == 'bisogno':
        field = 'bisogni'
    elif tipo == 'monitor':
        field = 'monitor'
    else:
        return {'success': False, 'error': 'Invalid tipo'}
    
    # Helper per convertire vari formati di data in naive datetime
    def parse_date(date_str):
        try:
            # Prova formato ISO
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt.replace(tzinfo=None)
        except:
            try:
                # Prova formato GMT/HTTP
                dt = parsedate_to_datetime(date_str)
                return dt.replace(tzinfo=None)
            except:
                raise ValueError(f"Invalid date format: {date_str}")
    
    # Converti le date in naive datetime
    old_data_dt = parse_date(old_data)
    new_data_dt = parse_date(new_data)
    
    # Leggi il documento persona
    persona = DBI.db['persone'].find_one({'_id': ObjectId(persona_id)})
    if not persona:
        return {'success': False, 'error': 'Persona not found'}
    
    # Ottieni l'array corrente
    if field not in persona or item_id not in persona[field]:
        return {'success': False, 'error': f'{field}.{item_id} not found'}
    
    current_array = persona[field][item_id]
    
    # Filtra per rimuovere l'elemento con la vecchia data
    filtered_array = [agg for agg in current_array if agg['data'] != old_data_dt]
    
    # Aggiungi il nuovo elemento
    filtered_array.append({
        'data': new_data_dt,
        'note': new_note
    })
    
    # Ordina per data (opzionale, ma utile)
    filtered_array.sort(key=lambda x: x['data'])
    
    # Riscrive l'array completo con $set
    result = DBI.db['persone'].update_one(
        {'_id': ObjectId(persona_id)},
        {'$set': {f'{field}.{item_id}': filtered_array}}
    )
    
    return {
        'success': result.modified_count > 0,
        'modified_count': result.modified_count
    }

@q
def add_servizio_to_persona(persona_id, servizio_id):
    """
    Adds a new servizio to a persona with empty array.
    """
    from bson import ObjectId
    
    result = DBI.db['persone'].update_one(
        {'_id': ObjectId(persona_id)},
        {'$set': {f'servizi.{servizio_id}': []}}
    )
    
    return {
        'success': result.modified_count > 0,
        'modified_count': result.modified_count
    }

@q
def add_bisogno_to_persona(persona_id, bisogno_id):
    """
    Adds a new bisogno to a persona with empty array.
    """
    from bson import ObjectId
    
    result = DBI.db['persone'].update_one(
        {'_id': ObjectId(persona_id)},
        {'$set': {f'bisogni.{bisogno_id}': []}}
    )
    
    return {
        'success': result.modified_count > 0,
        'modified_count': result.modified_count
    }

@q
def add_monitor_to_persona(persona_id, monitor_id):
    """
    Adds a new monitor to a persona with empty array.
    """
    from bson import ObjectId
    
    result = DBI.db['persone'].update_one(
        {'_id': ObjectId(persona_id)},
        {'$set': {f'monitor.{monitor_id}': []}},
        upsert=False
    )
    
    return {
        'success': result.modified_count > 0 or result.matched_count > 0,
        'modified_count': result.modified_count,
        'matched_count': result.matched_count
    }

@q
def create_monitor(nome_monitor, descrizione_monitor):
    """
    Creates a new monitor situation in the monitor collection.
    """
    new_monitor = {
        'nome_monitor': nome_monitor,
        'descrizione_monitor': descrizione_monitor
    }
    
    result = DBI.db['monitor'].insert_one(new_monitor)
    
    return {
        'success': result.inserted_id is not None,
        'monitor_id': str(result.inserted_id) if result.inserted_id else None
    }

@q
def create_servizio(nome_servizio, descrizione_servizio):
    """
    Creates a new servizio in the servizi collection.
    """
    new_servizio = {
        'nome_servizio': nome_servizio,
        'descrizione_servizio': descrizione_servizio
    }
    result = DBI.db['servizi'].insert_one(new_servizio)
    return {
        'success': result.inserted_id is not None,
        'servizio_id': str(result.inserted_id) if result.inserted_id else None
    }

@q
def create_bisogno(nome_bisogno, descrizione_bisogno):
    """
    Creates a new bisogno in the bisogni collection.
    """
    new_bisogno = {
        'nome_bisogno': nome_bisogno,
        'descrizione_bisogno': descrizione_bisogno
    }
    result = DBI.db['bisogni'].insert_one(new_bisogno)
    return {
        'success': result.inserted_id is not None,
        'bisogno_id': str(result.inserted_id) if result.inserted_id else None
    }

@q
def update_servizio(servizio_id, nome_servizio, descrizione_servizio):
    """
    Updates nome_servizio and descrizione_servizio for a given servizio.
    """
    from bson import ObjectId
    result = DBI.db['servizi'].update_one(
        {'_id': ObjectId(servizio_id)},
        {'$set': {'nome_servizio': nome_servizio, 'descrizione_servizio': descrizione_servizio}}
    )
    return {'success': result.modified_count > 0}

@q
def update_bisogno(bisogno_id, nome_bisogno, descrizione_bisogno):
    """
    Updates nome_bisogno and descrizione_bisogno for a given bisogno.
    """
    from bson import ObjectId
    result = DBI.db['bisogni'].update_one(
        {'_id': ObjectId(bisogno_id)},
        {'$set': {'nome_bisogno': nome_bisogno, 'descrizione_bisogno': descrizione_bisogno}}
    )
    return {'success': result.modified_count > 0}

@q
def delete_servizio(servizio_id):
    """
    Deletes a servizio and removes it from all persone that reference it.
    """
    from bson import ObjectId
    oid = ObjectId(servizio_id)
    sid_str = str(servizio_id)

    # Remove the key from every persona that has it
    persone = list(DBI.db['persone'].find({f'servizi.{sid_str}': {'$exists': True}}))
    for persona in persone:
        DBI.db['persone'].update_one(
            {'_id': persona['_id']},
            {'$unset': {f'servizi.{sid_str}': ''}}
        )

    result = DBI.db['servizi'].delete_one({'_id': oid})
    return {
        'success': result.deleted_count > 0,
        'persone_aggiornate': len(persone)
    }

@q
def delete_bisogno(bisogno_id):
    """
    Deletes a bisogno and removes it from all persone that reference it.
    """
    from bson import ObjectId
    oid = ObjectId(bisogno_id)
    sid_str = str(bisogno_id)

    # Remove the key from every persona that has it
    persone = list(DBI.db['persone'].find({f'bisogni.{sid_str}': {'$exists': True}}))
    for persona in persone:
        DBI.db['persone'].update_one(
            {'_id': persona['_id']},
            {'$unset': {f'bisogni.{sid_str}': ''}}
        )

    result = DBI.db['bisogni'].delete_one({'_id': oid})
    return {
        'success': result.deleted_count > 0,
        'persone_aggiornate': len(persone)
    }

@q
def create_persona(persona_data):
    """
    Creates a new persona document.
    """
    from datetime import datetime
    
    # Aggiungi data inserimento
    persona_data['data_inserimento'] = datetime.now()
    
    # Converti data_nascita da stringa a datetime se presente
    if persona_data.get('data_nascita'):
        persona_data['data_nascita'] = datetime.fromisoformat(persona_data['data_nascita'])
    
    # Inserisci nel database
    result = DBI.db['persone'].insert_one(persona_data)
    
    return {
        'success': result.inserted_id is not None,
        'persona_id': str(result.inserted_id)
    }

@q
def update_persona(persona_id, field_name, field_value):
    """
    Updates a single field of a persona document.
    """
    from bson import ObjectId
    from datetime import datetime
    
    # Converti data_nascita da stringa a datetime se è questo campo
    if field_name == 'data_nascita' and field_value:
        field_value = datetime.fromisoformat(field_value)
    
    # Se aggiorniamo data_nascita, ricalcola anche l'età
    update_data = {field_name: field_value}
    
    if field_name == 'data_nascita' and field_value:
        birth_date = field_value if isinstance(field_value, datetime) else datetime.fromisoformat(field_value)
        today = datetime.now()
        age = today.year - birth_date.year
        month_diff = today.month - birth_date.month
        if month_diff < 0 or (month_diff == 0 and today.day < birth_date.day):
            age -= 1
        update_data['eta'] = age
    
    # Aggiorna il documento
    result = DBI.db['persone'].update_one(
        {'_id': ObjectId(persona_id)},
        {'$set': update_data}
    )
    
    return {
        'success': result.modified_count > 0,
        'modified_count': result.modified_count
    }

@q
def get_unique_values(field_name):
    """
    Returns unique values for a specific field from persone collection.
    """
    # Get distinct values, excluding empty strings and None
    values = DBI.db['persone'].distinct(field_name)
    # Filter out empty and None values, and convert to list of strings
    unique_values = [str(v) for v in values if v and str(v).strip()]
    return sorted(set(unique_values))

@q
def tutti_aggiornamenti():
    """
    Returns all aggiornamenti from all persone, servizi and bisogni.
    """
    # Recupera tutte le persone
    persone = list(DBI.db['persone'].find())
    
    # Recupera servizi e bisogni per i nomi
    servizi_list = list(DBI.db['servizi'].find())
    servizi_map = {str(s['_id']): s.get('descrizione_servizio') or s.get('nome_servizio') for s in servizi_list}
    
    bisogni_list = list(DBI.db['bisogni'].find())
    bisogni_map = {str(b['_id']): b.get('nome_bisogno') or b.get('descrizione_bisogno') for b in bisogni_list}
    
    aggiornamenti_list = []
    
    for persona in persone:
        persona_id = str(persona['_id'])
        cognome = persona.get('cognome', '')
        nome = persona.get('nome', '')
        
        # Processa servizi
        if 'servizi' in persona:
            for servizio_id, aggs in persona['servizi'].items():
                servizio_nome = servizi_map.get(servizio_id, servizio_id)
                for agg in aggs:
                    aggiornamenti_list.append({
                        'persona_id': persona_id,
                        'cognome': cognome,
                        'nome': nome,
                        'tipo': 'servizio',
                        'item_id': servizio_id,
                        'item_nome': servizio_nome,
                        'data': agg['data'],
                        'note': agg.get('note', '')
                    })
        
        # Processa bisogni
        if 'bisogni' in persona:
            for bisogno_id, aggs in persona['bisogni'].items():
                bisogno_nome = bisogni_map.get(bisogno_id, bisogno_id)
                for agg in aggs:
                    aggiornamenti_list.append({
                        'persona_id': persona_id,
                        'cognome': cognome,
                        'nome': nome,
                        'tipo': 'bisogno',
                        'item_id': bisogno_id,
                        'item_nome': bisogno_nome,
                        # 'data': agg['data'],
                        'data': pd.to_datetime(agg['data']).isoformat(),
                        'note': agg.get('note', '')
                    })
    
    # Ordina dal più recente al più vecchio
    aggiornamenti_list.sort(key=lambda x: x['data'], reverse=True)
    
    # Converti in DataFrame
    df = pd.DataFrame(aggiornamenti_list)
    if df.empty:
        return {'data': [], 'columns': []}
    
    df = df.where(pd.notnull(df), '')
    return {
        'data': df.to_dict(orient='records'),
        'columns': list(df.columns)
    }

@q
def primi_accessi():
    """
    Returns the first (oldest) aggiornamento for each persona.
    """
    result = tutti_aggiornamenti()
    data = result.get('data', [])
    if not data:
        return result

    # Keep the oldest record per persona (data is already sorted desc)
    oldest = {}
    for record in data:
        pid = record['persona_id']
        if pid not in oldest or record['data'] < oldest[pid]['data']:
            oldest[pid] = record

    filtered = sorted(oldest.values(), key=lambda x: x['data'], reverse=True)
    return {
        'data': filtered,
        'columns': result.get('columns', [])
    }

@q
def delete_aggiornamento(persona_id, tipo, item_id, data):
    """
    Deletes an aggiornamento from a servizio or bisogno for a persona.
    """
    from bson import ObjectId
    from datetime import datetime
    
    # Determina il campo da aggiornare
    field = 'servizi' if tipo == 'servizio' else 'bisogni'
    
    # Converti la data da stringa a datetime naive (UTC)
    data_dt = datetime.fromisoformat(data.replace('Z', '+00:00'))
    # Rimuovi timezone info per renderla naive
    data_dt = data_dt.replace(tzinfo=None)
    
    # Recupera il documento
    persona = DBI.db['persone'].find_one({'_id': ObjectId(persona_id)})
    if not persona or field not in persona or item_id not in persona[field]:
        return {'success': False, 'modified_count': 0}
    
    # Recupera l'array degli aggiornamenti
    aggiornamenti = persona[field][item_id]
    
    # Filtra rimuovendo l'aggiornamento con la data corrispondente
    # Confronta le date con tolleranza di 1 secondo
    new_aggiornamenti = []
    found = False
    for agg in aggiornamenti:
        # Assicurati che anche la data dal DB sia naive
        agg_data = agg['data']
        if hasattr(agg_data, 'tzinfo') and agg_data.tzinfo is not None:
            agg_data = agg_data.replace(tzinfo=None)
        
        diff = abs((agg_data - data_dt).total_seconds())
        if diff < 1:  # Se la differenza è meno di 1 secondo
            found = True
            continue  # Skip questo aggiornamento
        new_aggiornamenti.append(agg)
    
    if not found:
        return {'success': False, 'modified_count': 0}
    
    # Aggiorna il documento con il nuovo array
    result = DBI.db['persone'].update_one(
        {'_id': ObjectId(persona_id)},
        {'$set': {f'{field}.{item_id}': new_aggiornamenti}}
    )
    
    return {
        'success': result.modified_count > 0,
        'modified_count': result.modified_count
    }

@q
def edit_aggiornamento(persona_id, tipo, item_id, old_data, new_note, new_data):
    """
    Edits an aggiornamento in a servizio or bisogno for a persona.
    Strategy: fetch array, modify in Python, update entire array
    """
    from bson import ObjectId
    from datetime import datetime
    
    # Determina il campo da aggiornare
    field = 'servizi' if tipo == 'servizio' else 'bisogni'
    
    # Converti le date a naive (senza timezone)
    old_data_dt = datetime.fromisoformat(old_data.replace('Z', '+00:00'))
    old_data_dt = old_data_dt.replace(tzinfo=None)
    
    new_data_dt = datetime.fromisoformat(new_data.replace('Z', '+00:00'))
    new_data_dt = new_data_dt.replace(tzinfo=None)
    
    # Recupera il documento
    persona = DBI.db['persone'].find_one({'_id': ObjectId(persona_id)})
    if not persona or field not in persona or item_id not in persona[field]:
        return {'success': False, 'modified_count': 0}
    
    # Recupera l'array degli aggiornamenti
    aggiornamenti = persona[field][item_id]
    
    # Trova e sostituisci l'aggiornamento con la data corrispondente
    # Confronta le date con tolleranza di 1 secondo
    found = False
    for agg in aggiornamenti:
        # Assicurati che anche la data dal DB sia naive
        agg_data = agg['data']
        if hasattr(agg_data, 'tzinfo') and agg_data.tzinfo is not None:
            agg_data = agg_data.replace(tzinfo=None)
        
        diff = abs((agg_data - old_data_dt).total_seconds())
        if diff < 1:  # Se la differenza è meno di 1 secondo
            agg['data'] = new_data_dt
            agg['note'] = new_note
            found = True
            break
    
    if not found:
        return {'success': False, 'modified_count': 0}
    
    # Aggiorna il documento con l'array modificato
    result = DBI.db['persone'].update_one(
        {'_id': ObjectId(persona_id)},
        {'$set': {f'{field}.{item_id}': aggiornamenti}}
    )
    
    return {
        'success': result.modified_count > 0,
        'modified_count': result.modified_count
    }

@q
def delete_persona(persona_id):
    """
    Deletes a persona document from the 'persone' collection.
    """
    from bson import ObjectId
    result = DBI.db['persone'].delete_one({'_id': ObjectId(persona_id)})
    return {
        'success': result.deleted_count > 0,
        'deleted_count': result.deleted_count
    }

@q
def remove_servizio_from_persona(persona_id, servizio_id):
    """
    Removes a servizio (and all its aggiornamenti) from a persona.
    """
    from bson import ObjectId
    result = DBI.db['persone'].update_one(
        {'_id': ObjectId(persona_id)},
        {'$unset': {f'servizi.{servizio_id}': ''}}
    )
    return {
        'success': result.modified_count > 0,
        'modified_count': result.modified_count
    }

@q
def remove_bisogno_from_persona(persona_id, bisogno_id):
    """
    Removes a bisogno (and all its aggiornamenti) from a persona.
    """
    from bson import ObjectId
    result = DBI.db['persone'].update_one(
        {'_id': ObjectId(persona_id)},
        {'$unset': {f'bisogni.{bisogno_id}': ''}}
    )
    return {
        'success': result.modified_count > 0,
        'modified_count': result.modified_count
    }

@q
def global_search_field_groups():
    """
    Returns field groups for global search:
      - top-level scalar fields of the persone collection
      - distinct names of servizi, bisogni, monitor
    """
    persona_doc = DBI.db['persone'].find_one()
    persona_fields = [k for k in persona_doc.keys() if k != '_id'] if persona_doc else []

    servizi_docs = list(DBI.db['servizi'].find({}, {'descrizione_servizio': 1, 'nome_servizio': 1}))
    servizi_names = sorted(
        {s.get('descrizione_servizio') or s.get('nome_servizio', '') for s in servizi_docs} - {''})

    bisogni_docs = list(DBI.db['bisogni'].find({}, {'nome_bisogno': 1}))
    bisogni_names = sorted(
        {b.get('nome_bisogno', '') for b in bisogni_docs} - {''})

    monitor_docs = list(DBI.db['monitor'].find({}, {'descrizione_monitor': 1, 'nome_monitor': 1}))
    monitor_names = sorted(
        {m.get('descrizione_monitor') or m.get('nome_monitor', '') for m in monitor_docs} - {''})

    return [
        {'id': 'persona', 'label': 'Campi persona', 'fields': persona_fields},
        {'id': 'servizi',  'label': 'Nomi servizi',  'fields': servizi_names},
        {'id': 'bisogni',  'label': 'Nomi bisogni',  'fields': bisogni_names},
        {'id': 'monitor',  'label': 'Nomi monitor',  'fields': monitor_names},
    ]


@q
def global_search(fields_by_group, terms):
    """
    Full-text global search across persona scalar fields and nested
    aggiornamenti notes in servizi, bisogni, monitor.

    fields_by_group: dict with optional keys 'persona', 'servizi', 'bisogni', 'monitor'
                     each mapping to a list of selected field/item names.
    terms: list of lowercase search strings (substring match, case-insensitive).
    """
    terms = [str(t).strip().lower() for t in terms if str(t).strip()]
    if not terms:
        return []

    def matches_any(value):
        if value is None:
            return False
        return any(t in str(value).lower() for t in terms)

    active_persona = fields_by_group.get('persona', [])
    active_servizi = fields_by_group.get('servizi', [])
    active_bisogni = fields_by_group.get('bisogni', [])
    active_monitor = fields_by_group.get('monitor', [])
    nothing_selected = not any([active_persona, active_servizi, active_bisogni, active_monitor])

    NESTED_KEYS = {'servizi', 'bisogni', 'monitor', '_id'}
    persone_all = list(DBI.db['persone'].find())
    results = []

    # ── Persona scalar fields ─────────────────────────────────────────────────
    if active_persona or nothing_selected:
        search_fields = (
            [f for f in active_persona if f not in NESTED_KEYS]
            if active_persona
            else [k for k in (persone_all[0].keys() if persone_all else []) if k not in NESTED_KEYS]
        )
        for persona in persone_all:
            for field in search_fields:
                val = persona.get(field)
                if matches_any(val):
                    results.append({
                        'tipo': 'persona',
                        'persona_id': str(persona['_id']),
                        'nome': persona.get('nome', ''),
                        'cognome': persona.get('cognome', ''),
                        'campo': field,
                        'valore': str(val),
                    })

    # ── Helper: search nested aggiornamenti ───────────────────────────────────
    def search_nested(group_key, collection_name, name_fields, persona_field, active_names):
        all_docs = list(DBI.db[collection_name].find())
        docs = (
            [d for d in all_docs
             if any(d.get(nf) == name for nf in name_fields for name in active_names)]
            if active_names else all_docs
        )
        for doc in docs:
            doc_id = str(doc['_id'])
            label = next((doc.get(nf) for nf in name_fields if doc.get(nf)), doc_id)
            for persona in persone_all:
                for agg in persona.get(persona_field, {}).get(doc_id, []):
                    note = agg.get('note', '') or ''
                    if matches_any(note):
                        results.append({
                            'tipo': group_key,
                            'nome_tipo': label,
                            'persona_id': str(persona['_id']),
                            'nome': persona.get('nome', ''),
                            'cognome': persona.get('cognome', ''),
                            'data': str(agg.get('data', '')),
                            'note': note,
                        })

    if active_servizi or nothing_selected:
        search_nested('servizi', 'servizi',
                      ['descrizione_servizio', 'nome_servizio'], 'servizi', active_servizi)
    if active_bisogni or nothing_selected:
        search_nested('bisogni', 'bisogni',
                      ['nome_bisogno'], 'bisogni', active_bisogni)
    if active_monitor or nothing_selected:
        search_nested('monitor', 'monitor',
                      ['descrizione_monitor', 'nome_monitor'], 'monitor', active_monitor)

    return results