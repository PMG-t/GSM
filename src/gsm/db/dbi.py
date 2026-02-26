from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# DB connection string from env, db_name as runtime state variable
_CONNECTION_STRING = os.getenv('CONNECTION_STRING', 'mongodb://localhost:27017/')

class DatabaseInterface():    
    
    def __init__(self):
        self.connection_string = _CONNECTION_STRING
        self.db_name = None  # Must be set explicitly at runtime
        self.db = None
        self.auth_db = None  # Database dedicato per le utenze
        
    def connect(self):
        self.client = MongoClient(self.connection_string)
        if self.db_name:
            self.db = self.client[self.db_name]
        # Inizializza il database delle utenze
        self.auth_db = self.client['utent3db']
        
    def set_db(self, db_name):
        """Change the active database at runtime"""
        self.db_name = db_name
        self.db = self.client[self.db_name]
    
    def get_db_name(self):
        """Get the current database name"""
        return self.db_name
    
    def is_db_selected(self):
        """Check if a database has been selected"""
        return self.db_name is not None and self.db is not None
    
    def list_databases(self):
        """List all available databases"""
        return [db['name'] for db in self.client.list_databases() if db['name'] not in ['admin', 'local', 'config', 'utent3db']]
    
    def get_users_collection(self):
        """Ritorna la collection users dal database di autenticazione"""
        return self.auth_db['users']
    
        
DBI = DatabaseInterface()
DBI.connect()