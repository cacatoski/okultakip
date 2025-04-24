const express = require("express");
const cors = require("cors");
const app = express();
const authRoutes = require("./routes/auth");

app.use(cors());
app.use(express.json());
app.use("/api", authRoutes);

app.get("/", (req, res) => res.send("Backend ayakta! 🚀"));
app.listen(8000, () => console.log("Backend 8000 portunda!"));
