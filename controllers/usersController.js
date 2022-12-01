const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Note = require("../models/Note");

//@desc get users
//@route GET /users
//@access private
const getAllUsers = asyncHandler(async (req, res) => {
	// get all users from mongo
	const users = await User.find().select("-password").lean();

	// if no users
	if (!users?.length) {
		return res.status(400).json({ message: "no users found" });
	}

	res.json(users);
});

//@desc create user
//@route POST /users
//@access private
const createNewUser = asyncHandler(async (req, res) => {
	const { username, password, roles } = req.body;

	// confirm data
	if (!username || !password || !Array.isArray(roles) || !roles.length) {
		return res.status(400).json({ message: "all fields required" });
	}

	// check dupes
	const duplicate = await User.findOne({ username }).lean().exec();

	if (duplicate) {
		return res.status(409).json({ message: "duplicate user" });
	}

	// hash pwd
	const hash = await bcrypt.hash(password, 10); // salt rounds

	const userObject = { username, password: hash, roles };

	// create and store user
	const user = await User.create(userObject);

	if (user) {
		res.status(201).json({ message: `new user ${username} created` });
	} else {
		res.status(400).json({ message: "invalid user data received" });
	}
});

//@desc update user
//@route PATCH /users
//@access private
const updateUser = asyncHandler(async (req, res) => {
	const { id, username, roles, active, password } = req.body;

	// confirm data
	if (
		!id ||
		!username ||
		!Array.isArray(roles) ||
		!roles.length ||
		typeof active !== "boolean"
	) {
		return res.status(400).json({ message: "all fields required" });
	}

	const user = await User.findById(id).exec();

	if (!user) {
		return res.status(400).json({ message: "user not found" });
	}

	// check dupe
	const duplicate = await User.findOne({ username }).lean().exec();

	// allow update to original user
	if (duplicate && duplicate?._id.toString() !== id) {
		return res.status(409).json({ message: "duplicate username" });
	}

	user.username = username;
	user.roles = roles;
	user.active = active;

	if (password) {
		user.password = await bcrypt.hash(password, 10);
	}

	const updatedUser = await user.save();

	res.json({ message: `${updatedUser.username} updated` });
});

//@desc delete user
//@route DELETE /users
//@access private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body

    if (!id) {
        return res.status(400).json({message: 'user id required'})
    }

    const note = await Note.findOne({user: id}).lean().exec()

    if (note) {
        return res.status(400).json({message: 'user has assigned notes'})
    }

    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({message: 'user not found'})
    }

    const result = await user.deleteOne()

    const reply = `username ${result.username} with id ${result._id} deleted`

    res.json(reply)
});

module.exports = {
	getAllUsers,
	createNewUser,
	updateUser,
	deleteUser,
};
