import express from "express";
import bodyParser from "body-parser";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
let length = 0
let posts = new Map();
let edit = false;
let editIndex = -1;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/Public'));

app.get("/", (req, res) => {
    res.render("index.ejs", {length: length, posts: posts, edit:edit, editIndex:editIndex});
});

function getDate(){
    const d = new Date();
    let date = "";
    let hour = d.getHours();
    let min = d.getMinutes();
    let sec = d.getSeconds();
    let am = false;
    if(hour < 12){
        hour = hour.toString();
        am = true;
    }else{
        hour = hour-12;
    }
    if (min < 10) {
        min = "0" + min.toString();
    } else {
        min = min.toString();
    }
    if(sec < 10){
        sec = "0" + sec.toString();
    } else {
        sec = sec.toString();
    }
    date = hour  + ":" + min + ":" + sec;
    if (am){
        date = date + " AM";
    } else {
        date = date + " PM";
    }
    return date;
}

app.post("/post", (req, res) => {
    if(edit){
        let post = [req.body["PostTitle"], req.body["PostContent"], "Edited At " + getDate(), editIndex];
        posts.set(editIndex, post);
        edit = false;
        editIndex = -1;
    } else {
        let post = [req.body["PostTitle"], req.body["PostContent"], getDate(), length];
        posts.set(length.toString(), post);
        length = length + 1;
    }
    res.redirect('/');
});

app.post("/delete", (req,res) => {
    posts.delete(req.body["index"]);

    res.redirect('/');
});

app.post("/edit", (req,res) => {
    edit = true
    editIndex = req.body["index"];

    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


