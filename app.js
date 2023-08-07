const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//post method

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  let hashedPassword = await bcrypt.hash(password, 10);

  let q1 = `select * from user where username='${username}';`;
  const op1 = await db.get(q1);
  // console.log(op1);
  if (op1 === undefined) {
    const q2 = `
      insert into user(username,name,password,gender,location)
      values(
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}'
      );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(q2);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login

app.post("/login", async (request, response) => {
  let { username, password } = request.body;
  const q3 = `
  select * from user where username='${username}';`;
  const check = await db.get(q3);
  if (check === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let comapre1 = await bcrypt.compare(password, check.password);
    if (comapre1 === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//put method

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const q4 = `select * from user where username='${username}';`;
  const check_password = await db.get(q4);
  //response.send(check_password);
  //console.log(check_password);
  let comapre2 = await bcrypt.compare(oldPassword, check_password.password);
  if (comapre2 === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword1 = await bcrypt.hash(newPassword, 10);
      const q5 = `update user set password='${hashedPassword1}'
where username='${username}';`;
      await db.run(q5);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
