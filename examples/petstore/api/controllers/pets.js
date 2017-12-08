'use strict';
const { createPet, getRandomInt } = require('../helpers/entities');

module.exports = {
  get_pets, post_pets,
};

function get_pets(req, res) {
  console.log('-------- call get_pets ----------');
  const petNum = getRandomInt(1, 5);
  const pets = [];
  for (let i = 0; i < petNum; i++) {
    pets.push(createPet());
  }
  res.json(pets);
}

function post_pets(req, res) {
  console.log('-------- call post_pets ----------');
  const body = req.swagger.params.requestBody.value;
  res.json(createPet(body));
}
