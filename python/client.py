from socket import socket, AF_INET, SOCK_STREAM

from threading import Thread
import time
import os
import json

from config import BUFFER_SIZE, ADDRESS, PORT, CHARACTER_LIMIT, DOWNLOADS_FOLDER


def pretty_print(string):
    print('*'*10 + '\n' + string + '\n' + '*'*10)

def download():
    pretty_print('Super private key:')
    key = input()
    sock.send(key.encode())
    response = sock.recv(BUFFER_SIZE).decode()
    response = json.loads(response)
    # print(response)
    if response['status'] == 'OK':
        file_name = response['file_name']
        if not os.path.isdir(DOWNLOADS_FOLDER):
            os.mkdir(DOWNLOADS_FOLDER)
        # print(file_name)
        file_content = response['file_content']
        with open(os.path.join(DOWNLOADS_FOLDER, file_name), 'w') as f:
            f.write(file_content)
        print('File saved as:', os.path.join(DOWNLOADS_FOLDER, file_name))
    else:
        pretty_print(response)
    sock.send('OK'.encode())

def upload():
    while True:
        file_name = input('Path to the file:')
        if os.path.isfile(file_name):
            with open(file_name, 'r') as f:
                file_content = f.read()
            send_file = {
                'file_name': file_name,
                'file_content': file_content
            }
            
            sock.sendall(json.dumps(send_file).encode())
            response = sock.recv(BUFFER_SIZE).decode()
            pretty_print(response)
            sock.send('OK'.encode())
            break  
        else:
            print('Sorry, {} is not a file or a directory'.format(file_name))
            
def main():
    while True:
        message = sock.recv(BUFFER_SIZE).decode()
        # ensure message lenght (file) is smaller than the limit
        
        pretty_print(message)
        if message.startswith('DOWNLOAD'):
            download()
        elif message.startswith('UPLOAD'):
            upload()
        elif message.startswith('Bye'):
            # print('By from client code')
            break
        elif message.startswith('LIST'):
            continue
        else:
            send_str = input()
            sock.send(send_str.encode())    


def connect_to_server():
    while True:
        try:
            sock = socket(AF_INET, SOCK_STREAM)
            sock.connect((ADDRESS, PORT))  # connect to the server
            return sock
        except:
            print('Could not connect to the server.')
            time.sleep(5)

if __name__ == '__main__':
    sock = connect_to_server()


    while True:
        try:
            main()
            break
        except BrokenPipeError:
            print('Sorry, server became unavailable.')
            break
        except Exception as e:
            print(e)
            print('Sorry, something went wrong.')
            break


