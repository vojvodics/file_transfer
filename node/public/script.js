const loginView = `
<div class="form-group">
    <h2>Login</h2>
    <label class="form-control">Username
        <input id="username" type="text" placeholder="Username" class="form-control" />
    </label>
    <label class="form-control">Password
        <input id="password" type="text" placeholder="Password" class="form-control" />
    </label>
    <button onclick="login()" class="form-control">Login</button>
    or <a href="#" onclick="changeLRView()">Register</a>
</div>
`;

const registerView = `
<div class="form-group">
    <h2>Register</h2>
    <label class="form-control">Username
        <input id="username" class="form-control" type="text" placeholder="Username" />
    </label>
    <label class="form-control">Password
        <input id="password" class="form-control" type="text" placeholder="Password" />
    </label>
    <button class="form-control" onclick="register()">Register</button>
    or <a href="#" onclick="changeLRView()">Login</a>
</div>
`;


const fileUploadView = `
<form class="box" onsubmit="uploadFile(event)" enctype="multipart/form-data">
    <div class="box_input">
        <input class="box_file" type="file" name="files[]" id="file" multiple />
        <label for="file"><strong>Choose a file</strong><span class="box_dragndrop"> or drag it here</span>.</label>
    <button class="box_button" type="submit">Upload</button>
    </div>
    <div class="box_uploading">Uploading&hellip;</div>
    <div class="box_success">Done!</div>
    <div class="box_error">Error! <span></span>.</div>
</form>
`;


function login() {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const username = document.querySelector('#username').value;
    const password = document.querySelector('#password').value;
    const body = {'username': username, 'password': password}
    const options = {method: 'POST', headers: headers, body: JSON.stringify(body)}
    const url = 'http://localhost:3000/login';
    
    fetch(url, options)
        .then(resp => resp.json())
        .then(res => {
            console.log(res);
            if (res.success){
                localStorage.setItem('userId', res.id);
                // render(tabView);
                // changeUDLView('list');
                loggedIn();
            }
        }).catch(err => console.log(err));
}

function register() {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const username = document.querySelector('#username').value;
    const password = document.querySelector('#password').value;
    const body = {'username': username, 'password': password}
    const options = {method: 'POST', headers: headers, body: JSON.stringify(body)}
    const url = 'http://localhost:3000/register';

    fetch(url, options)
        .then(res => res.json())
        .then(res => {
            console.log(res);
            if (res.success){
                localStorage.setItem('userId', res.user._id);
                // render(tabView);
                // changeUDLView('list');
                loggedIn();
            }
        }).catch(err => console.log(err));
}

function loggedIn() {
    const id = localStorage.getItem('userId');
    const headers = new Headers();
    headers.set('Authorization', id);
    const options = {method: 'GET', headers: headers}
    const url = 'http://localhost:3000/file';
    fetch(url, options)
        .then(res => res.json())
        .then(res => {
            console.log(res);
            
            let divWrapper = document.createElement('div');
            let files = document.createElement('ul');
            for (let file of res) {
                let fileLi = document.createElement('li');
                let fileLiHtml = `File: <a href="#" onclick=downloadFile('${file.fileCode}','${file.fileName.replace(/ /g, '_')}')>${file.fileName}</a>`;
                fileLi.innerHTML = fileLiHtml;
                files.appendChild(fileLi);
            }
            divWrapper.appendChild(files);
            document.querySelector('#content').innerHTML = '';
            let log = '<button onclick="logout()">Logout</button>';
            document.querySelector('#content').appendChild(divWrapper);
            document.querySelector('#content').innerHTML += log;
            document.querySelector('#content').innerHTML += fileUploadView;
        }).catch(err => console.log(err));
}

function downloadFile(fileCode, fileName) {
    const id = localStorage.getItem('userId');
    const url = 'http://localhost:3000/file';
    const headers = new Headers();
    headers.set('Authorization', id);
    headers.set('Content-Type', 'application/json');

    // console.log('alooo')

    fetch(`${url}?file=${fileCode}`, {method: 'GET', headers: headers})
        .then(res => res.json())
        .then(res => {
            console.log(res);
            // polyfil https://github.com/eligrey/FileSaver.js
            saveAs(new Blob([res]), fileName);
        })
        .catch(err => console.error(err));
}

function uploadFile(event) {
    event.preventDefault();
    // console.log(event.target.result);
    // console.log(document.querySelector('#file').files)
    const id = localStorage.getItem('userId');
    const url = 'http://localhost:3000/file';
    const headers = new Headers();
    headers.set('Authorization', id);
    headers.set('Content-Type', 'application/json')
    // options.body = event.current
    const files = document.querySelector('#file').files;
    
    for (let file of files) {
        // const options = {method: 'POST', headers: headers}
        if (file.size < 500) {
            const fr = new FileReader();
            fr.readAsText(file);
            fr.addEventListener("loadend", function (evt) {
                const data = {fileStr: evt.target.result}
                data.fileName = file.name;
                fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(data)
                }).then(res => res.json())
                .then(response => {
                    const li = document.createElement('li');
                    console.log(response);
                    const fileLiHtml = `File: <a href="#" onclick=downloadFile('${response.fileCode}','${response.fileName.replace(/ /g, '_')}')>${response.fileName}</a>`;
                    li.innerHTML = fileLiHtml;
                    document.querySelector('ul').appendChild(li);
                });
            });
        }
    }
}

function logout() {
    console.log('aeeej')
    localStorage.clear();
    document.querySelector('#content')
    render(LRView);
}

let LRView = loginView;
let isLoginView = true;
// let UDLView = listView;


let id = localStorage.getItem('userId');
if (!id) {
    render(LRView);
} else {
    // render(tabView);
    loggedIn();
}

function render(view) {
    document.querySelector('#content').innerHTML = view;
}    

function changeLRView() {
    // console.log('here');
    LRView = isLoginView ? registerView : loginView;
    isLoginView = !isLoginView;
    render(LRView);
}
