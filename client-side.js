
//All the buttons and what they will do on click
if (document.getElementById('addmoviebutton')) {
    let addmoviebutton = document.getElementById('addmoviebutton');
    addmoviebutton.onclick = addMovie;
}
if (document.getElementById('signbutton')) {
    let signUserButton = document.getElementById('signbutton');
    signUserButton.onclick = signUser;
}
if (document.getElementById('searchButton')) {
    let aSearch = document.getElementById('searchButton');
    aSearch.onclick = advancedSearch;
}

if (document.getElementById('searchid')) {
    let searchButton = document.getElementById('searchid');
    searchButton.onkeyup = searchMovies;
}

if (document.getElementById('signup')) {
    let signupButton = document.getElementById('signup');
    signupButton.onclick = createNewUser;
}
if (document.getElementById('logoutButton')) {
    let logoutButton = document.getElementById('logoutButton');
    logoutButton.onclick = logoutUser;
}

if (document.getElementById('watchlistButton')) {
    let logoutButton = document.getElementById('watchlistButton');
    logoutButton.onclick = addMovieToWatchlist;
}
if (document.getElementById('removewButton')) {
    let removeWatchButton = document.getElementById('removewButton');
    removeWatchButton.onclick = removeMovieToWatchlist;
}
if (document.getElementById('reviewButton')) {
    let reviewButton = document.getElementById('reviewButton');
    reviewButton.onclick = addReview;
}
if (document.getElementById('followButton')) {
    let followButton = document.getElementById('followButton');
    followButton.onclick = followpeople;
}
if (document.getElementById('unfollowButton')) {
    let unfollowButton = document.getElementById('unfollowButton');
    unfollowButton.onclick = unfollowpeople;
}
if (document.getElementById('followUButton')) {
    let followUserButton = document.getElementById('followUButton');
    followUserButton.onclick = followUser;
}
if (document.getElementById('unfollowUButton')) {
    let unfollowUserButton = document.getElementById('unfollowUButton');
    unfollowUserButton.onclick = unfollowUser;
}

//This function take a movie info and send it to the server to add that movie
function addMovie() {
    let Title = document.getElementById('addname').value;
    let Year = document.getElementById('addyear').value;
    let Actors = document.getElementById('addactor').value;
    let Director = document.getElementById('adddirector').value;
    let Runtime = document.getElementById('addruntime').value;
    let Genre = document.getElementById('addgenre').value;
    let Writer = document.getElementById('addwriter').value;
    let Plot = document.getElementById('addplot').value;
    let Awards = document.getElementById('addaward').value;
    let Poster = document.getElementById('addposter').value;

    if (Title.length == 0 && Year.length == 0 && Runtime.length == 0
        && Director.length == 0 && Actors.length == 0) {
        window.alert("You must enter required(*) fields");
        return;
    }
    let newMovie = {
        Title, Year, Actors, Director, Runtime,
        Genre, Writer, Plot, Awards, Poster
    };

    console.log(newMovie);
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let response = JSON.parse(this.response || {});
            alert(response.message);
            if (response.error == 0) {
                window.location.href = "/allmovies/";
            }

        }
    }

    req.open("POST", `/allmovies`);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(newMovie));
}

//This function will take user info and send it to the server
function addUser() {
    let username = document.getElementById("username").value;
    let userpassword = document.getElementById("userpassword").value;
    if (username.length == 0 && userpassword.length == 0) {
        window.alert("Enter Username and Password.");
    }
    userInfo = { username, userpassword };
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {

        }
    }
    req.open("POST", "http://localhost:3000/alluser");
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(userInfo));

}
//This function will send the user info who want to login
function signUser() {
    let username = document.getElementById("username").value;
    let userpassword = document.getElementById("userpassword").value;
    if (username.length == 0 && userpassword.length == 0) {
        window.alert("Enter Username and Password.");
    }
    userInfo = { username, userpassword };
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let response = JSON.parse(this.response || {});
            alert(response.message);
            console.log(response);
            if (response.error == 0) {
                window.location.href = "/profile";
            }
        }
    }
    req.open("POST", "http://localhost:3000/userlogin");
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(userInfo));
}


//This function will send the title, genre and actor to server to search movies matched these values 
function advancedSearch() {
    let Title = document.getElementById('namesearch').value;
    let Actor = document.getElementById('actorsearch').value;
    let Genre = document.getElementById('genresearch').value;
    if (Title.length == 0 && Actor.length == 0 && Genre.length == 0) {
        window.alert("You must enter one of the fields.");
    }

    let info = { Title, Actor, Genre };
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let result = JSON.parse(req.responseText);
            console.log(result.message);
            for (i in result.movies) {
                console.log(result.movies.length);
            }
            document.getElementById("searchedResult").innerHTML = result && result.movies &&
                result.movies.length > 0 ? searchMovieList(result && result.movies ||
                    []) : "No movies found";


        }

    }

    req.open("POST", "http://localhost:3000/search");
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(info));
}

