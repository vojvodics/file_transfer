import string
from threading import Thread
import random
import json

from config import PRIVATE_CODE_LENGTH, BUFFER_SIZE


class ClientServerThread(Thread):
    def __init__(self, sock, address, db):
        super().__init__()  # call super class

        # initialize variables
        self.socket = sock
        self.address = address
        self.username = ''
        self.database = db

    def run(self):
        try:
            self.main()
        except Exception as e:
            print(e)
            self.socket.close()
            print('client{} disconnected'.format(' ' + self.username if self.username else ''))

    def main(self):
        # send the option menu to the client
        self.send_message('Sing in or sign up(press l for login, r for register):')

        while True:
            # receive option from client; make it case insensitive
            option = self.receive_message().lower()
            if option == 'l':
                self.login()
                break
            elif option == 'r':
                self.register()
                break
            else:
                err_text = 'Invalid option.\nPlease select l for login or r for register:'
                self.send_message(err_text)

        while True:
            self.send_message('\nInstructions:\nU-upload\nL-list files\nD-download files\nexit-exit\n')
            option = self.receive_message().lower()
            if option == 'u':
                self.upload()
            elif option == 'l':
                self.list_files()
            elif option == 'd':
                self.download()
            elif option == 'exit':
                self.send_message('Bye {}!'.format(self.username))
                print('client {} disconnected'.format(self.username))
                self.socket.close()
                break
            else:
                self.send_message('Unknown option.')

    def generate_code(self):
        """Generates a super private key"""
        # [A-Za-z0-9]
        population = string.ascii_lowercase + string.ascii_uppercase + ''.join(map(str, range(10)))
        code = ''.join(random.sample(population, PRIVATE_CODE_LENGTH))
        # just in case ;)
        if code in self.database.get_files(only_keys=True):
            return self.generate_code()
        else:
            return code

    def upload(self):
        self.send_message('UPLOAD')
        f = self.receive_message()
        # print(f)
        f = json.loads(f)
        file_name, file_str = f['file_name'], f['file_content']

        unique_code = self.generate_code()  # must be before locking semaphore to avoide deadlock

        self.database.upload_file(self.username, file_name, file_str, unique_code)

        self.send_message('Your super private key is: {}'.format(unique_code))
        self.receive_message()

    def download(self):
        self.send_message('DOWNLOAD')
        code = self.receive_message()
        if code not in self.database.get_files(only_keys=True):
            self.send_message(json.dumps({'status': 'error', 'message': 'Wrong key'}))
        else:
            send_json = {'status': 'OK'}
            files = self.database.get_files(username=self.username)

            file_name = [f['name'] for f in files if f['key'] == code][0]
            file_str = self.database.download_file(code)
            send_json['file_name'] = file_name
            send_json['file_content'] = file_str
            self.send_message(json.dumps(send_json), all=True)
        
        self.receive_message()

    def list_files(self):
        """Lists all files for specific user"""
        files = self.database.get_files(self.username)
        # self.send_message('LIST')

        send_str = ''
        for file_data in files:
            send_str += '\nFile name: {}\n\tKey: {}\n'.format(file_data['name'], file_data['key'])

        if send_str == '':
            send_str = 'You don\'t have any files.'
        self.send_message(send_str)
        # self.receive_message()

    def register(self, err=''):
        """Registers a user"""
        self.send_message(err + 'Please enter your username:')
        username = self.receive_message()
        self.send_message('Please enter password')
        password = self.receive_message()

        valid = self.database.register(username, password)

        if not valid:
            self.register('Username {} already exists.\n\n'.format(username))
        else:
            self.username = username
            print('User {} registered.'.format(self.username))

    def login(self, err=''):
        """Logs in user with error checking"""
        self.send_message(err + 'Username:')
        username = self.receive_message()
        self.send_message('Password:')
        password = self.receive_message()

        valid = self.database.login(username, password)

        if not valid:
            self.login('Invalid username or password.\n\n')
        else:
            self.username = username
            print('User {} logged in.'.format(self.username))

    def send_message(self, message, all=False):
        """@params String: message to send through the socket"""
        if all:
            self.socket.sendall(message.encode())
        else:
            self.socket.send(message.encode())

    def receive_message(self):
        """@returns String message: retrieving message from client"""
        return self.socket.recv(BUFFER_SIZE).decode()
