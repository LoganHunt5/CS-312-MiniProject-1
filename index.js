import express from "express";
import bodyParser from "body-parser";
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

let posts = new Map();
let edit = false;
let editId = -1;
let currentUser = ["", 0];
let invalidLogin = false;
let invalidSignup = false;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/Public'));

app.get("/", async (req, res) => {

        const db = new pg.Client({
            user: "postgres",
            host: "localhost",
            database: "blog",
            password: "123456",
            port: 5432,
        });
        const query = {
            text: "SELECT * FROM public.blogdb ORDER BY date_created DESC ",
        }

        db.connect();
        const result = (await db.query(query)).rows;
        db.end();
    console.log(result);
    res.render("index.ejs", {posts: result, edit:edit, editId:editId, currentUser:currentUser});
});

app.get("/login", (req,res) => {
    res.render("login.ejs", {invalidLogin: invalidLogin});
});

app.get("/signup", (req,res) => {
    res.render("signup.ejs", {invalidSignup: invalidSignup});
});

function getDate(){
    var date;
    date = new Date();
    date = date.getUTCFullYear() + '-' +
        ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
        ('00' + date.getUTCDate()).slice(-2) + ' ' + 
        ('00' + date.getUTCHours()).slice(-2) + ':' + 
        ('00' + date.getUTCMinutes()).slice(-2) + ':' + 
        ('00' + date.getUTCSeconds()).slice(-2);
    return date;
}

app.post("/post", async (req, res) => {
    let date = getDate();
    const db = new pg.Client({
        user: "postgres",
        host: "localhost",
        database: "blog",
        password: "123456",
        port: 5432,
    });
    let query;

    if(edit){
        query = {
            text: "UPDATE blogdb SET title = $1, body = $2, date_created = $3 WHERE blog_id = $4",
            values: [req.body["PostTitle"], req.body["PostContent"], date, editId],
        }
        edit = false;
    } else {
        query = {
            text: "INSERT INTO blogdb (creator_name, creator_user_id, title, body, date_created) VALUES ($1, $2, $3, $4, $5)",
            values: [currentUser[0], currentUser[1], req.body["PostTitle"], req.body["PostContent"], date],
        }
    }
    db.connect();
    await db.query(query);
    db.end();
    res.redirect('/');
});

app.post("/delete", async (req,res) => {
    edit = false;
    posts.delete(req.body["index"]);

    const db = new pg.Client({
        user: "postgres",
        host: "localhost",
        database: "blog",
        password: "123456",
        port: 5432,
    });

    const query = {
        text: "DELETE FROM blogdb WHERE blog_id = $1",
        values: [req.body["id"]],
    };

    db.connect();
    await db.query(query);
    db.end();
    res.redirect('/');
});

app.post("/edit", (req,res) => {
    edit = true
    editId = req.body["id"];

    res.redirect('/');
});



app.post("/logcheck", async (req,res) => {
    const db = new pg.Client({
        user: "postgres",
        host: "localhost",
        database: "blog",
        password: "123456",
        port: 5432,
    });

    const query = {
        text: "SELECT * FROM users WHERE name = $1 AND password = $2",
        values: [req.body["username"], req.body["password"]],
    }

    db.connect();
    const result = (await db.query(query)).rows[0];
    console.log(result);
    db.end();
    if(typeof result === 'undefined' || result.length === 0)
    {
        console.log("empty");
        invalidLogin = true;
        res.redirect('/login');
    } else {
        invalidLogin = false;
        currentUser[0] = result["name"];
        currentUser[1] = result["user_id"];
        res.redirect('/');
    }
});

app.post("/signcheck", async (req,res) => {
    if(req.body["username"].length === 0 || req.body["password"].length == 0){
        invalidSignup = true;
        return res.redirect('/signup');
    } 

    const db = new pg.Client({
        user: "postgres",
        host: "localhost",
        database: "blog",
        password: "123456",
        port: 5432,
    });

    const checkQuery = {
        text: "SELECT * FROM users WHERE name = $1",
        values: [req.body["username"]],
    }

    db.connect();
    const signCheckResult = (await db.query(checkQuery)).rows;
    console.log(signCheckResult);
    console.log(signCheckResult.length);
    if(signCheckResult.length !== 0){
        invalidSignup = true;
        db.end();
        return res.redirect('/signup');
    }

    const query = {
        text: "INSERT INTO users(name, password) VALUES($1, $2)",
        values: [req.body["username"], req.body["password"]],
    }
    await db.query(query);
    invalidSignup = false;
    res.redirect('/login');
});

app.get("/logout", (req,res) => {
    currentUser = ["", 0];
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


