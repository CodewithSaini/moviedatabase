const fs = require('fs');
let bodyParser = require('body-parser');
let mongo = require('mongodb');
const express = require('express');
const session = require('express-session');
const app = express();
app.set("view engine", "pug");
app.use(session({ secret: 'comp2406_vikas' }));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(express.urlencoded({extended:true}));

/***************************************************************************************/
//Database variables
let MongoClient = mongo.MongoClient;
let db;
/***************************************************************************************/
//    All the routes                                                                    /
/***************************************************************************************/
app.get("/", getHomePage);
app.get("/allmovies", queryParser, getAllMovies);
app.get("/allmovies/:id", getaMovie);
app.get("/profile", getProfile);
app.get("/user", getUsers);
app.get("/alluser", getAllUsers);
app.get("/alluser/:userID", getAuser);
app.get("/client-side.js", manageClient);
app.get("/addmovie", submitNewMovie);
app.get("/reviews/:reviewID", getReviewPage);
app.get("/allgenre/:genre", movieByGenre);
app.post("/allmovies", express.json(), addMovie);
app.post("/", express.json(), searchHomeMovie);
app.post("/userlogin", express.json(), signUserin);
app.post("/signuserup", express.json(), addUser);
app.post("/search", express.json(), searchParticulerMovie);
app.post("/logout", express.json(), logoutUser);
app.post("/watchlist", express.json(), addToWatchList);
app.post("/addreview", express.json(), addReview);
app.post("/follow", express.json(), followPeople);
app.post("/unfollow", express.json(), unfollowPeople);
app.post("/followuser", followUser);
app.post("/unfollowuser", unfollowUser);
app.post("/removewatchlist", express.json(), removeMovieFromWatchList);
app.get("/search", searchMovie);
app.get("/:Director", getPeople);
app.get("/:Actors", getPeople);
app.get("/:Writer", getPeople);

/***************************************************************************************/

