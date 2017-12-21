from socket import socket, AF_INET, SOCK_STREAM

from config import ADDRESS, PORT
from database_model import Database
from client_server_thread import ClientServerThread


if __name__ == '__main__':

    # initialize socket
    SERVER_SOCKET = socket(family=AF_INET, type=SOCK_STREAM)
    SERVER_SOCKET.bind((ADDRESS, PORT))

    SERVER_SOCKET.listen()
    print('*****Listening on port {}*****'.format(PORT))

    clients = []
    db = Database()

    try:
        while True:
            client_socket, client_address = SERVER_SOCKET.accept()

            client = ClientServerThread(client_socket, client_address, db)
            clients.append(client)
            client.start()  # start the client thread
            print('client connected')
    except KeyboardInterrupt:
        print('Server closed')
        SERVER_SOCKET.close()
