const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const router = express.Router();
const rentalModel = require('../models/rentalModel');

const validExtensions = ['.jpg', '.jpeg', '.gif', '.png'];
const validContentTypes = ['image/jpeg', 'image/png', 'image/gif'];

//Route for rentals page
router.get('/', (req, res) => {
  rentalModel
    .aggregate([
      {
        $group: {
          _id: { city: '$city', province: '$province' },
          rentals: { $push: '$$ROOT' },
        },
      },
    ])
    .then((grpRentals) => {
      res.render('rentals/rentals', {
        styles: [{ name: 'index.css' }, { name: 'rentals.css' }],
        grpRentals,
      });
    })
    .catch((err) => {
      console.log('Error getting data from database ... ' + err);
      res.render('rentals/rentals', {
        styles: [{ name: 'index.css' }, { name: 'rentals.css' }],
        grpRentals: [],
      });
    });
});

//Route for rental list (for Data Clerk)
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
const prepareAddModel = function (req, messages, isAdded = false) {
  if (isAdded) {
    return {
      styles: [{ name: 'index.css' }, { name: 'form.css' }],
      messages,
    };
  } else {
    return {
      styles: [{ name: 'index.css' }, { name: 'form.css' }],
      messages,
      values: req.body,
    };
  }
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
  let { headLine, numSleeps, numBedrooms, numBathrooms, pricePerNight, city, province, featuredRental } = req.body;

  let messages = {};
  let passedValidation = true;

  //Validation for headline
  if (typeof headLine !== 'string' || headLine.trim().length === 0) {
    passedValidation = false;
    messages.headLine = 'You must specify a rental headline';
  }

  //Validation for Number of Guests
  numSleeps = parseInt(numSleeps);
  if (Number.isNaN(numSleeps)) {
    passedValidation = false;
    messages.numSleeps = 'Please specify a number';
  } else if (numSleeps < 0 || numSleeps > 100) {
    passedValidation = false;
    messages.numSleeps = 'It should be between 0 and 100';
  }

  //Validation for Number of Bedrooms
  numBedrooms = parseInt(numBedrooms);
  if (Number.isNaN(numBedrooms)) {
    passedValidation = false;
    messages.numBedrooms = 'Please specify a number';
  } else if (numBedrooms < 0 || numBedrooms > 100) {
    passedValidation = false;
    messages.numBedrooms = 'It should be between 0 and 100';
  }

  //Validation for Number of Bathrooms
  numBathrooms = parseInt(numBathrooms);
  if (Number.isNaN(numBathrooms)) {
    passedValidation = false;
    messages.numBathrooms = 'Please specify a number';
  } else if (numBathrooms < 0 || numBathrooms > 100) {
    passedValidation = false;
    messages.numBathrooms = 'It should be between 0 and 100';
  }

  //Validation for Price
  pricePerNight = parseFloat(pricePerNight).toFixed(2);
  if (Number.isNaN(pricePerNight)) {
    passedValidation = false;
    messages.pricePerNight = 'Please specify a number';
  } else if (pricePerNight < 0 || (Math.floor(pricePerNight) !== pricePerNight && (pricePerNight * 100) % 1 !== 0)) {
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

  //For checkbox value
  let featured = true;
  if (featuredRental !== 'yes') {
    featured = false;
  }

  if (passedValidation) {
    const newRental = new rentalModel({
      headLine,
      numSleeps,
      numBedrooms,
      numBathrooms,
      pricePerNight,
      city,
      province,
      imageUrl: 'default-pic.jpg',
      featuredRental: featured,
    });

    newRental.save().then((rentalSaved) => {
      console.log(`Rental ${rentalSaved.headLine} has been added to the database`);
      messages.form = 'Rental has been added to the database';
      //Create a unique name for the image, to store in the file system
      let uniqueName = `rental-pic-${rentalSaved._id}${path.parse(req.files.imageUrl.name).ext}`;

      //Copy the image data to a file in the 'assets/rental-pics' folder
      req.files.imageUrl
        .mv(`assets/rental-pics/${uniqueName}`)
        .then(() => {
          rentalModel
            .updateOne(
              { _id: rentalSaved._id },
              {
                imageUrl: uniqueName,
              }
            )
            .then(() => {
              //Success
              console.log('Updated the rental pic.');
              messages.rentalPic = 'Rental picture is updated';
              res.render(ADD_VIEW, prepareAddModel(req, messages, true));
            })
            .catch((err) => {
              console.log(`Error updating the rental's pic... ${err}`);
              messages.rentalPic = 'Failed to update the rental pic';
              res.render(ADD_VIEW, prepareAddModel(req, messages, true));
            });
        })
        .catch((err) => {
          console.log(`Error adding rental to the database ... ${err}`);
          messages.form = 'Failed to add rental to the database';
          res.render(ADD_VIEW, prepareAddModel(req, messages));
        });
    });
  } else {
    res.render(ADD_VIEW, prepareAddModel(req, messages));
  }
});

//Route to edit a rental (GET)
router.get('/edit/:id', (req, res) => {
  let messages = {};
  if (req.session && req.session.user && !req.session.isCustomer) {
    rentalModel
      .findById(req.params.id)
      .exec()
      .then((data) => {
        res.render('rentals/edit', {
          styles: [{ name: 'index.css' }, { name: 'form.css' }],
          rental: data.toObject(),
        });
      })
      .catch((err) => {
        console.log(`Error getting the rental from the database ... ${err}`);
        res.redirect('/rentals/list');
      });
  } else {
    messages.notClerk = 'You are not authorized to view this page';
    res.status(401);
    res.render('rentals/edit', {
      styles: [{ name: 'index.css' }, { name: 'form.css' }],
      messages,
    });
  }
});

