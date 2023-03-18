const express = require('express');
const router = express.Router();
const rentalList = require('../models/rentals-db');

router.get('/', (req, res) => {
  res.render('rentals/rentals', {
    styles: [{ name: 'index.css' }, { name: 'rentals.css' }],
    grpRentals: [...rentalList.getRentalsByCityAndProvince()],
  });
});

router.get('/list', (req, res) => {
  if (req.session.user && !req.session.isCustomer) {
    res.send('Welcome Data Clerk');
  } else {
    res.status(401).send('You are not authorized to view this page.');
  }
});

module.exports = router;