// This function will show the homepage
function getHomePage(req , res){
    res.render("pages/homePage.pug", {loggedin:req.session.loggedin, username:req.session.username});
}
//This function will query to add pagination for movies
function queryParser(req, res, next) {
    let MAX_MOVIES=2500;
    //build a query string to use for pagination later
    let params = [];
    for (prop in req.query) {
        if (prop == "page") {
            continue;
        }
        params.push(prop + "=" + req.query[prop]);
    }
    req.qstring = params.join("&");

    try {
        req.query.limit = req.query.limit || 25;
        req.query.limit = Number(req.query.limit);
        if (req.query.limit > MAX_MOVIES) {
            req.query.limit = MAX_MOVIES;
        }
    } catch {
        req.query.limit = 10;
    }

    try {
        req.query.page = req.query.page || 1;
        req.query.page = Number(req.query.page);
        if (req.query.page < 1) {
            req.query.page = 1;
        }
    } catch {
        req.query.page = 1;
    }
    next();
}
// This function will get all the movies from movies collection 
function getAllMovies(req, res){
    let startIndex = ((req.query.page - 1) * req.query.limit);
    let amount = req.query.limit;
    db.collection('movies').find().limit(amount).skip(startIndex).toArray(function (err, data) {
        if (err) {
            throw err;
        }
        
        res.render("pages/allmovies.pug", { qstring: req.qstring, username: req.session.username, current: req.query.page ,loggedin:req.session.loggedin,allMovies: data });
    })
}
// This function will get all the user from user collection
function getAllUsers(req, res){
    if(req.session.loggedin){
        db.collection('users').find().toArray(function(err, data){
            if(err){
                throw err;
            }
            res.render("pages/alluser.pug", { Users: data, username: req.session.username, loggedin:req.session.loggedin, username:req.session.username});
        })
    }
}
// This function will query the user collection for a user with uid
function getAuser(req, res){  
    let uid;
    try {
        uid = new mongo.ObjectID(req.params.userID);
    } catch {
        res.status(404).send("Unknown ID");
        return;
    }
    if(req.session.loggedin){
        db.collection('users').findOne({"_id":uid}, function(err, data){
            if(err){
                throw err;
            }
            req.session.ViewedUser = data.username;
            req.session.ViewedUserID = data._id;
            console.log("ViewedUser"+req.session.ViewedUserID);
            db.collection('reviews').find({username:data.username}).toArray(function(err, result){
                if(err){
                    throw err;
                }
                console.log(result);
                res.render("pages/singleuser.pug", {
                    reviews: result, loggedin: req.session.loggedin, username: data.username,
                    Watchlist: Object.values(data && data[0] && data[0].Watchlist || {}), Followlist: Object.values(data && data[0] && data[0].Followlist || {})});
            })
        })
    }
}
// This function will get a movie from movies collection with mid as movie id
function getaMovie(req, res){
    let mid;
    try {
        mid = new mongo.ObjectID(req.params.id);
    } catch {
        res.status(404).send("Unknown ID");
        return;
    }
    db.collection("movies").findOne({ "_id": mid }, function (err, result) {
        if (err) {
            res.status(500).send("Error reading database.");
            return;
        }
        if (!result) {
            res.status(404).send("Unknown ID");
            return;
        }
        req.session.ViewedmovieID = result._id;
        req.session.ViewedmovieTitle = result.Title;
        console.log(result);
        let genre = result.Genre;
        let actor = result.Actors;
        let year = result.Year;
        let id ={};
        id.movieID = JSON.stringify(result._id);
        console.log(genre[0], actor);
        db.collection("reviews").find(id).toArray(function(err, data){
            if(err){
                throw err;
            }
            console.log(data);
            db.collection('movies').find({Year:year},{$or:[{$or:[{Genre:genre[0]}, {Genre:genre[2]},{Genre:genre[1]}]}, {$or:[{Actors:actor[0]}, {Actors:actor[2]},{Actors:actor[1]}]}]}).limit(5).toArray(function(err, similarmovies){
                if(err){
                    throw err;
                }
                console.log("similar movies", similarmovies);
                res.status(200).render("pages/movie.pug", { smovies:similarmovies, movie: result, loggedin: req.session.loggedin, username: req.session.username, reviews: data });
            })
            
        })
        
    });
    
}
// This function will get the info of loggedin user 
function getProfile(req, res){
    if(req.session.loggedin){
        let username = req.session.username;
        db.collection('users').find({username:username}).toArray(function(err, data){
            if(err){
                throw err;
            }
            db.collection('reviews').find({username:username}).toArray(function(err,result){
                if(err){
                    throw err;
                }
                console.log(data);
                //console.log(result);
                res.render("pages/profile.pug", { reviews:result, loggedin: req.session.loggedin, username: username,
                    Notification: Object.values(data && data[0] && data[0].Notification || {}),
                    Watchlist: Object.values(data && data[0] && data[0].Watchlist || {}),
                     FollowUser: Object.values(data && data[0] && data[0].FollowUser || {}),Followlist:Object.values(data && data[0] && data[0].Followlist ||{})});
            })
            
        })      
    }
    else{
        res.redirect('/user');
    }
}

// This function will provide the login page if no user is loggedin otherwise redirect to user's profile page
function getUsers(req, res){
    if(req.session.loggedin){
        res.redirect('/profile');
        return;
    }
    res.render("pages/user.pug", { loggedin: req.session.loggedin, username: req.session.username});
}

