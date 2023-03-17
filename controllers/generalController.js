const express = require('express');
const router = express.Router();
const rentalList = require('../models/rentals-db');

router.get('/', (req, res) => {
  res.render('general/home', {
    styles: [{ name: 'index.css' }, { name: 'home.css' }, { name: 'rentals.css' }],
    rentals: rentalList.getFeaturedRentals(),
  });
});

router.get('/sign-up', (req, res) => {
  res.render('general/sign-up', {
    styles: [{ name: 'index.css' }, { name: 'form.css' }],
  });
});

router.get('/log-in', (req, res) => {
  res.render('general/log-in', {
    styles: [{ name: 'index.css' }, { name: 'form.css' }],
  });
});

router.get('/welcome', (req, res) => {
  res.render('general/welcome', {
    styles: [{ name: 'index.css' }, { name: 'welcome.css' }],
  });
});

router.post('/log-in', (req, res) => {
  const { loginEmail, loginPassword } = req.body;

  let passedValidation = true;
  let validationMessages = {};

  if (typeof loginEmail !== 'string' || loginEmail.trim().length === 0) {
    passedValidation = false;
    validationMessages.email = 'You must specify a valid email';
  }
  if (typeof loginPassword !== 'string' || loginPassword.trim().length === 0) {
    passedValidation = false;
    validationMessages.password = 'Input your password';
  }

  if (passedValidation) {
    res.render('general/log-in', {
      styles: [{ name: 'index.css' }, { name: 'form.css' }],
    });
  } else {
    res.render('general/log-in', {
      styles: [{ name: 'index.css' }, { name: 'form.css' }],
      validationMessages,
      values: req.body,
    });
  }
});

router.post('/sign-up', (req, res) => {
  const { su_firstName, su_lastName, su_email, su_password } = req.body;
  let passedValidation = true;
  let validationMessages = {};
  let passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,12}$/;
  //Reference: https://gist.github.com/frizbee/5318c77d2084fa75cd00ea131399581a
  //Did some few tweaks to accept any special characters
  let emailRegex =
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
  //Source: https://www.w3resource.com/javascript/form/email-validation.php

  //First Name
  if (typeof su_firstName !== 'string' || su_firstName.trim().length === 0) {
    passedValidation = false;
    validationMessages.firstName = 'You must specify your first name';
  }
  //Last Name
  if (typeof su_lastName !== 'string' || su_lastName.trim().length === 0) {
    passedValidation = false;
    validationMessages.lastName = 'You must specify your last name';
  }
  //Validation for email address
  if (typeof su_email !== 'string' || su_email.trim().length === 0) {
    passedValidation = false;
    validationMessages.email = 'You must enter your email address';
  } else if (!emailRegex.test(su_email.trim())) {
    passedValidation = false;
    validationMessages.email = 'Enter a valid email address';
  }
  //Password
  if (typeof su_password !== 'string' || su_password.trim().length === 0) {
    passedValidation = false;
    validationMessages.password = 'You must specify a password';
  } else if (su_password.trim().length < 8 || su_password.trim().length > 12) {
    passedValidation = false;
    validationMessages.password = 'Password should be between 8 to 12 characters long.';
  } else if (!passwordRegex.test(su_password)) {
    passedValidation = false;
    validationMessages.password = 'Password should have at least one lowercase letter, uppercase letter, number and a symbol';
  }

  if (passedValidation) {
    const userModel = require('../models/userModel');
    const newUser = new userModel({
      firstName: su_firstName,
      lastName: su_lastName,
      email: su_email,
      password: su_password,
    });
    newUser
      .save()
      .then((userSaved) => {
        console.log(`User ${userSaved.firstName} has been added to the database`);
        res.redirect('general/welcome');
        //Send an email using SendGrid
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

        const msg = {
          to: su_email.trim(),
          from: 'mdt.mrfdt@gmail.com',
          subject: 'Account Created',
          html: `<h3>Welcome to D|N Rentals!</h3>
            <p>Hello <strong>${su_firstName} ${su_lastName}</strong>! <br/> We are thrilled to offer you a wide variety of properties for rent, from cozy apartments to luxurious villas, to help you find the perfect home that suits your needs and preferences. <br/><br/>
            Thank you for choosing our property rental website, and we look forward to helping you find your perfect home!</p>
            <h5>Marife Dela Torre</h5>
            <h4>D|N Rentals</h4>`,
        };
        sgMail
          .send(msg)
          .then(() => {
            res.redirect('general/welcome');
          })
          .catch((err) => {
            console.log(err);

            res.render('general/sign-up', {
              styles: [{ name: 'index.css' }, { name: 'form.css' }],
            });
          });
      })
      .catch((err) => {
        console.log(`Error adding user to the database ... ${err}`);
        validationMessages.email = 'Email is already taken. Try another.';
        req.body.su_email = '';
        res.render('general/sign-up', {
          styles: [{ name: 'index.css' }, { name: 'form.css' }],
          validationMessages,
          values: req.body,
        });
      });
  } else {
    res.render('general/sign-up', {
      styles: [{ name: 'index.css' }, { name: 'form.css' }],
      validationMessages,
      values: req.body,
    });
  }
});

module.exports = router;
