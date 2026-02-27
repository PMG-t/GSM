import json
import uuid
from functools import wraps
from flask import render_template, request, jsonify, current_app as app, session, redirect, url_for
from markupsafe import escape
from ..db import Q
from ..db import DBI
from ..db.auth_manager import AuthManager


def require_db(f):
    """Decorator to ensure a database is selected before accessing a route"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not DBI.is_db_selected():
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function


# ==================== DB Selection API ====================

@app.route('/api/current-db')
def api_current_db():
    """Get the currently selected database"""
    db_name = DBI.get_db_name()
    return jsonify({
        'success': True,
        'db_name': db_name,
        'is_selected': DBI.is_db_selected()
    })


@app.route('/api/list-databases')
def api_list_databases():
    """List all available databases"""
    try:
        databases = DBI.list_databases()
        return jsonify({
            'success': True,
            'databases': databases
        })
    except Exception as e:
        print(f"Error listing databases: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/select-db', methods=['POST'])
def api_select_db():
    """Select a database to work with"""
    try:
        data = request.json
        db_name = data.get('db_name')
        
        if not db_name:
            return jsonify({
                'success': False,
                'error': 'Nome database mancante'
            }), 400
        
        # Imposta il database
        DBI.set_db(db_name)
        
        return jsonify({
            'success': True,
            'db_name': db_name,
            'message': f'Database "{db_name}" selezionato con successo'
        })
        
    except Exception as e:
        print(f"Error selecting database: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==================== Authentication API ====================

@app.route('/api/current-user')
def api_current_user():
    """Get the currently logged in user"""
    username = session.get('username')
    return jsonify({
        'success': True,
        'username': username,
        'is_authenticated': username is not None
    })


@app.route('/api/login', methods=['POST'])
def api_login():
    """Login user"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'error': 'Username e password richiesti'
            }), 400
        
        # Valida le credenziali usando AuthManager
        result = AuthManager.validate_user(username, password)
        
        if not result['success']:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 401
        
        # Salva username e ruolo in sessione
        session['username'] = username
        session['role'] = result.get('role', 'user')
        session.permanent = True
        
        return jsonify({
            'success': True,
            'username': username,
            'role': result.get('role', 'user'),
            'message': 'Login effettuato con successo'
        })
        
    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/logout', methods=['POST'])
