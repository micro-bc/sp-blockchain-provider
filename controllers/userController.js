const userModel = require('../models/userModel.js');
const ec = require('elliptic').ec;

const EC = new ec('secp256k1');

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
        const user = new userModel({
			username : req.body.username,
			password : req.body.password,
			privateKey : EC.genKeyPair().getPrivate('hex')
        });

        user.save(function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating user',
                    error: err
                });
            }

            return res.status(201).json(user);
        });
    }

};