//This function will provide the add new movie page
function submitNewMovie(req, res){
    res.render("pages/addMovie.pug", { loggedin: req.session.loggedin, username: req.session.username})

}
// This function will provide the search movie page
function searchMovie(req, res){
    res.render("pages/search.pug", { username: req.session.username,loggedin: req.session.loggedin});
}
//This function will query the movie collection for Actor, Director and Writer name and show the found movie person
function getPeople(req, res){
    let pName = req.params.Director;
    console.log(pName);
    db.collection('movies').find({$or:[{Director:pName}, {Actors:pName}, {Writer:pName}]}).toArray(function(err, result){
        if(err){
            throw err;
        }
        console.log(result);
        req.session.ViewedPerson = pName;
        res.render("pages/people.pug", { username: req.session.username,pName, moviePeople: result, loggedin: req.session.loggedin});
    })
    
}
//This function will get all movies by their genre
function movieByGenre(req, res){
    let genre = req.params.genre;
    db.collection('movies').find({Genre:genre}).toArray(function(err, data){
        if(err){
            throw err;
        }
        res.status(200).render("pages/genre.pug", { username: req.session.username, movies: data, Genre: genre, loggedin: req.session.loggedin})
    })

}
// this function will handle client-side functions
function manageClient(req, res){
    fs.readFile("client-side.js", function(err, data){
        if(err){
            res.status(500);
            res.end("Cannot read file.");
            return;
        }
        res.status(200);
        res.setHeader("Content-Type", "application/javascript");
        res.end(data);
    });
}

//this function will search the movies collection by Title
function searchHomeMovie(req, res){
    let searchName = req.body.searchText;
    console.log(searchName.searchText);
    db.collection('movies').find({Title: {$regex:searchName, $options:'i'}}).toArray(function(err, result){
        if(err){
            throw err;
        }
        result = {movies:result};
        console.log(result);
        res.status(200);
        res.setHeader("Content-Type","application/JSON");
        res.send(JSON.stringify(result));
    });  
}

// This function will accept a request from user with a movie and add that movie to the movies collection
function addMovie(req , res){
    if(req.session.loggedin){
        let movieInfo = req.body;
        let newMovie = {};
        if (movieInfo.hasOwnProperty("Title") && movieInfo.hasOwnProperty("Actors") && movieInfo.hasOwnProperty("Runtime")
            && movieInfo.hasOwnProperty("Director")) {
            let act = movieInfo.Actors.split(",");
            let dir = movieInfo.Director.split(",");
            let wri = movieInfo.Writer.split(",");
            let gen = movieInfo.Genre.split(",");
            newMovie.Actors = act;
            newMovie.Title = movieInfo.Title;
            newMovie.Year = movieInfo.Year;
            newMovie.Runtime = movieInfo.Runtime + " min";
            newMovie.Genre = gen;
            newMovie.Director = dir;
            newMovie.Writer = wri;
            newMovie.Plot = movieInfo.Plot;
            newMovie.Awards = movieInfo.Awards;
            newMovie.Poster = movieInfo.Poster;
            db.collection('movies').insertOne(newMovie, function (err, result) {
                if (err) {
                    throw err;
                }
                movieNotification(req.session.username,newMovie.Title);
                console.log(result.insertedId);
                res.status(200).send({message:"New movie added to the database",error:0,result:result.insertedId});
            })
        }
    }
    else{
        res.status(200).send({ message: "Please log in to add movie.", error: 1 });
        res.end();
    }
     
}
// This function will add a new user to the users collection
function addUser(req, res){
    if(req.session.loggedin){
        res.status(200).send("A user already logged in.");
        return;
    }
    let userInfo = req.body;
    let newUser = {};
    newUser.username = userInfo.username;
    newUser.userpassword = userInfo.userpassword;
    db.collection('users').find({username:newUser.username}).limit(1).toArray(function(err, data){
        if(err){
            throw err;
        }
        if(!data || data.length == 0){
            db.collection('users').insertOne(newUser).then(user =>{
                res.send({message: "Successfully Signed up", error:0});
                req.session.loggedin= true;
                req.session.username = newUser.username;
                console.log("A new user created with id:", user.insertedId);
            })
            .catch(err => console.log("Failed to create user"));
        }
        else{
            res.send({message:"User Already exist", error:1});
            res.end();
        }
        res.status(200);
        console.log(data);
    })
}
//This function will show the one review page for the movie
function getReviewPage(req, res){
    let reviewID;
    try {
        reviewID = new mongo.ObjectID(req.params.reviewID);
    } catch {
        res.status(404).send("Unknown ID");
        return;
    }
    db.collection('reviews').findOne({"_id": reviewID},function(err, data){
        if(err){
            throw err;
        }
        console.log(data);
        res.render("pages/review.pug", {loggedin:req.session.loggedin, username:req.session.username, review:data});
    })
    return;
}

