const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    require: true,
  },
  lastName: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
  },
});

userSchema.pre('save', function (next) {
  let user = this;
  //Generate a unique SALT
  bcryptjs
    .genSalt()
    .then((salt) => {
      bcryptjs
        .hash(user.password, salt)
        .then((hashPad) => {
          user.password = hashPad;
          next();
        })
        .catch((err) => {
          console.log(`Error occured when hashing ... ${err}`);
        });
    })
    .catch((err) => {
      console.log(`Error occured when salting ... ${err}`);
    });
});
const userModel = mongoose.model('users', userSchema);

module.exports = userModel;
