const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const bcryptjs = require('bcryptjs');
const rentalModel = require('../models/rentalModel');

const LOGIN_VIEW = 'general/log-in';
const prepareLoginModel = function (req, validationMessages) {
  return {
    styles: [{ name: 'index.css' }, { name: 'form.css' }],
    validationMessages,
    values: req.body,
  };
};
const SIGNUP_VIEW = 'general/sign-up';
const prepareSignupModel = function (req, validationMessages) {
  return {
    styles: [{ name: 'index.css' }, { name: 'form.css' }],
    validationMessages,
    values: req.body,
  };
};

router.get('/', (req, res) => {
  rentalModel
    .find({ featuredRental: true })
    .exec()
    .then((data) => {
      let rentals = data.map((value) => value.toObject());
      res.render('general/home', {
        styles: [{ name: 'index.css' }, { name: 'home.css' }, { name: 'rentals.css' }],
        rentals,
      });
    })
    .catch((err) => {
      console.log('Error getting rentals from the database... ' + err);
      res.render('general/home', {
        styles: [{ name: 'index.css' }, { name: 'home.css' }, { name: 'rentals.css' }],
        rentals: [],
      });
    });
});

router.get('/sign-up', (req, res) => {
  res.render(SIGNUP_VIEW, prepareSignupModel(req));
});

router.get('/log-in', (req, res) => {
  if (req.session.user) {
    if (!req.session.isCustomer) {
      res.redirect('/rentals/list');
    } else {
      res.redirect('/cart');
    }
  } else {
    res.render(LOGIN_VIEW, prepareLoginModel(req));
  }
});

router.get('/welcome', (req, res) => {
  res.render('general/welcome', {
    styles: [{ name: 'index.css' }, { name: 'welcome.css' }],
  });
});

const CART_VIEW = 'general/cart';
const prepareCartModel = function (req, messages = {}) {
  if (req.session && req.session.user && req.session.isCustomer) {
    let cart = req.session.cart || [];
    let cartTotal = 0;
    let vatAmt = 0;
    if (cart.length > 0) {
      cart.forEach((cartRental) => {
        cartTotal = cartTotal + cartRental.priceStay;
      });
      vatAmt = cartTotal * 0.1; //10% for tax
    } else {
      messages.emptyCart = 'There are no properties on the cart';
    }

    return {
      styles: [{ name: 'index.css' }, { name: 'list.css' }],
      messages,
      rentals: cart,
      cartTotal: cartTotal.toFixed(2),
      vatAmt: vatAmt.toFixed(2),
      grandTotal: parseFloat(cartTotal + vatAmt).toFixed(2),
    };
  } else {
    //User is not a customer or not logged in
    messages.notCustomer = 'You are not authorized to view this page.';
    return {
      styles: [{ name: 'index.css' }, { name: 'list.css' }],
      messages,
      rentals: [],
    };
  }
};
router.get('/cart', (req, res) => {
  if (!(req.session && req.session.user && req.session.isCustomer)) {
    res.status(401);
  }
  res.render(CART_VIEW, prepareCartModel(req));
});

router.get('/add-rental/:id', (req, res) => {
  let messages = {};

  // Check if the user is signed in as a customer.
  if (req.session && req.session.user && req.session.isCustomer) {
    // A shopping cart object will look like this:
    //      _id: ID of the rental
    //      imageURL
    //      headline: Rental title
    //      city:
    //      province:
    //      numNights: Number of nights they want to stay at the rental
    //      pricePerNight
    //      priceStay: pricePerNight * numNights
    let rentalId = req.params.id;
    let cart = (req.session.cart = req.session.cart || []);
    let found = false;
    rentalModel
      .findById(rentalId)
      .then((rental) => {
        cart.forEach((cartProperty) => {
          if (cartProperty.id === rentalId) {
            found = true;
            cartProperty.numNights++;
            cartProperty.priceStay = cartProperty.pricePerNight * cartProperty.numNights;
          }
        });
        if (found) {
          res.redirect('/cart');
        } else {
          cart.push({
            id: rentalId,
            imageUrl: rental.imageUrl,
            headline: rental.headline,
            city: rental.city,
            province: rental.province,
            numNights: 1,
            pricePerNight: rental.pricePerNight,
            priceStay: parseFloat(1 * rental.pricePerNight),
          });
          res.render(CART_VIEW, prepareCartModel(req));
        }
      })
      .catch((err) => {
        console.log(`Error finding rental: ${err}`);
        res.render(CART_VIEW, prepareCartModel(req));
      });
  } else {
    res.status(401);
    res.render(CART_VIEW, prepareCartModel(req));
  }
});