//This function will add a review to the review collection 
function addReview(req, res){
    if(req.session.loggedin){
        let review = req.body || {};
        review.username = req.session.username;
        review.movieID = JSON.stringify(req.session.ViewedmovieID);
        review.movieTitle = req.session.ViewedmovieTitle;
        db.collection('reviews').insertOne(review, function (err, result) {
            if (err) {
                throw err;
            }
            res.status(200).send({ message: " You added a review Added.", error: 0 });
            res.end();
        })
    }
    
}

//This function will login the user if username and password matched
function signUserin(req, res){
    if(req.session.loggedin){
        res.status(200).send("User already logged in.");
        return;
    }
    let userData = req.body;
    console.log(userData);
    let name = userData.username;
    let password = userData.userpassword;
    db.collection('users').find({username:name}).limit(1).toArray(function(err, data){
        if(err){
            throw err;
        }
        if(data && data.length >0){
            if(data[0].userpassword == password){
                req.session.loggedin = true;
                req.session.username = name;
                res.send({message:"User Logged in", error:0});
                res.end();
            }
            else{
                res.send({message:"Username or Password Incorrect.", error:1});
                res.end();
            }
        }
        else {
            res.send({ message: "Username or Password Incorrect.", error: 1 });
            res.end();
        }
    })
    
}

