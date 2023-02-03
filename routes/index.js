var express = require("express");
var router = express.Router();
const fs = require("fs");
const { CLIENT_RENEG_LIMIT } = require("tls");

/* GET Pokemon image */
router.get("/images/:id", function (req, res, next) {
  fs.readFile(`pokemon-image/${req.params.id}`, (err, imageData) => {
    if (err) {
      res.json({
        result: "failed",
        messageee: `cannot read image. Error is:${err}`,
      });
    }
    res.writeHead(200, { "Content-Type": "image/jpg" });
    res.end(imageData);
  });
});

/* GET Pokemons */
router.get("/pokemons", function (req, res, next) {
  try {
    let { page, limit, search, type } = req.query;
    // console.log(page, limit, search, type);
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 50;

    let offset = limit * (page - 1);

    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    let result = [];
    result = db;
    let filterPokemon = data;
    type
      ? (filterPokemon = filterPokemon.filter(
          (poke) =>
            poke.types[0].toLowerCase().includes(type) ||
            poke.types[1].toLowerCase().includes(type)
        ))
      : filterPokemon;

    filterPokemon = filterPokemon.slice(offset, offset + limit);

    result.data = filterPokemon;
    result.totalPokemons = filterPokemon.length;
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

/* GET Pokemon detail */
router.get("/pokemons/:id", function (req, res, next) {
  try {
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;

    let result = {};

    let filterPokemon = data;

    filterPokemon.map((pokemon, index) => {
      if (Number(pokemon.id) === Number(req.params.id)) {
        let currentId;
        let previousId;
        let nextId;
        if (index === 0) {
          currentId = index;
          previousId = data.length - 1;
          nextId = index + 1;
        } else if (index + 1 === data.length) {
          currentId = index;
          previousId = index - 1;
          nextId = 0;
        } else {
          currentId = index;
          previousId = index - 1;
          nextId = index + 1;
        }

        result = {
          data: {
            pokemon: {
              name: filterPokemon[currentId].name,
              types: [
                filterPokemon[currentId].types[0] === ""
                  ? filterPokemon[currentId].types[0]
                  : filterPokemon[currentId].types[0].toLowerCase(),
                filterPokemon[currentId].types[1] === "" ||
                filterPokemon[currentId].types[1] === undefined
                  ? filterPokemon[currentId].types[1]
                  : filterPokemon[currentId].types[1].toLowerCase(),
              ],
              id: filterPokemon[currentId].id,
              url: filterPokemon[currentId].url,
            },
            previousPokemon: {
              name: filterPokemon[previousId].name,
              types: [
                filterPokemon[previousId].types[0] === ""
                  ? filterPokemon[previousId].types[0]
                  : filterPokemon[previousId].types[0].toLowerCase(),
                filterPokemon[previousId].types[1] === "" ||
                filterPokemon[previousId].types[1] === undefined
                  ? filterPokemon[previousId].types[1]
                  : filterPokemon[previousId].types[1].toLowerCase(),
              ],
              id: filterPokemon[previousId].id,
              url: filterPokemon[previousId].url,
            },
            nextPokemon: {
              name: filterPokemon[nextId].name,
              types: [
                filterPokemon[nextId].types[0] === ""
                  ? filterPokemon[nextId].types[0]
                  : filterPokemon[nextId].types[0].toLowerCase(),
                filterPokemon[nextId].types[1] === "" ||
                filterPokemon[nextId].types[1] === undefined
                  ? filterPokemon[nextId].types[1]
                  : filterPokemon[nextId].types[1].toLowerCase(),
              ],
              id: filterPokemon[nextId].id,
              url: filterPokemon[nextId].url,
            },
          },
        };
      } else {
        return result;
      }
    });
    console.log(result);

    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

/* post Pokemon */

router.post("/pokemons", (req, res, next) => {
  try {
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;

    const { name, id, url, types } = req.body;
    console.log({ name, id, url, types });
    const pokemonType = [
      "normal",
      "fire",
      "water",
      "electric",
      "grass",
      "ice",
      "fighting",
      "poison",
      "ground",
      "flying",
      "psychic",
      "bug",
      "rock",
      "ghost",
      "dragon",
      "dark",
      "steel",
      "fairy",
    ];

    // Missing required data
    if (!name || !id || !url || !types) {
      const exception = new Error(`Missing required data.`);
      exception.statusCode = 401;
      throw exception;
    }

    // Pokémon can only have one or two types.
    if (types.length > 2) {
      const exception = new Error(`Pokémon can only have one or two types.`);
      exception.statusCode = 401;
      throw exception;
    }

    // Pokémon's type is invalid.
    console.log(types);
    let typeFormatWrite = [];
    types.map((e) => {
      if (e !== "" && e !== null) {
        typeFormatWrite.push(e.toLowerCase());
      } else {
        typeFormatWrite.push("");
      }
    });
    let typeFormat = [];
    types.map((e) => {
      if (e !== "" && e !== null) {
        typeFormat.push(e.toLowerCase());
      }
    });

    // console.log(typeFormat);

    let errorPost = false;

    const notAllow = pokemonType.filter((el) => !typeFormat.includes(el));

    if (typeFormat.length === 1 && notAllow.length > pokemonType.length - 1) {
      errorPost = true;
    } else if (
      typeFormat.length === 2 &&
      notAllow.length > pokemonType.length - 2
    ) {
      errorPost = true;
    } else {
      errorPost = false;
    }

    if (errorPost) {
      const exception = new Error(`Pokémon's type is invalid.`);
      exception.statusCode = 401;
      throw exception;
    }

    // The Pokémon already exists.
    data.map((pokemon) => {
      if (
        pokemon.id === Number(id) ||
        pokemon.name.toLowerCase() === name.toLowerCase()
      ) {
        const exception = new Error(`The Pokémon already exists.`);
        exception.statusCode = 401;
        throw exception;
      }
    });

    const newPokemon = {
      id,
      name,
      types: typeFormatWrite,
      url,
    };

    //Add new pokemon
    data.push(newPokemon);
    //Add new pokemon to db JS object
    db.data = data;
    db.totalPokemons = data.length;
    //db JSobject to JSON string
    db = JSON.stringify(db);
    //write and save to db.json
    fs.writeFileSync("db.json", db);

    // console.log(newPokemon);
    res.status(200).send(newPokemon);
  } catch (error) {
    next(error);
  }
});

//update pokemon (Update only ["name", "url", "types"] )
router.put("/pokemon/:id", (req, res, next) => {
  try {
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;

    //req.params.id;
    const targetIndex = data.findIndex(
      (data) => Number(data.id) === Number(req.params.id)
    );
    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }

    const allowUpdate = ["name", "url", "types"];
    const updates = req.body;
    const updateKeys = Object.keys(updates);

    const notAllow = updateKeys.filter((el) => !allowUpdate.includes(el));
    if (notAllow.length) {
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }

    const newUpdate = { ...db.data[targetIndex], ...updates };
    db.data[targetIndex] = newUpdate;
    db = JSON.stringify(db);
    //write and save to db.json
    fs.writeFileSync("db.json", db);

    res.status(200).send(newUpdate);
  } catch (error) {
    next(error);
  }
});
//Delete Pokemon
router.delete("/:id", (req, res, next) => {
  try {
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    //find book by id
    const targetIndex = data.findIndex(
      (pokemon) => Number(pokemon.id) === Number(req.params.id)
    );
    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }

    db.data = data.filter(
      (pokemon) => Number(pokemon.id) !== Number(req.params.id)
    );
    console.log(db.data);
    db = JSON.stringify(db);
    //write and save to db.json

    fs.writeFileSync("db.json", db);

    //delete send response
    res.status(200).send({});
  } catch (error) {
    next(error);
  }
});
module.exports = router;
