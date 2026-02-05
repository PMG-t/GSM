import json
from flask import render_template, request, jsonify, current_app as app
from markupsafe import escape
from ..db import Q


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/persone')
def persone():
    return render_template('persone.html')

@app.route('/aggiornamenti')
def aggiornamenti():
    return render_template('aggiornamenti.html')

@app.route('/servizi')
def servizi():
    return render_template('servizi.html')

@app.route('/report')
def report():
    return render_template('report.html')

@app.route('/servizio/<servizio_id>')
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
def new_persona():
    return render_template('new-persona.html')

@app.route('/create-persona', methods=['POST'])
def create_persona():
    try:
        data = request.json
        result = Q.QUERY_NAMES_MAP['create_persona'](data)
        return jsonify(result)
    except Exception as e:
        print(f"Error creating persona: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/unique-values/<field_name>', methods=['GET'])
def unique_values(field_name):
    try:
        values = Q.QUERY_NAMES_MAP['get_unique_values'](field_name)
        return jsonify({'values': values})
    except Exception as e:
        print(f"Error fetching unique values: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/delete-aggiornamento', methods=['POST'])
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

@app.route('/q', methods=['POST'])
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