router.get('/remove-rental/:id', (req, res) => {
  let messages = {};
  if (req.session && req.session.user && req.session.isCustomer) {
    const rentalID = req.params.id;

    let cart = req.session.cart || [];

    const index = cart.findIndex((cartRental) => cartRental.id === rentalID);

    if (index >= 0) {
      cart.splice(index, 1);
    }
  } else {
    res.status(401);
  }
  res.render(CART_VIEW, prepareCartModel(req));
});

//Route for Updating Cart
router.post('/update-cart', (req, res) => {
  
  const rentalID = req.body.id;
  const numNights = parseInt(req.body.numNights);

  if(!Number.isNaN(numNights) && numNights > 0){
    let cart = req.session.cart || [];

    const index = cart.findIndex((cartRental) => cartRental.id === rentalID);
  
    if(index >= 0){
      cart[index].numNights = numNights;
    }
  
    let cartTotal = 0;
    let vatAmt = 0;
  
    if (cart.length > 0) {
    cart.forEach((cartRental) => {
      cartRental.priceStay = cartRental.pricePerNight * cartRental.numNights;
      cartTotal = cartTotal + cartRental.priceStay;
    });
    vatAmt = cartTotal * 0.1; //10% for tax
    } else {
      messages.emptyCart = 'There are no properties on the cart';
    }
    res.json(
      {cart: cart[index],
      cartTotal: cartTotal.toFixed(2),
      vatAmt: vatAmt.toFixed(2),
      grandTotal: parseFloat(cartTotal + vatAmt).toFixed(2)
      }
    );
  }  
});

router.post('/log-in', (req, res) => {
  const { loginEmail, loginPassword, roles } = req.body;

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
    userModel
      .findOne({ email: loginEmail })
      .then((user) => {
        if (user) {
          // Found the user document
          //Compare the password
          bcryptjs.compare(loginPassword, user.password).then((pwMatched) => {
            if (pwMatched) {
              //Passwords match
              req.session.user = user;

              if (roles === 'dataEntry') {
                req.session.isCustomer = false;
                res.redirect('/rentals/list');
              } else {
                //Customer
                req.session.isCustomer = true;
                req.session.cart = [];
                res.redirect('/cart');
              }
            } else {
              //Password did not match
              console.log('Password does not match the database.');
              validationMessages.loginError = 'Sorry, you entered an invalid email and/or password';
              res.render(LOGIN_VIEW, prepareLoginModel(req, validationMessages));
            }
          });
        } else {
          //User was not found
          console.log('Email was not found in the database.');
          validationMessages.loginError = 'Sorry, you entered an invalid email and/or password';
          res.render(LOGIN_VIEW, prepareLoginModel(req, validationMessages));
        }
      })
      .catch((err) => {
        console.log('Error finding the user in the database ... ' + err);
        validationMessages.loginError = 'Sorry, you entered an invalid email and/or password';
        res.render(LOGIN_VIEW, prepareLoginModel(req, validationMessages));
      });
  } else {
    res.render(LOGIN_VIEW, prepareLoginModel(req, validationMessages));
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
    //Check the uniqueness of the email
    userModel
      .findOne({ email: su_email })
      .then((user) => {
        if (user) {
          //If user is found
          passedValidation = false;
          validationMessages.email = 'Email address is already taken. Try another.';
          res.render(SIGNUP_VIEW, prepareSignupModel(req, validationMessages));
        } else {
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
                  res.redirect('/welcome');
                })
                .catch((err) => {
                  console.log(err);
                  validationMessages.emailError = 'Account created but email was not sent';
                  res.render(SIGNUP_VIEW, prepareSignupModel(req, validationMessages));
                });
            })
            .catch((err) => {
              console.log(`Error adding user to the database ... ${err}`);
              validationMessages.error = 'Failed to create an account for the user. Try again.';
              res.render(SIGNUP_VIEW, prepareSignupModel(req, validationMessages));
            });
        }
      })
      .catch((err) => {
        console.log(`Error finding if email is taken ... ${err}`);
        res.render(SIGNUP_VIEW, prepareSignupModel(req));
      });
  } else {
    res.render(SIGNUP_VIEW, prepareSignupModel(req, validationMessages));
  }
});

router.get('/logout', (req, res) => {
  if (req.session.user) {
    // Clear the session from memory.
    req.session.destroy();
  }
  res.redirect('/log-in');
});

module.exports = router;
