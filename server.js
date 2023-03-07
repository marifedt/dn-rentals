/*************************************************************************************
 * WEB322 - 2231 Project
 * I declare that this assignment is my own work in accordance with the Seneca Academic
 * Policy. No part of this assignment has been copied manually or electronically from
 * any other source (including web sites) or distributed to other students.
 *
 * Student Name  : Marife Dela Torre
 * Student ID    : 125768192
 * Course/Section: WEB322 NCC
 *
 **************************************************************************************/

const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');
const rentalList = require(path.join(__dirname, '/models/rentals-db'));

//Setup dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './config/keys.env' });

//Set up express
const app = express();

//Set up Handlebars
app.engine(
  '.hbs',
  exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
  })
);
app.set('view engine', '.hbs');

//Set up body-parser
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, '/assets')));

// Add your routes here
// e.g. app.get() { ... }
app.get('/', (req, res) => {
  res.render('home', {
    styles: [{ name: 'index.css' }, { name: 'home.css' }, { name: 'rentals.css' }],
    rentals: rentalList.getFeaturedRentals(),
  });
});

app.get('/rentals', (req, res) => {
  res.render('rentals', {
    styles: [{ name: 'index.css' }, { name: 'rentals.css' }],
    grpRentals: [...rentalList.getRentalsByCityAndProvince()],
  });
});

app.get('/sign-up', (req, res) => {
  res.render('sign-up', {
    styles: [{ name: 'index.css' }, { name: 'form.css' }],
  });
});
app.get('/log-in', (req, res) => {
  res.render('log-in', {
    styles: [{ name: 'index.css' }, { name: 'form.css' }],
  });
});

app.get('/welcome', (req, res) => {
  res.render('welcome', {
    styles: [{ name: 'index.css' }],
  });
});

app.post('/login', (req, res) => {
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
    res.render('log-in', {
      styles: [{ name: 'index.css' }, { name: 'form.css' }],
    });
  } else {
    res.render('log-in', {
      styles: [{ name: 'index.css' }, { name: 'form.css' }],
      validationMessages,
      values: req.body,
    });
  }
});

app.post('/sign-up', (req, res) => {
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
    //Continue and submit sign up form
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
        res.redirect('/welcome');
      })
      .catch((err) => {
        console.log(err);

        res.render('sign-up', {
          styles: [{ name: 'index.css' }, { name: 'form.css' }],
        });
      });
  } else {
    res.render('sign-up', {
      styles: [{ name: 'index.css' }, { name: 'form.css' }],
      validationMessages,
      values: req.body,
    });
  }
});

// *** DO NOT MODIFY THE LINES BELOW ***

// This use() will not allow requests to go beyond it
// so we place it at the end of the file, after the other routes.
// This function will catch all other requests that don't match
// any other route handlers declared before it.
// This means we can use it as a sort of 'catch all' when no route match is found.
// We use this function to handle 404 requests to pages that are not found.
app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

// This use() will add an error handler function to
// catch all errors.
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Define a port to listen to requests on.
const HTTP_PORT = process.env.PORT || 8080;

// Call this function after the http server starts listening for requests.
function onHttpStart() {
  console.log('Express http server listening on: ' + HTTP_PORT);
}

// Listen on port 8080. The default port for http is 80, https is 443. We use 8080 here
// because sometimes port 80 is in use by other applications on the machine
app.listen(HTTP_PORT, onHttpStart);
