'use strict';
const { createPet } = require('../helpers/entities');

module.exports = {
  get_pets___id__, delete_pets___id__,
};

function get_pets___id__(req, res) {
  console.log('-------- call get_pets___id__ ----------');
  if (req && req.query && req.query.error){
    res.status(400);
    res.json({
      code: 1022,
      message: 'sample error'
    });
  } else {
    const id = req.swagger.params.id.value;
    res.json(createPet({id: id}));
  }

}

function delete_pets___id__(req, res) {
  console.log('-------- call delete_pets___id__ ----------');
  res.status(204);
  res.end();
}
