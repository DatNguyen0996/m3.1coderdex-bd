const fs = require("fs");
const csv = require("csvtojson");

const createData = async () => {
  let newData = await csv().fromFile("pokemon.csv");
  let data = JSON.parse(fs.readFileSync("db.json"));

  newData = newData.slice(0, 721).map((e, index) => {
    return {
      id: index + 1,
      name: e.Name,
      types: [e.Type1, e.Type2],
      url: `http://localhost:5000/images/${index + 1}.jpg`,
    };
  });
  data.data = newData;
  data.totalPokemons = newData.length;
  fs.writeFileSync("db.json", JSON.stringify(data));
};

createData();
