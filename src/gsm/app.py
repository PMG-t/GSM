from flask import Flask
from flask_cors import CORS
from .db import DBI


def create_app():
    app = Flask(
        __name__, 
        static_folder="frontend/static",
        template_folder="frontend/templates"
    )
    
    CORS(app)
    
    mongo_client = DBI.client
    app.db = DBI.db

    with app.app_context():
        from .backend import routes
    
    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
