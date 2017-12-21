const express = require('express');
const router = express.Router();
const fs = require('fs');

const User = require('./models/User');

// console.log(User);

router.post('/register', (req, res, next) => {

    console.log(req.body)

    if (!req.body.username || !req.body.password) {
        return res.status(400).json({'success': false})
    }

    const newUser = new User(req.body);

    newUser.save((err, user) => {
        console.log(err, user);
        if(err) return next(err);
        // console.log(user)
        res.json({user: user, success: true});
    });
    // User.create(req.body, (err, user) => {
    //     if(err) return next(err);
    //     read.json(user);
    // })
});


router.post('/login', (req, res, next) => {


    if (!req.body.username || !req.body.password)
        return res.status(400).json({success: false});

    
    User.findOne({username: req.body.username}, (err, user) => {
        if (err) return next(err);

        console.log(user)
        // return res.json({});

        if (!user) return res.json({success: false, error: 'no user'})
        if (user.password === req.body.password) {
            res.json({success: true, id: user._id});
        } else {
            res.json({success: false, error: 'Wrong password'});
        }
    });
});

router.get('/file', (req, res, next) => {

    // auth is user id
    const auth = req.get('Authorization');
    console.log(auth);

    if (!auth) {
        res.set("WWW-Authenticate", "Basic realm=\"Authorization Required\"");
        return res.status(401).send("Authorization Required");
    } else if (req.query && req.query.file) {
        console.log(auth);
        const fileData = sendFile(auth, req.query.file);
        console.log(fileData, 'FILEDATA');
        if (!fileData) return res.sendStatus(400);
        res.json(fileData);
    } else {
        // console.log(auth === "undefined");
        User.findById(auth, (err, user) => {
            if (err) {
                // maybe check for not a valid id or somthing
                return next(err);
            }
            console.log(user, auth);
            if (!user) return res.sendStatus(400);
            
            res.json(user['files']);
        })
    }
    
});

router.get('/del', (req, res) => {
    User.remove({});
    res.json({})
})


router.post('/file', (req, res, next) => {
    // auth is user id
    const auth = req.get('Authorization');
    console.log(req.body);
    if (!auth) {
        res.set("WWW-Authenticate", "Basic realm=\"Authorization Required\"");
        return res.status(401).send("Authorization Required");
    } else {
        if (!req.body.fileName || !req.body.fileStr || req.body.fileStr.length > 500) {
            return res.sendStatus(400);
        }

        const file = {
            'fileName': req.body.fileName,
            // 'fileStr': req.body.fileStr,
            'fileCode': generateCode()
        }

        console.log(auth, file);

        saveFile(auth, file);

        User.findOneAndUpdate(
            {_id: auth},
            {$push: {'files': file}},
            {new: true},
            (err, user) => {
                if (err) return next(err);
                console.log(user, 'USER');  
                res.json(file);
            }
        );
    }
});



function saveFile(userId, file) {
    const dir = `./files/${userId}`;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    console.log(file);
    console.log(`${dir}/${file['fileCode']}`);
    fs.writeFile(`${dir}/${file['fileCode']}`, file['fileStr'], err => console.log(err, 'SAVE FILE'));
}

function generateCode() {
    const length = 10,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let retVal = "";

    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

function sendFile(userId, fileCode) {
    const path = `./files/${userId}/${fileCode}`;
    console.log(path);
    if (fs.existsSync(path)) {
        const data = fs.readFileSync(path, 'utf8');
        return data;
    } else {
        return null;
    }
}



module.exports = router;