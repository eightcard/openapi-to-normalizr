export default {
  "openapi": "3.0.0",
  "servers": [
    {
      "url": "http://localhost:10010/"
    },
    {
      "url": "https://localhost:10010/"
    }
  ],
  "info": {
    "version": "1.0.0",
    "title": "Swagger Petstore",
    "description": "A sample API that uses a petstore as an example to demonstrate features in the OpenAPI 3.0 specification"
  },
  "paths": {
    "/pets": {
      "x-swagger-router-controller": "pets",
      "get": {
        "description": "Returns all pets from the system that the user has access to\n",
        "parameters": [
          {
            "name": "tags",
            "in": "query",
            "description": "tags to filter by",
            "required": false,
            "schema": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          {
            "name": "limit",
            "in": "query",
            "description": "maximum number of results to return",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "pet response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Pet"
                  }
                }
              }
            }
          },
          "default": {
            "description": "unexpected error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {
                      "$ref": "#/components/schemas/Error"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "description": "Creates a new pet in the store.  Duplicates are allowed",
        "responses": {
          "200": {
            "description": "pet response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "new_pet": {
                      "$ref": "#/components/schemas/NewPet"
                    }
                  }
                }
              }
            }
          },
          "default": {
            "description": "unexpected error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/NewPet"
              }
            }
          },
          "description": "Pet to add to the store",
          "required": true
        }
      }
    },
    "/pets/{id}": {
      "x-swagger-router-controller": "pets___id__",
      "get": {
        "description": "Returns a user based on a single ID, if the user does not have access to the pet",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "ID of pet to fetch",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          },
          {
            "name": "error",
            "in": "query",
            "description": "dummy parmeter for error pattern test",
            "schema": {
              "type": "boolean",
              "default": false
            }
          }
        ],
        "responses": {
          "200": {
            "description": "pet response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "oneOf": [
                    {
                      "$ref": "#/components/schemas/SimplePet"
                    },
                    {
                      "$ref": "#/components/schemas/NewPet"
                    }
                  ],
                  "discriminator": {
                    "propertyName": "object_type",
                    "mapping": {
                      "simplePet": "#/components/schemas/SimplePet",
                      "newPet": "#/components/schemas/NewPet"
                    }
                  }
                }
              }
            }
          },
          "default": {
            "description": "unexpected error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      },
      "delete": {
        "description": "deletes a single pet based on the ID supplied",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "ID of pet to delete",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "pet deleted",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "default": {
            "description": "unexpected error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Pet": {
        "allOf": [
          {
            "$ref": "#/components/schemas/NewPet"
          },
          {
            "required": [
              "id"
            ],
            "properties": {
              "id": {
                "type": "integer",
                "format": "int64"
              },
              "owners": {
                "type": "array",
                "items": {
                  "$ref": "#/components/schemas/Person"
                }
              }
            }
          }
        ]
      },
      "NewPet": {
        "required": [
          "name",
          "object_type"
        ],
        "properties": {
          "object_type": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "tag": {
            "type": "string",
            "default": "no tag"
          },
          "id": {
            "type": "integer",
            "format": "int64"
          },
          "owner_person": {
            "$ref": "#/components/schemas/Person"
          }
        }
      },
      "SimplePet": {
        "required": [
          "name",
          "object_type"
        ],
        "properties": {
          "object_type": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "id": {
            "type": "integer",
            "format": "int64"
          },
          "profile": {
            "type": "object",
            "oneOf": [
              {
                "$ref": "#/components/schemas/NewPet"
              },
              {
                "$ref": "#/components/schemas/Person"
              }
            ],
            "discriminator": {
              "propertyName": "object_type"
            }
          }
        }
      },
      "Person": {
        "x-id-attribute": "person_id",
        "properties": {
          "name": {
            "type": "string",
            "enum": [
              "foo",
              "bar"
            ]
          },
          "email": {
            "type": "string"
          },
          "person_id": {
            "type": "integer",
            "format": "int64"
          }
        }
      },
      "Error": {
        "required": [
          "code",
          "message"
        ],
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          }
        }
      }
    }
  }
};
