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

// body parser 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Todo 목록 가져오기 API
app.get("/api/todos", (req, res) => {
  const query = "SELECT * FROM todo_db.todos";

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching todos from database: ", err);
      res.status(500).json({ error: "Failed to fetch todos from database" });
      return;
    }

    res.json(results);
  });
});

app.get("/api/todo/:id", (req, res) => {
  const todoId = req.params.id; // 요청 URL에서 id 값을 가져옴

  // MySQL에서 해당 todo 아이템 조회
  connection.query(
    "SELECT * FROM todo_db.todos WHERE id = ?",
    [todoId],
    (err, result) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        res.status(500).json({ error: "Failed to fetch todo item from MySQL" });
        return;
      }

      if (result.length === 0) {
        // 해당 id의 todo가 없을 경우
        res.status(404).json({ error: "Todo item not found" });
      } else {
        // 해당 id의 todo를 반환
        const todo = result[0];
        res.status(200).json({ id: todo.id, content: todo.content });
      }
    }
  );
});

// Todo 추가하기 API
app.post("/api/todos", (req, res) => {
  console.log("POST: api/todos", req.body);
  const { id, content, checked } = req.body;

  const query = "INSERT INTO todos (id, content, checked) VALUES (?, ?, ?)";

  connection.query(query, [id, content, checked], (err, result) => {
    if (err) {
      console.error("Error inserting todo into database: ", err);
      res.status(500).json({ error: "Failed to insert todo into database" });
      return;
    }

    res.json({ id: result.insertId, content, checked });
  });
});

// isChecked 값 patch
app.patch("/api/todo/:id", (req, res) => {
  const todoId = req.params.id; // 요청 URL에서 id 값을 가져옴
  const { checked } = req.body; // 요청 본문에서 isChecked 값을 가져옴

  // MySQL에서 해당 todo 아이템 업데이트
  connection.query(
    "UPDATE todos SET checked = ? WHERE id = ?",
    [checked, todoId],
    (err, result) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        res.status(500).json({ error: "Failed to update todo item in MySQL" });
        return;
      }
      res.status(200).json({ message: "Todo item updated successfully" });
    }
  );
});

// Todo DELETE 요청 API
// path params
app.delete("/api/todo/:id", (req, res) => {
  const todoId = req.params.id; // 요청 본문에서 id 값을 읽어옴

  // MySQL에서 해당 todo 아이템 삭제
  connection.query(
    "DELETE FROM todos WHERE id = ?",
    [todoId],
    (err, result) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        res
          .status(500)
          .json({ error: "Failed to delete todo item from MySQL" });
        return;
      }
      // 중간에 빈 id 값을 연속된 순서로 채우기
      connection.query("SET @count := 0;", (err, result) => {
        if (err) {
          console.error("Error executing MySQL query:", err);
          res
            .status(500)
            .json({ error: "Failed to update todo item in MySQL" });
          return;
        }

        connection.query(
          "UPDATE todos SET id = (@count := @count + 1);",
          (err, result) => {
            if (err) {
              console.error("Error executing MySQL query:", err);
              res
                .status(500)
                .json({ error: "Failed to update todo item in MySQL" });
              return;
            }
            res.status(200).json({ message: "User deleted successfully" });
          }
        );
      });
    }
  );
});

// 회원가입 POST
app.post("/signup", (req, res) => {
  console.log("POST: /signup", req.body);
  const { email, password } = req.body;

  // 사용자 정보 유효성 검사
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "이메일과 비밀번호를 입력해주세요." });
  }

  // 이메일 중복 확인 쿼리 실행
  connection.query(
    "SELECT * FROM todo_db.users WHERE email = ?",
    [email],
    (error, results) => {
      if (error) {
        console.error("MySQL 쿼리 오류:", error);
        return res
          .status(500)
          .json({ message: "회원가입 중 오류가 발생했습니다." });
      }

      if (results.length > 0) {
        return res
          .status(400)
          .json({ message: "이미 사용 중인 이메일입니다." });
      }

      // 사용자 등록
      connection.query(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [email, password],
        (err) => {
          if (err) {
            console.error("MySQL 쿼리 오류:", err);
            return res
              .status(500)
              .json({ message: "회원가입 중 오류가 발생했습니다." });
          }

          res
            .status(201)
            .json({ message: "회원가입이 성공적으로 완료되었습니다." });
        }
      );
    }
  );
});

// 로그인 POST
app.post("/login", (req, res) => {
  console.log("POST: /login", req.body);

  const { email, password } = req.body;

  // 사용자 정보 유효성 검사
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "사용자명과 비밀번호를 입력해주세요." });
  }

  //db에 해당  user 있는지 확인
  connection.query(
    "SELECT * FROM todo_db.users WHERE email = ? AND password = ?",
    [email, password],
    (error, results) => {
      if (error) {
        // 에러 처리
        console.error("데이터베이스 쿼리 에러:", error);
        return res
          .status(500)
          .json({ message: "로그인 중 오류가 발생했습니다." });
      }

      //   if (results.length === 0) {
      //     return res
      //       .status(400)
      //       .json({ message: "로그인 정보가 올바르지 않습니다." });
      //   }
      //   console.log("rrrrrrrrrrrrrrrrrrrrrrr", results);
    }
  );
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
