const express = require('express');
const router = express.Router();
const rentalModel = require('../models/rentalModel');

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
        console.log(rentals);
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

router.get('/add', (req, res) => {});

module.exports = router;
