const userModel = require('../models/userModel.js');

const request = require('request');
const ec = require('elliptic').ec;

const EC = new ec('secp256k1');

const INIT_DATA = {
    clicks: 500,
    masks: 200,
    respirators: 100,
    volunteers: 50,
    doctors: 20,
    ventilators: 5,
    researches: 3
};

module.exports = {

    login: function (req, res, next) {
        userModel.authenticate(req.body.username, req.body.password, (err, user) => {
            if (err) {
                return next(err);
            }

            if (!user) {
                return res.status(400).json({
                    error: "Username or password incorrect"
                });
            }

            return res.status(200).json(user);
        })
    },

    register: function (req, res) {
        const kp = EC.genKeyPair();

        const user = new userModel({
            username: req.body.username,
            password: req.body.password,
            privateKey: kp.getPrivate('hex')
        });

        user.save(async (err, user) => {
            if (err) {
                if (err.name == 'ValidationError') {
                    return res.status(400).json({
                        error: err.message
                    });
                }

                return next(err);
            }

            const nodes = await getNodes('localhost:2002').then(res => res, console.error);
            if (!nodes) {
                return res.status(500).json({
                    error: 'Tracker error'
                });
            }

            const pub = kp.getPublic('hex');
            const sig = kp.sign('mineBlock', 'utf-8').toDER('hex');

            for (let i = 0; i < nodes.length; ++i) {
                if (await initWallet(nodes[i], pub, sig).then(_ => true, _ => false)) {
                    return res.status(201).json(user);
                }
                console.error('Node error');
            }

            return res.status(500).json({
                error: 'Failed to initWallet'
            });
        });
    }

};

function getNodes(tracker) {
    return new Promise((resolve, reject) => {
        request('http://' + tracker, { timeout: 2000 }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                reject('Tracker error');
            }

            resolve(JSON.parse(body));
        });
    })
}

function initWallet(node, publicKey, signature) {
    return new Promise((resolve, reject) => {
        request('http://' + node + '/initWallet', { timeout: 2000, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ publicKey, signature }), method: 'POST' }, (err, res, body) => {
            if (err || res.statusCode != 201) {
                reject('Node error');
            }

            resolve();
        });
    });
}