// This function will logout the loggedin user
function logoutUser(req,res){
    let logout = req.body;
    console.log(logout);
    if(logout && req.session.loggedin){
        req.session.loggedin = false;
        res.send({message:"User Logged out Successfully.", error:0});
        res.end();
    }
}
//This function will search the movie either by genre or actor or title
function searchParticulerMovie(req, res){
    let info = req.body;
    let searchQuery={};
    let title = info.Title;
    let actor = info.Actor;
    let genre = info.Genre;
    if(title.length !=0){
        searchQuery.Title = {$regex: title, $options:'i'};
    }
    if(actor.length != 0){
        searchQuery.Actors = {$regex:actor, $options:'i'};
    }
    if(genre.length !=0){
        searchQuery.Genre = {$regex: genre, $options:'i'};
    }
    if(title.length ==0 && actor.length==0 && genre.length==0){
        res.status(200).send({message:"You must enter one of the Fields."});
    }
    else{
        db.collection('movies').find(searchQuery).toArray(function (err, result) {
            if (err) {
                throw err;
            }
            result = { movies: result };
            console.log(result);
            res.status(200);
            res.setHeader("Content-Type", "application/JSON");
            res.send(JSON.stringify(result));
        })
    }
    
    
}
//This function will help the loggedin user to follow other movie people
function followPeople(req, res){
    if(req.session.loggedin){
        db.collection('users').find({ username: req.session.username }).toArray(function (err, result) {
            if (err) {
                throw err;
            }
            let Followlist = result && result[0] && result[0].Followlist || {};
            let viewedPerson = req.session.ViewedPerson;
            if (Object.keys(Followlist).length === 0) {
                Followlist[viewedPerson] = viewedPerson;
            }
            else {
                for (i in Followlist) {
                    if (Followlist[i] != viewedPerson) {
                        Followlist[viewedPerson] = viewedPerson;
                    }
                    else {
                        res.status(200).send({ message: "You already follow this person", error: 1 });
                        return;
                    }

                }
            }

            console.log(Object.keys(Followlist).length);
            db.collection('users').updateOne({ username: req.session.username }, { $set: { "Followlist": Followlist } }, function (err, result) {
                if (err) {
                    throw err;
                }

                res.status(200).send({ message: "You started following this person", error: 0 });
                res.end();
            })
        })

    }
    else{
        res.status(200).send({message:"Please log in.", error:1});
        res.end();
    }
    

}
//This function will help the loggedin user to unfollow a followed movie person
function unfollowPeople(req, res){
    if(req.session.loggedin){
        db.collection('users').find({ username: req.session.username }).toArray(function (err, result) {
            if (err) {
                throw err;
            }
            let Followlist = result && result[0] && result[0].Followlist || {};
            let viewedPerson = req.session.ViewedPerson;
            if (Object.keys(Followlist).length === 0) {
                res.status(200).send({ message: "You dont follow this person" });
                return;
            }
            else {
                for (i in Followlist) {
                    if (Followlist[i] == viewedPerson) {
                        console.log(i);
                        delete Followlist[viewedPerson];
                    }
                }
            }

            console.log(Object.keys(Followlist).length);
            db.collection('users').updateOne({ username: req.session.username }, { $set: { "Followlist": Followlist } }, function (err, result) {
                if (err) {
                    throw err;
                }

                res.status(200).send({ message: "You unfollow this person", error: 0 });
                res.end();
            })
        })
    }
    else{
        res.status(200).send({ message: "Please log in.", error: 1 });
        res.end();
    }
    

}
//This function will help the loggedin user to follow other users
function followUser(req, res){
    if (req.session.loggedin) {
        db.collection('users').find({ username: req.session.username }).toArray(function (err, result) {
            if (err) {
                throw err;
            }
            let FollowUser = result && result[0] && result[0].FollowUser || {};
            let viewedUser = {Name:req.session.ViewedUser, id:req.session.ViewedUserID};
            if (Object.keys(FollowUser).length === 0) {
                FollowUser[req.session.ViewedUser] = viewedUser;
                userNotification(req.session.ViewedUser,req.session.username);
            }
            else {
                for (i in FollowUser) {
                    if (FollowUser[i].Name != req.session.ViewedUser) {
                        FollowUser[req.session.ViewedUser] = viewedUser;
                    }
                    else {
                        res.status(200).send({ message: "You already follow this User", error: 1 });
                        return;
                    }
                }
            }
            console.log(FollowUser);
            db.collection('users').updateOne({ username: req.session.username }, { $set: { "FollowUser": FollowUser } }, function (err, result) {
                if (err) {
                    throw err;
                }

                res.status(200).send({ message: "You starting follow this user", error: 0 });
                res.end();
            })
        })
    }
    else {
        res.status(200).send({ message: "Please log in.", error: 1 });
        res.end();
    }

}
//This function will help the loggedin user to unfollow a followed user
function unfollowUser(req, res){
    if (req.session.loggedin) {
        db.collection('users').find({ username: req.session.username }).toArray(function (err, result) {
            if (err) {
                throw err;
            }
            let FollowUser = result && result[0] && result[0].FollowUser || {};
            let viewedUser = {name:req.session.ViewedUser,id:req.session.ViewedUserID};
            if (Object.keys(FollowUser).length === 0) {
                res.status(200).send({ message: "You dont follow this user" });
                return;
            }
            else {
                for (i in FollowUser) {
                    if (FollowUser[i].Name == req.session.ViewedUser) {
                        delete FollowUser[req.session.ViewedUser];
                    }
                }
            }
            console.log(FollowUser);
            db.collection('users').updateOne({ username: req.session.username }, { $set: { "FollowUser": FollowUser } }, function (err, result) {
                if (err) {
                    throw err;
                }

                res.status(200).send({ message: "You unfollow this user", error: 0 });
                res.end();
            })
        })
    }
    else {
        res.status(200).send({ message: "Please log in.", error: 1 });
        res.end();
    }

}
//This function will help the loggedin user to add a movie to his watchlist if it is not there already
function addToWatchList(req, res){
    if(req.session.loggedin){
        db.collection('users').find({ "username": req.session.username }).toArray(function (err, data) {
            if (err) {
                throw err;
            }
            let Watchlist = data && data[0] && data[0].Watchlist || {};
            let viewedMovie = { id: req.session.ViewedmovieID, Title: req.session.ViewedmovieTitle };
            if (Object.keys(Watchlist).length === 0) {
                Watchlist[req.session.ViewedmovieTitle] = viewedMovie;
            }
            else {
                for (i in Watchlist) {
                    if (Watchlist[i].Title != req.session.ViewedmovieTitle) {

                        Watchlist[req.session.ViewedmovieTitle] = viewedMovie;
                    }
                    else {
                        res.status(200).send({ message: "You already watch this movie", error: 1 });
                        return;
                    }

                }
            }
            console.log(Watchlist);
            db.collection('users').updateOne({ "username": req.session.username }, { $set: { "Watchlist": Watchlist } }, function (err, result) {
                if (err) {
                    throw err;
                }
                res.status(200);
                res.send({ message: "Successfully added to your watchlist", error: 0 });
                res.end();
            })

        })
    }
    else{
        res.status(200).send({message:"Please log in.", error:1});
        res.end();
    }
}
//This function will remove a movie from loggedin user's watchlist
function removeMovieFromWatchList(req, res){
    if (req.session.loggedin) {
        db.collection('users').find({ "username": req.session.username }).toArray(function (err, data) {
            if (err) {
                throw err;
            }
            let Watchlist = data && data[0] && data[0].Watchlist || {};
            let viewedMovie = { id: req.session.ViewedmovieID, Title: req.session.ViewedmovieTitle };
            if (Object.keys(Watchlist).length === 0) {
                res.status(200).send({message:"This movie is not in your watchlist", erroe:0});
                return;
            }
            else {
                for (i in Watchlist) {
                    if (Watchlist[i].Title == req.session.ViewedmovieTitle) {
                        delete Watchlist[req.session.ViewedmovieTitle];
                    }
                }
            }
            console.log(Watchlist);
            db.collection('users').updateOne({ "username": req.session.username }, { $set: { "Watchlist": Watchlist } }, function (err, result) {
                if (err) {
                    throw err;
                }
                res.status(200);
                res.send({ message: "Successfully removed from your watchlist", error: 0 });
                res.end();
            })

        })
    }
    else {
        res.status(200).send({ message: "Please log in.", error: 1 });
        res.end();
    }
}
//This function will add a notification to user's notification list if any other user started following him
function userNotification(username, followUser){
    db.collection('users').find({username:username}).toArray(function(err,data){
        if(err){
            throw err;
        }
        let Notification = data && data[0] && data[0].Notifications ||[];
        Notification.push(followUser+" started following you.");
        db.collection('users').updateOne({username:username},{$set:{"Notification":Notification}}, function(err, result){
            if(err){
                throw err;
            }
        });
    })
}
//This function will notify all users except loggedin user that a user added a new movie
function movieNotification(username, movieTitle){
    db.collection('users').find().toArray(function(err, data){
        if(err){
            throw err;
        }
        data && data.map((obj)=>{
            let Notification = obj.Notification ||[];
            Notification.push(username+" added "+ movieTitle+ " movie to the database.");
            if(obj.username !=username){
                db.collection('users').updateOne({username:obj.username},{$set:{"Notification":Notification}}, function(err, result){
                    if(err){
                        throw err;
                    }
                })
            }
        })
    })
}

// Initialize database connection
MongoClient.connect("mongodb://localhost:27017/", function (err, client) {
    if (err) throw err;
    //Get the moviedatabase
    db = client.db('moviedatabase');

    // Start server once Mongo is initialized
    app.listen(3000);
    console.log("Server is running at http://localhost:3000");
});