def api_logout():
    """Logout user"""
    try:
        username = session.get('username')
        session.pop('username', None)
        
        return jsonify({
            'success': True,
            'message': f'Logout effettuato per {username}'
        })
        
    except Exception as e:
        print(f"Error during logout: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==================== Main Routes ====================

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/persone')
@require_db
def persone():
    return render_template('persone.html')

@app.route('/aggiornamenti')
@require_db
def aggiornamenti():
    return render_template('aggiornamenti.html')

@app.route('/servizi')
@require_db
def servizi():
    return render_template('servizi.html')

@app.route('/bisogni')
@require_db
def bisogni():
    return render_template('bisogni.html')

@app.route('/categoria-bisogno/<categoria>')
@require_db
def categoria_bisogno(categoria):
    return render_template('categoria-bisogno.html', categoria=categoria)

@app.route('/dati_categoria_bisogno', methods=['POST'])
@require_db
def dati_categoria_bisogno():
    try:
        data = request.json
        categoria = data.get('categoria')
        
        if not categoria:
            return jsonify({'error': 'Missing categoria'}), 400
        
        persone = Q.QUERY_NAMES_MAP['persone_con_bisogno_categoria'](categoria)
        aggiornamenti = Q.QUERY_NAMES_MAP['aggiornamenti_categoria_bisogno'](categoria)
        
        # Conta i bisogni nella categoria
        bisogni_result = Q.QUERY_NAMES_MAP['bisogni']()
        num_bisogni = len([b for b in bisogni_result['data'] if b.get('categoria_bisogno') == categoria])
        
        return jsonify({
            'persone': persone,
            'aggiornamenti': aggiornamenti,
            'num_bisogni': num_bisogni
        })
    except Exception as e:
        print(f"Error fetching dati categoria bisogno: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/report')
@require_db
def report():
    return render_template('report.html')


@app.route('/servizio/<servizio_id>')
@require_db
def servizio(servizio_id):
    try:
        servizio_data = Q.QUERY_NAMES_MAP['servizio'](servizio_id)
        if not servizio_data:
            return "Servizio non trovato", 404
        return render_template('servizio.html', servizio=servizio_data)
    except Exception as e:
        print(f"Error fetching servizio: {e}")
        return str(e), 500

@app.route('/dati_servizio', methods=['POST'])
@require_db
def dati_servizio():
    try:
        data = request.json
        servizio_id = data.get('servizio_id')
        
        if not servizio_id:
            return jsonify({'error': 'Missing servizio_id'}), 400
        
        persone = Q.QUERY_NAMES_MAP['persone_con_servizio'](servizio_id)
        aggiornamenti = Q.QUERY_NAMES_MAP['aggiornamenti_servizio'](servizio_id)
        
        return jsonify({
            'persone': persone,
            'aggiornamenti': aggiornamenti
        })
    except Exception as e:
        print(f"Error fetching dati servizio: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/new-persona')
@require_db
def new_persona():
    return render_template('new-persona.html')

@app.route('/create-persona', methods=['POST'])
@require_db
def create_persona():
    try:
        data = request.json
        result = Q.QUERY_NAMES_MAP['create_persona'](data)
        return jsonify(result)
    except Exception as e:
        print(f"Error creating persona: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/update-persona', methods=['POST'])
@require_db
def update_persona():
    try:
        data = request.json
        persona_id = data.get('persona_id')
        field_name = data.get('field_name')
        field_value = data.get('field_value')
        
        if not all([persona_id, field_name]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        result = Q.QUERY_NAMES_MAP['update_persona'](persona_id, field_name, field_value)
        return jsonify(result)
    except Exception as e:
        print(f"Error updating persona: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/unique-values/<field_name>', methods=['GET'])
@require_db
def unique_values(field_name):
    try:
        values = Q.QUERY_NAMES_MAP['get_unique_values'](field_name)
        return jsonify({'values': values})
    except Exception as e:
        print(f"Error fetching unique values: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/delete-aggiornamento', methods=['POST'])
@require_db
def delete_aggiornamento():
    try:
        data = request.json
        persona_id = data.get('persona_id')
        tipo = data.get('tipo')
        item_id = data.get('item_id')
        data_agg = data.get('data')
        
        if not all([persona_id, tipo, item_id, data_agg]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        result = Q.QUERY_NAMES_MAP['delete_aggiornamento'](
            persona_id=persona_id,
            tipo=tipo,
            item_id=item_id,
            data=data_agg
        )
        
        return jsonify(result)
    except Exception as e:
        print(f"Error deleting aggiornamento: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/edit-aggiornamento', methods=['POST'])
@require_db
def edit_aggiornamento():
    try:
        data = request.json
        persona_id = data.get('persona_id')
        tipo = data.get('tipo')
        item_id = data.get('item_id')
        old_data = data.get('old_data')
        new_note = data.get('new_note')
        new_data = data.get('new_data')
        
        if not all([persona_id, tipo, item_id, old_data, new_data]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        result = Q.QUERY_NAMES_MAP['edit_aggiornamento'](
            persona_id=persona_id,
            tipo=tipo,
            item_id=item_id,
            old_data=old_data,
            new_note=new_note or '',
            new_data=new_data
        )
        
        return jsonify(result)
    except Exception as e:
        print(f"Error editing aggiornamento: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/persona/<persona_id>')
@require_db
def persona(persona_id):
    try:
        persona_data = Q.QUERY_NAMES_MAP['persona'](persona_id)
        if not persona_data:
            return "Persona non trovata", 404
        return render_template('persona.html', persona=persona_data)
    except Exception as e:
        print(f"Error fetching persona: {e}")
        return str(e), 500

@app.route('/add-aggiornamento', methods=['POST'])
@require_db
def add_aggiornamento():
    try:
        data = request.json
        persona_id = data.get('persona_id')
        tipo = data.get('tipo')
        item_id = data.get('item_id')
        note = data.get('note')
        data_agg = data.get('data')
        
        if not all([persona_id, tipo, item_id, data_agg]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        result = Q.QUERY_NAMES_MAP['add_aggiornamento'](
            persona_id=persona_id,
            tipo=tipo,
            item_id=item_id,
            note=note or '',
            data=data_agg
        )
        
        return jsonify(result)
    except Exception as e:
        print(f"Error adding aggiornamento: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/add-servizio', methods=['POST'])
@require_db
def add_servizio():
    try:
        data = request.json
        persona_id = data.get('persona_id')
        item_id = data.get('item_id')
        
        if not all([persona_id, item_id]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        result = Q.QUERY_NAMES_MAP['add_servizio_to_persona'](
            persona_id=persona_id,
            servizio_id=item_id
        )
        
        return jsonify(result)
    except Exception as e:
        print(f"Error adding servizio: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/add-bisogno', methods=['POST'])
@require_db
def add_bisogno():
    try:
        data = request.json
        persona_id = data.get('persona_id')
        item_id = data.get('item_id')
        
        if not all([persona_id, item_id]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        result = Q.QUERY_NAMES_MAP['add_bisogno_to_persona'](
            persona_id=persona_id,
            bisogno_id=item_id
        )
        
        return jsonify(result)
    except Exception as e:
        print(f"Error adding bisogno: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/add-monitor', methods=['POST'])
@require_db
def add_monitor():
    try:
        data = request.json
        persona_id = data.get('persona_id')
        item_id = data.get('item_id')
        
        if not all([persona_id, item_id]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        result = Q.QUERY_NAMES_MAP['add_monitor_to_persona'](
            persona_id=persona_id,
            monitor_id=item_id
        )
        
        return jsonify(result)
    except Exception as e:
        print(f"Error adding monitor: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/create-monitor', methods=['POST'])
@require_db
def create_monitor():
    try:
        data = request.json
        nome_monitor = data.get('nome_monitor')
        descrizione_monitor = data.get('descrizione_monitor')
        
        if not all([nome_monitor, descrizione_monitor]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        result = Q.QUERY_NAMES_MAP['create_monitor'](
            nome_monitor=nome_monitor,
            descrizione_monitor=descrizione_monitor
        )
        
        return jsonify(result)
    except Exception as e:
        print(f"Error creating monitor: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/remove-aggiornamento', methods=['POST'])
@require_db
def remove_aggiornamento():
    try:
        data = request.json
        persona_id = data.get('persona_id')
        tipo = data.get('tipo')
        item_id = data.get('item_id')
        data_agg = data.get('data')
        
        if not all([persona_id, tipo, item_id, data_agg]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        result = Q.QUERY_NAMES_MAP['remove_aggiornamento'](
            persona_id=persona_id,
            tipo=tipo,
            item_id=item_id,
            data=data_agg
        )
        
        return jsonify(result)
    except Exception as e:
        print(f"Error removing aggiornamento: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/update-aggiornamento', methods=['POST'])
@require_db
def update_aggiornamento():
    try:
        data = request.json
        persona_id = data.get('persona_id')
        tipo = data.get('tipo')
        item_id = data.get('item_id')
        old_data = data.get('old_data')
        new_data = data.get('new_data')
        new_note = data.get('new_note')
        
        if not all([persona_id, tipo, item_id, old_data, new_data]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        result = Q.QUERY_NAMES_MAP['update_aggiornamento'](
            persona_id=persona_id,
            tipo=tipo,
            item_id=item_id,
            old_data=old_data,
            new_data=new_data,
            new_note=new_note or ''
        )
        
        return jsonify(result)
    except Exception as e:
        print(f"Error updating aggiornamento: {e}")
        return jsonify({'error': str(e)}), 500
    

@app.route('/import')
def import_page():
    """Pagina di import - accessibile anche senza DB per creare nuovi database"""
    return render_template('import.html')


@app.route('/preview-excel', methods=['POST'])
def preview_excel():
    """
    Carica i file Excel e genera un'anteprima dei dati persone.
    Salva i file temporaneamente e ritorna i primi 200 record.
    Accessibile anche senza DB per creare nuovi database.
    """
    import os
    import tempfile
    from werkzeug.utils import secure_filename
    from ..db.migrator.loader import XLSXLoader
    
    try:
        # Verifica che i file siano stati caricati
        if 'sportello_file' not in request.files or 'guardaroba_file' not in request.files:
            return jsonify({'success': False, 'error': 'File mancanti'}), 400
        
        sportello_file = request.files['sportello_file']
        guardaroba_file = request.files['guardaroba_file']
        db_name = request.form.get('db_name', 'gs')
        
        if sportello_file.filename == '' or guardaroba_file.filename == '':
            return jsonify({'success': False, 'error': 'Nessun file selezionato'}), 400
        
        # Crea directory temporanea
        temp_dir = tempfile.mkdtemp()
        
        # Salva i file temporaneamente
        sportello_path = os.path.join(temp_dir, secure_filename(sportello_file.filename))
        guardaroba_path = os.path.join(temp_dir, secure_filename(guardaroba_file.filename))
        
        sportello_file.save(sportello_path)
        guardaroba_file.save(guardaroba_path)
        
        # Crea loader e carica i dati persone
        loader = XLSXLoader(sportello_path, guardaroba_path)
        df_persone = loader.load_persone()
        
        # Genera session ID per tracciare i file temporanei
        session_id = str(uuid.uuid4())
        
        # Salva i percorsi dei file e il db_name in sessione
        session[session_id] = {
            'sportello_path': sportello_path,
            'guardaroba_path': guardaroba_path,
            'db_name': db_name,
            'temp_dir': temp_dir
        }
        
        # Converti il DataFrame in dict per JSON (max 200 righe)
        preview_data = df_persone.head(200).fillna('').to_dict('records')
        total_rows = len(df_persone)
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'preview_data': preview_data,
            'total_rows': total_rows
        })
        
    except Exception as e:
        print(f"Error previewing Excel: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/confirm-import', methods=['POST'])
def confirm_import():
    """
    Conferma l'importazione e scrive i dati nel database.
    Imposta il database se non già selezionato.
    """
    import os
    from ..db.migrator.loader import XLSXLoader
    from ..db.migrator.storer import DBStorer
    
    try:
        data = request.json
        session_id = data.get('session_id')
        
        if not session_id or session_id not in session:
            return jsonify({'success': False, 'error': 'Sessione non valida o scaduta'}), 400
        
        # Recupera i dati dalla sessione
        session_data = session[session_id]
        sportello_path = session_data['sportello_path']
        guardaroba_path = session_data['guardaroba_path']
        db_name = session_data['db_name']
        temp_dir = session_data['temp_dir']
        
        # Crea loader e storer
        loader = XLSXLoader(sportello_path, guardaroba_path)
        storer = DBStorer()
        
        # Esegui l'importazione
        df_servizi, df_persone, df_bisogni, df_monitor = storer.new_db_from_xlsx_loader(loader, db_name)
        
        # Pulisci i file temporanei
        try:
            os.remove(sportello_path)
            os.remove(guardaroba_path)
            os.rmdir(temp_dir)
        except Exception as cleanup_error:
            print(f"Warning: cleanup error: {cleanup_error}")
        
        # Rimuovi dalla sessione
        session.pop(session_id, None)
        
        return jsonify({
            'success': True,
            'num_servizi': len(df_servizi),
            'num_persone': len(df_persone),
            'num_bisogni': len(df_bisogni),
            'num_monitor': len(df_monitor)
        })
        
    except Exception as e:
        print(f"Error confirming import: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/cancel-import', methods=['POST'])
def cancel_import():
    """
    Annulla l'importazione e pulisce i file temporanei.
    """
    import os
    
    try:
        data = request.json
        session_id = data.get('session_id')
        
        if not session_id or session_id not in session:
            return jsonify({'success': True, 'message': 'Nessuna sessione da annullare'})
        
        # Recupera i dati dalla sessione
        session_data = session[session_id]
        sportello_path = session_data['sportello_path']
        guardaroba_path = session_data['guardaroba_path']
        temp_dir = session_data['temp_dir']
        
        # Pulisci i file temporanei
        try:
            if os.path.exists(sportello_path):
                os.remove(sportello_path)
            if os.path.exists(guardaroba_path):
                os.remove(guardaroba_path)
            if os.path.exists(temp_dir):
                os.rmdir(temp_dir)
        except Exception as cleanup_error:
            print(f"Warning: cleanup error: {cleanup_error}")
        
        # Rimuovi dalla sessione
        session.pop(session_id, None)
        
        return jsonify({'success': True, 'message': 'Import annullato'})
        
    except Exception as e:
        print(f"Error cancelling import: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/import-excel', methods=['POST'])
@require_db
def import_excel():
    """
    Importazione diretta senza anteprima (mantenuto per compatibilità).
    """
    import os
    import tempfile
    from werkzeug.utils import secure_filename
    from ..db.migrator.loader import XLSXLoader
    from ..db.migrator.storer import DBStorer
    
    try:
        # Verifica che i file siano stati caricati
        if 'sportello_file' not in request.files or 'guardaroba_file' not in request.files:
            return jsonify({'success': False, 'error': 'File mancanti'}), 400
        
        sportello_file = request.files['sportello_file']
        guardaroba_file = request.files['guardaroba_file']
        db_name = request.form.get('db_name', 'gs')
        
        if sportello_file.filename == '' or guardaroba_file.filename == '':
            return jsonify({'success': False, 'error': 'Nessun file selezionato'}), 400
        
        # Crea directory temporanea
        temp_dir = tempfile.mkdtemp()
        
        # Salva i file temporaneamente
        sportello_path = os.path.join(temp_dir, secure_filename(sportello_file.filename))
        guardaroba_path = os.path.join(temp_dir, secure_filename(guardaroba_file.filename))
        
        sportello_file.save(sportello_path)
        guardaroba_file.save(guardaroba_path)
        
        # Crea loader e storer
        loader = XLSXLoader(sportello_path, guardaroba_path)
        storer = DBStorer()
        
        # Esegui l'importazione
        df_servizi, df_persone, df_bisogni, df_monitor = storer.new_db_from_xlsx_loader(loader, db_name)
        
        # Pulisci i file temporanei
        os.remove(sportello_path)
        os.remove(guardaroba_path)
        os.rmdir(temp_dir)
        
        return jsonify({
            'success': True,
            'num_servizi': len(df_servizi),
            'num_persone': len(df_persone),
            'num_bisogni': len(df_bisogni),
            'num_monitor': len(df_monitor)
        })
        
    except Exception as e:
        print(f"Error importing Excel: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/q', methods=['POST'])
@require_db
def q():
    
    query = request.json.get('query')
    kwargs = request.json.get('kwargs', {})
    
    if not query:
        return jsonify({'error': 'No query provided'}), 400
    if query not in Q.QUERY_NAMES_MAP:
        return jsonify({'error': f'Query "{query}" not found'}), 404
    
    query_func = Q.QUERY_NAMES_MAP[query]

    try:
        result = query_func(**kwargs)
        result = json.loads(json.dumps(result, default=str))  # Convert ObjectId and other non-serializable types to string
    except Exception as e:
        print(f"Error executing query '{query}': {e}")
        return jsonify({'error': str(e)}), 500
    
    return jsonify(result)