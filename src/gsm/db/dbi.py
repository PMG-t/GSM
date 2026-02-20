from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# DB general
_DB_NAME = os.getenv('DB_NAME', 'GSM-test-default')
_CONNECTION_STRING = os.getenv('CONNECTION_STRING', 'mongodb://localhost:27017/')

class DatabaseInterface():    
    
    def __init__(self):
        self.connection_string = _CONNECTION_STRING
        self.db_name = _DB_NAME
        
    def connect(self):
        self.client = MongoClient(self.connection_string)
        self.db = self.client[self.db_name]
        
    def set_db(self, db_name):
        self.db_name = db_name
        self.db = self.client[self.db_name]
        os.environ['DB_NAME'] = db_name
    
        
DBI = DatabaseInterface()
DBI.connect()