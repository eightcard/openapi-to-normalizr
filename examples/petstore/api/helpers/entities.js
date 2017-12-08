'use strict';

module.exports = {
  createPet, getRandomInt,
};

/**
 * {id, name, tag, ownersNum, ownerOption}
 */
function createPet(options = {}) {
  const id = randomInt();
  const ownerOption = options.ownerOption;
  delete options.ownerOption;
  return Object.assign({
    id: id,
    object_type: ['Dog', 'Cat'][getRandomInt(0, 1)],
    name: `Pet ${id}`,
    tag: `Sample Tag ${id}`,
    owner: createPerson(ownerOption),
  }, options);
}

function createPerson(option) {
  const id = randomInt();
  return Object.assign({
    person_id: id,
    name: ['foo', 'bar'][getRandomInt(0, 1)],
    email: `email_${id}@example.com`,
  }, option);
}

function randomInt() {
  return getRandomInt(1, 20);
}

function getRandomInt(min, max) {
  return Math.floor( Math.random() * (max - min + 1) ) + min;
}
