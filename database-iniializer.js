let mongo = require('mongodb');
let fs = require('fs');
let MongoClient = mongo.MongoClient;
let db;
let movies = JSON.parse(fs.readFileSync("./movie-data/movie-data-100.json"));

MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true, useUnifiedTopology: true }, function (err, client,) {
    if (err) throw err;
    db = client.db('moviedatabase');

    db.dropCollection("movies", function (err, result) {
        if (err) {
            console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)");
        }
        else {
            console.log("Created a movies collection.");
        }
        db.collection("movies").insertMany(movies, function (err, result) {
            if (err) throw err;
            console.log("Successfuly inserted " + result.insertedCount + " movies.")
            process.exit();
        })
    });
});