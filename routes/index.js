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

    // filter by type
    filterPokemon.map((pokemon) => {
      newTypes = [];
      pokemon.types.map((type) => {
        type === "" ? newTypes : newTypes.push(type.toLowerCase());
      });
      pokemon.types = newTypes;
    });

    type
      ? (filterPokemon = filterPokemon.filter((poke) =>
          poke.types.includes(type)
        ))
      : filterPokemon;

    //filter by search
    let errorSearch = [];

    if (search) {
      errorSearch = filterPokemon.filter(
        (poke) =>
          poke.name.includes(search.toLowerCase()) || poke.id == Number(search)
      );
      if (errorSearch.length == 0) {
        const exception = new Error(`Pokemon not found`);
        exception.statusCode = 404;
        throw exception;
      }
    }

    search
      ? (filterPokemon = filterPokemon.filter(
          (poke) =>
            poke.name.includes(search.toLowerCase()) ||
            poke.id == Number(search)
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

    let filterPokemon = {
      data: {
        pokemon: {},
        previousPokemon: {},
        nextPokemon: {},
      },
    };

    const targetIndex = data.findIndex(
      (data) => Number(data.id) === Number(req.params.id)
    );
    // console.log(targetIndex);

    let previousIndex;
    let nextIndex;
    if (targetIndex === 0) {
      previousIndex = data.length - 1;
      nextIndex = targetIndex + 1;
    } else if (targetIndex + 1 === data.length) {
      previousIndex = targetIndex - 1;
      nextIndex = 0;
    } else {
      previousIndex = targetIndex - 1;
      nextIndex = targetIndex + 1;
    }

    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }
    const newTypes = (index) => {
      let typesConvert = [];
      data[index].types.forEach((e) => {
        e ? typesConvert.push(e.toLowerCase()) : typesConvert;
      });
      return typesConvert;
    };

    filterPokemon.data.pokemon = {
      name: data[targetIndex].name,
      types: newTypes(targetIndex),
      id: data[targetIndex].id,
      url: data[targetIndex].url,
    };
    filterPokemon.data.previousPokemon = {
      name: data[previousIndex].name,
      types: newTypes(previousIndex),
      id: data[previousIndex].id,
      url: data[previousIndex].url,
    };
    filterPokemon.data.nextPokemon = {
      name: data[nextIndex].name,
      types: newTypes(nextIndex),
      id: data[nextIndex].id,
      url: data[nextIndex].url,
    };
    result = filterPokemon;
    // console.log(filterPokemon.data);
    // console.log(result);

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
    // console.log({ name, id, url, types });
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
    // console.log(types);
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
      types: typeFormat,
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

    res.status(200).send(newPokemon);
  } catch (error) {
    next(error);
  }
});

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
    // console.log(db.data);
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
