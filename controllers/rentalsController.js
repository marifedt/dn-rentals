const express = require('express');
const router = express.Router();
const rentalList = require('../models/rentals-db');

router.get('/', (req, res) => {
  res.render('rentals/rentals', {
    styles: [{ name: 'index.css' }, { name: 'rentals.css' }],
    grpRentals: [...rentalList.getRentalsByCityAndProvince()],
  });
});

module.exports = router;
