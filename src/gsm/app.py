from flask import Flask
from flask_cors import CORS
from datetime import timedelta
from .db import DBI


def create_app():
    app = Flask(
        __name__, 
        static_folder="frontend/static",
        template_folder="frontend/templates"
    )
    
    # Configurazione per sessioni (necessarie per l'importazione in due fasi e autenticazione)
    app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)  # Sessione dura 7 giorni
    
    CORS(app)
    
    mongo_client = DBI.client
    app.db = DBI.db

    with app.app_context():
        from .backend import routes
    
    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
