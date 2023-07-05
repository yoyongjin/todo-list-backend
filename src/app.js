const express = require("express");
const mysql = require("mysql");
const path = require("path");
const app = express();
const cors = require("cors");

// MySQL 연결 설정
const connection = mysql.createConnection({
  host: "localhost",
  user: "yoyongjin",
  password: "yoyongjin00!",
  database: "todo_db",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database: ", err);
    return;
  }
  console.log("Connected to MySQL database!");
});

// CORS 설정
app.use(cors());

// Todo 목록 가져오기 API
app.get("/api/todos", (req, res) => {
  const query = "SELECT * FROM todo_db.todo";

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching todos from database: ", err);
      res.status(500).json({ error: "Failed to fetch todos from database" });
      return;
    }

    res.json(results);
  });
});

// Todo 추가하기 API
app.post("/api/todos", (req, res) => {
  const { text } = req.body;

  const query = "INSERT INTO todos (text) VALUES (?)";

  connection.query(query, [text], (err, result) => {
    if (err) {
      console.error("Error inserting todo into database: ", err);
      res.status(500).json({ error: "Failed to insert todo into database" });
      return;
    }

    res.json({ id: result.insertId, text });
  });
});

// Todo DELETE 요청 API
app.delete("/api/todo", (req, res) => {
  const todoId = req.body.id; // 요청 본문에서 id 값을 읽어옴

  // MySQL에서 해당 todo 아이템 삭제
  connection.query("DELETE FROM todo WHERE id = ?", [todoId], (err, result) => {
    if (err) {
      console.error("Error executing MySQL query:", err);
      res.status(500).json({ error: "Failed to delete todo item from MySQL" });
      return;
    }

    // 삭제 결과를 클라이언트에 보내기
    res.json({ success: true });
  });
});

// 서버 시작
app.listen(8080, () => {
  console.log("Server is running on port 8080");
});

app.use(express.static(path.join(__dirname, "../build")));

// 메인페이지 접속 시 build 폴더의 index.html 보내줘
app.get("/", (res, req) => {
  req.sendFile(path.join(__dirname, "../build/index.html"));
});
