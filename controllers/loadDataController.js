const express = require('express');
const router = express.Router();
const rentalModel = require('../models/rentalModel');
const rentaldb = require('../models/rentals-db');

const LOAD_DATA_VIEW = 'loadData/rentals';
const prepareLoadDataModel = function (req, message) {
  return {
    styles: [{ name: 'index.css' }],
    message,
  };
};
router.get('/', (req, res) => {
  if (req.session && req.session.user && !req.session.isCustomer) {
    rentalModel
      .count()
      .then((count) => {
        if (count === 0) {
          rentalModel
            .insertMany(rentaldb.getRentals())
            .then(() => {
              console.log('Rentals successfully added to the database');
              res.render(LOAD_DATA_VIEW, prepareLoadDataModel(req, 'Added rentals to the database'));
            })
            .catch((err) => {
              //render here an error message
              console.log("Couldn't insert the documents:" + err);
              res.render(LOAD_DATA_VIEW, prepareLoadDataModel(req, 'Rentals could not be inserted to the database'));
            });
        } else {
          //There are documents loaded, don't duplicate them.
          console.log('Data has been loaded to the database');
          res.render(LOAD_DATA_VIEW, prepareLoadDataModel(req, 'Rentals have already been added to the database'));
        }
      })
      .catch((err) => {
        //Error couldnt count documents render message
        console.log('Could not count the documents' + err);
        res.render(LOAD_DATA_VIEW, prepareLoadDataModel(req, 'There has a problem loading the existing rentals on the database'));
      });
  } else {
    res.status(401);
    res.render(LOAD_DATA_VIEW, prepareLoadDataModel(req, 'You are not authorized to view this page.'));
  }
});

module.exports = router;
