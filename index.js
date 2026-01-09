import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "secrets",
  password: "qwerty123",
  port: 5432,
});
db.connect();


const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs",{err:null});
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
 try{
  const checkResult = await db.query("SELECT * FROM users WHERE email=$1", [
    username,
  ]);
  if (checkResult.rows.length > 0) {
    res.send("Email already exist");
  } else {
    const result = await db.query(
      "INSERT INTO users (email, password) VALUES ($1, $2)",
      [username, password]
    );
    console.log(result);
    res.render("secrets.ejs");
  }}catch(err){
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  
  try{
    const available = await db.query("SELECT * from users where email=$1",[username])
    if (available.rows.length > 0){
      if(available.rows[0].password == password){
        res.render("secrets.ejs");
      }else{
        res.render("login.ejs", { err: "Incorrect Password" });
      }
    }else{
      res.render("login.ejs", { err: "Incorrect user" });
    }
  }catch(err){
    console.log(err)
    res.send("DB Error")
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
