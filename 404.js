window.addEventListener("load", setup, false);

function setup() {
    var title = titles[Math.floor(Math.random() * titles.length)];
    document.getElementsByTagName("title")[0].innerHTML = title;
    document.getElementById("error-title").innerHTML = title;
    
    var body = document.getElementsByTagName("body")[0];
    body.classList.remove("orange");
    body.classList.add(colors[Math.floor(Math.random() * colors.length)]);
}

var titles = [
    "Oh Noes!",
    "Yoinks!",
    "Whoopsies!",
    "Dang!",
    "Uh Oh!",
    "Oh No!",
    "Yowsies!"
]
var colors = [
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "pink",
]