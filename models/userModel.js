const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;

const userSchema = new Schema({
	'username': {
		type: String,
		validate: {
			validator: function (v) {
				if (!(/^\w{4,}$/.test(v))) {
					return false;
				}

				let id = String(this._id || this._conditions._id);
				return User.findOne({ username: v })
					.then((user) => {
						if (!user) {
							return true;
						}
						
						return String(user._id) === id;
					}).catch(err => err);
			},
			message: () => 'Username invalid'
		},
		required: [true, 'Username required']
	},
	'password': {
		type: String,
		validate: {
			validator: function (v) {
				return /^\w{6,}$/.test(v);
			},
			message: () => 'Password invalid'
		},
		required: [true, 'Password required']
	},
	'privateKey' : String
});

userSchema.set('toJSON', {
	transform: function (doc, ret, options) {
		delete ret.password;
		return ret;
	}
});

userSchema.pre('save', function (next) {
	const user = this;
	bcrypt.hash(user.password, 10, (err, hash) => {
		if (err) {
			return next(err);
		}

		user.password = hash;
		next();
	})
});

userSchema.statics.authenticate = function (username, password, callback) {
	User.findOne({ username: username }).exec((err, user) => {
		if (err) {
			return callback(err);
		}

		if (!user) {
			return callback();
		}

		bcrypt.compare(password, user.password, (err, result) => {
			if (result === true) {
				return callback(null, user);
			}

			return callback();
		});
	});
};

const User = mongoose.model('user', userSchema);
module.exports = User;