//Route to edit a rental (POST)
router.post('/edit/:id', (req, res) => {
  const rentalId = req.params.id;
  let { headLine, numSleeps, numBedrooms, numBathrooms, pricePerNight, city, province, featuredRental } = req.body;
  let messages = {};
  let passedValidation = true;
  let newImage = true;

  //Validation for headline
  if (typeof headLine !== 'string' || headLine.trim().length === 0) {
    passedValidation = false;
    messages.headLine = 'You must specify a rental headline';
  }

  //Validation for Number of Guests
  numSleeps = parseInt(numSleeps);
  if (Number.isNaN(numSleeps)) {
    passedValidation = false;
    messages.numSleeps = 'Please specify a number';
  } else if (numSleeps < 0 || numSleeps > 100) {
    passedValidation = false;
    messages.numSleeps = 'It should be between 0 and 100';
  }

  //Validation for Number of Bedrooms
  numBedrooms = parseInt(numBedrooms);
  if (Number.isNaN(numBedrooms)) {
    passedValidation = false;
    messages.numBedrooms = 'Please specify a number';
  } else if (numBedrooms < 0 || numBedrooms > 100) {
    passedValidation = false;
    messages.numBedrooms = 'It should be between 0 and 100';
  }

  //Validation for Number of Bathrooms
  numBathrooms = parseInt(numBathrooms);
  if (Number.isNaN(numBathrooms)) {
    passedValidation = false;
    messages.numBathrooms = 'Please specify a number';
  } else if (numBathrooms < 0 || numBathrooms > 100) {
    passedValidation = false;
    messages.numBathrooms = 'It should be between 0 and 100';
  }

  //Validation for Price
  pricePerNight = parseFloat(pricePerNight).toFixed(2);
  if (Number.isNaN(pricePerNight)) {
    passedValidation = false;
    messages.pricePerNight = 'Please specify a number';
  } else if (pricePerNight < 0 || (Math.floor(pricePerNight) !== pricePerNight && (pricePerNight * 100) % 1 !== 0)) {
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
  if (req.files) {
    const extensionName = req.files.imageUrl.name.slice(-4);
    if (!validExtensions.includes(extensionName)) {
      passedValidation = false;
      messages.imageUrl = 'Not a valid file type';
    } else if (!validContentTypes.includes(req.files.imageUrl.mimetype)) {
      passedValidation = false;
      messages.imageUrl = 'Not a valid file type';
    }
  } else {
    newImage = false;
  }
  //For checkbox value
  let featured = true;
  if (featuredRental !== 'yes') {
    featured = false;
  }

  if (passedValidation) {
    rentalModel
      .findOneAndUpdate(
        { _id: rentalId },
        {
          $set: {
            headLine,
            numSleeps,
            numBedrooms,
            numBathrooms,
            pricePerNight,
            city,
            province,
            featuredRental: featured,
          },
        }
      )
      .then((rental) => {
        if (newImage) {
          //Create a unique name for the image, to store in the file system
          let uniqueName = `rental-pic-${rentalId}${path.parse(req.files.imageUrl.name).ext}`;

          //Copy the image data to a file in the 'assets/rental-pics' folder
          req.files.imageUrl
            .mv(`assets/rental-pics/${uniqueName}`)
            .then(() => {
              rentalModel
                .updateOne(
                  { _id: rental._id },
                  {
                    $set: { imageUrl: uniqueName },
                  }
                )
                .then(() => {
                  //Success
                  console.log('Rental picture updated successfully');
                  res.redirect('/rentals/list');
                })
                .catch((err) => {
                  console.log(`Error updating the rental's pic... ${err}`);
                  res.redirect('/rentals/list');
                });
            })
            .catch((err) => {
              console.log('Failed to upload rental image ...' + err);
              res.redirect('/rentals/list');
            });
        } else {
          console.log('Rental is updated');
          res.redirect('/rentals/list');
        }
      })
      .catch((err) => {
        console.log('Failed to update rental ...' + err);
        res.redirect('/rentals/list');
      });
  } else {
    res.render('rentals/edit', {
      styles: [{ name: 'index.css' }, { name: 'form.css' }],
      messages,
      rental: {
        _id: rentalId,
        headLine,
        numSleeps,
        numBedrooms,
        numBathrooms,
        pricePerNight,
        city,
        province,
        featuredRental: featured,
      },
    });
  }
});

//Route to remove a rental (GET)
router.get('/remove/:id', (req, res) => {
  let messages = {};
  if (req.session && req.session.user && !req.session.isCustomer) {
    res.render('rentals/remove', {
      styles: [{ name: 'index.css' }, { name: 'list.css' }],
      id: req.params.id,
    });
  } else {
    messages.notClerk = 'You are not authorized to view this page';
    res.status(401);
    res.render('rentals/remove', {
      styles: [{ name: 'index.css' }],
      messages,
    });
  }
});

//Route to remove a rental (POST)
router.post('/remove/:id', (req, res) => {
  const rentalId = req.params.id;

  rentalModel
    .findByIdAndRemove(rentalId)
    .then((rental) => {
      console.log(`Rental "${rental.headLine}" removed`);
      fs.rm(`assets/rental-pics/${rental.imageUrl}`)
        .then(() => {
          console.log('File removed successfully');
          res.redirect('/rentals/list');
        })
        .catch((err) => {
          console.log('Failed to remove file... ' + err);
          res.redirect('/rentals/list');
        });
    })
    .catch((err) => {
      console.log('Failed to remove rental ...' + err);
      res.redirect('/rentals/list');
    });
});
module.exports = router;