//This function will update the page with search result
function searchMovieList(movie) {
    let content = "";
    movie.map(element => {
        content += `<a href="allmovies/${element._id}">${element.Title}</a><br>`
    });
    return content;
}
//This function will send a title to server to search movies that have those characters
function searchMovies() {
    let searchText = document.getElementById('searchid').value;
    if (searchText.length == 0) {
        document.getElementById('searchedMovies').innerHTML = "Enter a movie name";
        return;
    }

    console.log(searchText);
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let result = JSON.parse(req.responseText);
            console.log(result);
            document.getElementById("searchedMovies").innerHTML = result && result.movies &&
                result.movies.length > 0 ? searchMovieList(result && result.movies ||
                    []) : "No movies found";
            console.log(this.responseText);
        }
    }

    req.open("POST", "http://localhost:3000/");
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({ searchText }));
}
//This function will a new users info to the server to create a new user
function createNewUser() {
    let username = document.getElementById("username").value;
    let userpassword = document.getElementById("userpassword").value;
    if (username.length == 0 && userpassword.length == 0) {
        window.alert("Enter Username and Password.");
    }
    userInfo = { username, userpassword };
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let response = JSON.parse(this.response || {})
            alert(response.message);
            console.log(response);
            if (response.error == 0) {
                window.location.href = "/profile";
            }
        }
    }
    req.open("POST", "http://localhost:3000/signuserup");
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(userInfo));

}
// this function will send request to the server to logout the loggedin user
function logoutUser() {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let response = JSON.parse(this.response || {})
            alert(response.message);
            console.log(response);
            if (response.error == 0) {
                window.location.href = "/user";

            }
        }
    }
    let logout = { logout: "logout" };
    req.open("POST", "http://localhost:3000/logout");
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(logout));
}
//This function will send a request to the server to add a movies to user's watchlist
function addMovieToWatchlist() {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let response = JSON.parse(this.response || {})
            alert(response.message);
        }
    }
    let addtowatchlist = { cmd: "addtowatchlist" };
    req.open("POST", "http://localhost:3000/watchlist");
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(addtowatchlist));

}
//This function will send a request to the server to remove a movies to user's watchlist
function removeMovieToWatchlist() {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let response = JSON.parse(this.response || {})
            alert(response.message);
        }
    }
    req.open("POST", "http://localhost:3000/removewatchlist");
    req.setRequestHeader("Content-Type", "application/json");
    req.send();
}
//This function will send a request to the server to add a review to a movie
function addReview() {
    let score = document.getElementById('nreview').value;
    let summary = document.getElementById('sreview').value;
    let fullText = document.getElementById('freview').value;

    if (score.length == 0 && summary.length == 0 && fullText.length == 0) {
        alert("You must fill in the review fields");
    }

    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let response = JSON.parse(this.response || {})
            if (response.error == 0) {
                alert("Review Added.");
                document.getElementById('sreview').value = "";
                document.getElementById('nreview').value = "";
                document.getElementById('freview').value = "";
            }
        }
    }
    let review = { Score: score, Summary: summary, Text: fullText };
    req.open("POST", "http://localhost:3000/addreview");
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(review));
}
//This function will send a request to server to follow a person
function followpeople() {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let response = JSON.parse(this.response || {})
            alert(response.message);
        }
    }

    req.open("POST", "http://localhost:3000/follow");
    req.setRequestHeader("Content-Type", "application/json");
    req.send();

}
//This function will send a request to server to unfollow a person
function unfollowpeople() {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let response = JSON.parse(this.response || {})
            alert(response.message);
        }
    }

    req.open("POST", "http://localhost:3000/unfollow");
    req.setRequestHeader("Content-Type", "application/json");
    req.send();

}
//This function will send a request to server to follow a user
function followUser() {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let response = JSON.parse(this.response || {})
            alert(response.message);
        }
    }

    req.open("POST", "http://localhost:3000/followuser");
    req.setRequestHeader("Content-Type", "application/json");
    req.send();
}
//This function will send a request to server to unfollow a user
function unfollowUser() {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let response = JSON.parse(this.response || {})
            alert(response.message);
        }
    }

    req.open("POST", "http://localhost:3000/unfollowuser");
    req.setRequestHeader("Content-Type", "application/json");
    req.send();

}