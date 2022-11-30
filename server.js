// libs
require("dotenv").config();
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
// user libs
const { logger, logEvents } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const corsOptions = require("./config/corsOptions");
const connectDB = require("./config/dbConn");

// init server
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3500;

console.log(process.env.NODE_ENV);
connectDB();

// init logger/middleware
app.use(logger);
app.use("/", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// routing
app.use("/", require("./routes/root"));

// not found pages
app.all("*", (req, res) => {
	res.status(404);
	if (req.accepts("html")) {
		res.sendFile(path.join(__dirname, "views", "404.html"));
	} else if (req.accepts("json")) {
		res.json({ message: "404" });
	} else {
		res.type("txt").send("404");
	}
});

// log errors
app.use(errorHandler);

// start server
mongoose.connection.once("open", () => {
	console.log("connected to mongodb");
	app.listen(PORT, () => {
		console.log(`running on port ${PORT}`);
	});
});

mongoose.connection.on("error", (err) => {
	console.log(err);
	logEvents(
		`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
		"mongoerror.log"
	);
});
