import json
import os
from asyncio.locks import Semaphore

from config import FILES_DIRECTORY, USERS_FILE


def semaphore_wrapper(method):

    def wrapper(db, *args, **kwargs):
        db.semaphore.acquire()
        result = method(db, *args, **kwargs)
        db.semaphore.release()
        return result

    return wrapper


class Database:
    def __init__(self):
        self.semaphore = Semaphore()

    def _get_users(self):
        with open(USERS_FILE) as f:
            users = json.loads(f.read())
        return users

    def _save_users(self, users):
        with open(USERS_FILE, 'w') as f:
            f.write(json.dumps(users, ensure_ascii=False))

    @semaphore_wrapper
    def login(self, username, password):
        users = self._get_users()
        return username in users and users[username]['password'] == password

    @semaphore_wrapper
    def register(self, username, password):
        valid = False
        users = self._get_users()

        if username not in users:
            obj = {
                'password': password,
                'files': []
            }
            users[username] = obj
            valid = True
            self._save_users(users)

        return valid

    @semaphore_wrapper
    def get_files(self, username=None, only_keys=False):
        users = self._get_users()

        if username is not None:
            all_files = [f['key'] if only_keys else f for f in users[username]['files']]
        else:
            all_files = [f['key'] if only_keys else f for user in users.values() for f in user['files']]
        return all_files

    @semaphore_wrapper
    def download_file(self, code):
        with open(os.path.join(FILES_DIRECTORY, code), 'rb') as f:
            res = f.read().decode()
        return res

    @semaphore_wrapper
    def upload_file(self, username, file_name, file_content, code):
        users = self._get_users()

        with open(os.path.join(FILES_DIRECTORY, code), 'wb') as f:
            f.write(file_content.encode())

        users[username]['files'].append({'name': file_name, 'key': code})
        self._save_users(users)
