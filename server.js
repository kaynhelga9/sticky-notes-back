// libs
const path = require("path");
const cookieParser = require('cookie-parser')
const cors = require('cors')
// user libs
const { logger } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const corsOptions = require('./config/corsOptions')

// init server
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3500;

// init logger/middleware
app.use(logger);
app.use("/", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cookieParser())
app.use(cors(corsOptions))

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

// start
app.listen(PORT, () => {
	console.log(`running on port ${PORT}`);
});
