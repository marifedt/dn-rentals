const express = require('express');
const router = express.Router();
const rentalModel = require('../models/rentalModel');

const validExtensions = ['.jpg', '.jpeg', '.gif', '.png'];
const validContentTypes = ['image/jpeg', 'image/png', 'image/gif'];

router.get('/', (req, res) => {
  //TODO: Update this to get data from database
  res.render('rentals/rentals', {
    styles: [{ name: 'index.css' }, { name: 'rentals.css' }],
    grpRentals: [...rentalList.getRentalsByCityAndProvince()],
  });
});

router.get('/list', (req, res) => {
  if (req.session && req.session.user && !req.session.isCustomer) {
    rentalModel
      .find()
      .exec()
      .then((data) => {
        let rentals = data.map((value) => value.toObject());
        rentals.sort((a, b) => a.headLine.localeCompare(b.headLine));
        res.render('rentals/list', {
          styles: [{ name: 'index.css' }, { name: 'list.css' }],
          rentals,
        });
      })
      .catch((err) => {
        console.log('Error retrieving rentals data from database' + err);
        res.render('rentals/list', {
          styles: [{ name: 'index.css' }, { name: 'list.css' }],
          message: 'Failed to get rentals data from database',
        });
      });
  } else {
    res.status(401);
    res.render('rentals/list', {
      styles: [{ name: 'index.css' }, { name: 'list.css' }],
      message: 'You are not authorized to view this page',
    });
  }
});

const ADD_VIEW = 'rentals/addRental';
const prepareAddModel = function (req, messages) {
  return {
    styles: [{ name: 'index.css' }, { name: 'form.css' }],
    messages,
    values: req.body,
  };
};

//Route to add a Rental (GET)
router.get('/add', (req, res) => {
  let messages = {};
  if (req.session && req.session.user && !req.session.isCustomer) {
    res.render(ADD_VIEW, prepareAddModel(req));
  } else {
    messages.notClerk = 'You are not authorized to view this page';
    res.status(401);
    res.render(ADD_VIEW, prepareAddModel(req, messages));
  }
});

//Route to add a Rental (POST)
router.post('/add', (req, res) => {
  const { headLine, numSleeps, numBedrooms, numBathrooms, pricePerNight, city, province, featuredRental } = req.body;

  let messages = {};
  let passedValidation = true;

  //Validation for headline
  if (typeof headLine !== 'string' || headLine.trim().length === 0) {
    passedValidation = false;
    messages.headLine = 'You must specify a rental headline';
  }

  //Validation for Number of Guests
  let sleeps = parseInt(numSleeps);
  if (Number.isNaN(sleeps)) {
    passedValidation = false;
    messages.numSleeps = 'Please specify a number';
  } else if (sleeps < 0 || sleeps > 100) {
    passedValidation = false;
    messages.numSleeps = 'It should be between 0 and 100';
  }

  //Validation for Number of Bedrooms
  let bedrooms = parseInt(numBedrooms);
  if (Number.isNaN(bedrooms)) {
    passedValidation = false;
    messages.numBedrooms = 'Please specify a number';
  } else if (bedrooms < 0 || bedrooms > 100) {
    passedValidation = false;
    messages.numBedrooms = 'It should be between 0 and 100';
  }

  //Validation for Number of Bathrooms
  let bathrooms = parseInt(numBathrooms);
  if (Number.isNaN(bathrooms)) {
    passedValidation = false;
    messages.numBathrooms = 'Please specify a number';
  } else if (bathrooms < 0 || bathrooms > 100) {
    passedValidation = false;
    messages.numBathrooms = 'It should be between 0 and 100';
  }

  //Validation for Price
  let price = parseFloat(pricePerNight);
  if (Number.isNaN(price)) {
    passedValidation = false;
    messages.pricePerNight = 'Please specify a number';
  } else if (price < 0 || (Math.floor(price) !== price && (price * 100) % 1 !== 0)) {
    passedValidation = false;
    messages.pricePerNight = 'Minimum value is 0.01';
  }

  //Validation for city
  if (typeof city !== 'string' || city.trim().length === 0) {
    passedValidation = false;
    messages.city = 'You must specify a city';
  }
  //Validation for province
  if (typeof province !== 'string' || province.trim().length === 0) {
    passedValidation = false;
    messages.province = 'You must specify a province';
  }

  //Validation for file
  if (!req.files) {
    passedValidation = false;
    messages.imageUrl = 'Choose an image file for the rental';
  } else {
    const extensionName = req.files.imageUrl.name.slice(-4);
    if (!validExtensions.includes(extensionName)) {
      passedValidation = false;
      messages.imageUrl = 'Not a valid file type';
    } else if (!validContentTypes.includes(req.files.imageUrl.mimetype)) {
      passedValidation = false;
      messages.imageUrl = 'Not a valid file type';
    }
  }

  if (passedValidation) {
    messages.form = 'Success!';
    console.log('Successfully validated');
    res.render('rentals/addRental', {
      styles: [{ name: 'index.css' }, { name: 'form.css' }],
      messages,
    });
  } else {
    res.render('rentals/addRental', {
      styles: [{ name: 'index.css' }, { name: 'form.css' }],
      messages,
      values: req.body,
    });
  }
});

module.exports = router;
