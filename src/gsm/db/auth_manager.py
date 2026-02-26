from .dbi import DBI
from passlib.hash import pbkdf2_sha256
import datetime


class AuthManager:
    
    @staticmethod
    def create_user(username, password, role='user'):
        """Crea un nuovo utente"""
        users = DBI.get_users_collection()
        
        # Verifica se l'utente esiste già
        if users.find_one({'username': username}):
            return {'success': False, 'error': 'Utente già esistente'}
        
        # Hash della password
        password_hash = pbkdf2_sha256.hash(password)
        
        # Crea il documento utente
        user_doc = {
            'username': username,
            'password_hash': password_hash,
            'role': role,
            'created_at': datetime.datetime.now(tz=datetime.timezone.utc)
        }
        
        users.insert_one(user_doc)
        return {'success': True, 'username': username}
    
    @staticmethod
    def validate_user(username, password):
        """Valida le credenziali di un utente"""
        users = DBI.get_users_collection()
        user = users.find_one({'username': username})
        
        if not user:
            return {'success': False, 'error': 'Utente non trovato'}
        
        # Verifica la password
        if pbkdf2_sha256.verify(password, user['password_hash']):
            return {
                'success': True,
                'username': user['username'],
                'role': user.get('role', 'user')
            }
        else:
            return {'success': False, 'error': 'Password errata'}
    
    @staticmethod
    def get_user(username):
        """Recupera i dati di un utente (senza password)"""
        users = DBI.get_users_collection()
        user = users.find_one({'username': username}, {'password_hash': 0})
        return user
    
    @staticmethod
    def update_password(username, new_password):
        """Aggiorna la password di un utente"""
        users = DBI.get_users_collection()
        
        # Hash della nuova password
        password_hash = pbkdf2_sha256.hash(new_password)
        
        result = users.update_one(
            {'username': username},
            {'$set': {'password_hash': password_hash}}
        )
        
        return {'success': result.modified_count > 0}
    
    @staticmethod
    def list_users():
        """Lista tutti gli utenti (senza password)"""
        users = DBI.get_users_collection()
        return list(users.find({}, {'password_hash': 0}))
    
    @staticmethod
    def delete_user(username):
        """Elimina un utente"""
        users = DBI.get_users_collection()
        result = users.delete_one({'username': username})
        return {'success': result.deleted_count > 0}
