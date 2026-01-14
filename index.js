import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt, { hash } from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;
const app = express();
const port = 3000;

app.use(
  session({
    secret: "This is a secret key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "secrets",
  password: "qwerty123",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs", { err: null });
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets.ejs");
  } else {
    res.redirect("/login");
  }
});

app.post("/register", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const hashed_password = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email=$1", [
      username,
    ]);
    if (checkResult.rows.length > 0 || !password) {
      res.send("Email already exist or password is empty");
    } else {
      const result = await db.query(
        "INSERT INTO users (email, password) VALUES ($1, $2)",
        [username, hashed_password]
      );
      console.log(result);
      res.render("secrets.ejs");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
});

passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const available = await db.query("SELECT * from users where email=$1", [
        username,
      ]);
      if (available.rows.length > 0) {
        if (await bcrypt.compare(password, available.rows[0].password)) {
          res.render("secrets.ejs");
        } else {
          res.render("login.ejs", { err: "Incorrect Password" });
        }
      } else {
        res.render("login.ejs", { err: "Incorrect user" });
      }
    } catch (err) {
      console.log(err);
      res.send("DB Error");
    }
  })
);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
