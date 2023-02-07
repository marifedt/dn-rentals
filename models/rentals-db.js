var rentals = [
  {
    headLine: 'Nice 2-bedroom townhouse',
    numSleeps: 4,
    numBedrooms: 2,
    numBathrooms: 1,
    pricePerNight: 45,
    city: 'St. Catharines',
    province: 'Ontario',
    imageUrl: '../assets/maldives.jpg',
    featuredRental: true,
  },
  {
    headLine: 'Comfortable 3-bedroom house',
    numSleeps: 4,
    numBedrooms: 4,
    numBathrooms: 1,
    pricePerNight: 85,
    city: 'St. Catharines',
    province: 'Ontario',
    imageUrl: '../assets/maldives.jpg',
    featuredRental: true,
  },
  {
    headLine: 'Luxury Bungalow',
    numSleeps: 5,
    numBedrooms: 2,
    numBathrooms: 2,
    pricePerNight: 215,
    city: 'St. Catharines',
    province: 'Ontario',
    imageUrl: '../assets/maldives.jpg',
    featuredRental: true,
  },
  {
    headLine: 'Cozy Private Room',
    numSleeps: 1,
    numBedrooms: 1,
    numBathrooms: 1,
    pricePerNight: 25,
    city: 'St. Catharines',
    province: 'Ontario',
    imageUrl: '../assets/maldives.jpg',
    featuredRental: true,
  },
  {
    headLine: 'Falls House Walking Distance',
    numSleeps: 9,
    numBedrooms: 5,
    numBathrooms: 1,
    pricePerNight: 600,
    city: 'Niagara Falls',
    province: 'Ontario',
    imageUrl: '../assets/maldives.jpg',
    featuredRental: true,
  },
  {
    headLine: 'Cottage Close to the Falls',
    numSleeps: 8,
    numBedrooms: 3,
    numBathrooms: 2,
    pricePerNight: 200,
    city: 'Niagara Falls',
    province: 'Ontario',
    imageUrl: '../assets/maldives.jpg',
    featuredRental: true,
  },
];

module.exports.getFeaturedRentals = function () {
  let featured = [];

  rentals.forEach((rental) => {
    if (rental.featuredRental) featured.push(rental);
  });

  return featured;
};

module.exports.getRentalsByCityAndProvince = function () {
  let cityProvince = [];
  rentals.forEach((rental) => {
    if (!cityProvince.includes(`${rental.city}, ${rental.province}`))
      cityProvince.push(`${rental.city}, ${rental.province}`);
  });

  let grpRentals = [];

  cityProvince.forEach((cp) => {
    let properties = {
      cityProvince: cp,
      rentals: [],
    };
    rentals.forEach((rental) => {
      if (`${rental.city}, ${rental.province}` === cp) {
        properties.rentals.push(rental);
      }
    });
    grpRentals.push(properties);
  });

  return grpRentals;
};
