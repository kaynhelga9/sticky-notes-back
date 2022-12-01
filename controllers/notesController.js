const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Note = require("../models/Note");

//@desc get notes
//@route GET /notes
//@access private
const getAllNotes = asyncHandler(async (req, res) => {
	// get all notes from mongo
	const notes = await Note.find()
		.select("user title text completed ticket")
		.lean();

	// if no notes
	if (!notes?.length) {
		return res.status(400).json({ message: "no notes found" });
	}

	// Attach title to note
	const result = await Promise.all(
		notes.map(async (note) => {
			const user = await User.findById(note.user).lean().exec();
			return { ...note, username: user.username };
		})
	);

	res.json(result);
});

//@desc create note
//@route POST /notes
//@access private
const createNewNote = asyncHandler(async (req, res) => {
	const { user, title, text } = req.body;

	// confirm data
	if (!user || !title || !text) {
		return res.status(400).json({ message: "all fields required" });
	}

	// check dupes
	const duplicate = await Note.findOne({ title }).lean().exec();

	if (duplicate) {
		return res.status(409).json({ message: "duplicate note title" });
	}

	// create and store new note
	const note = await Note.create({ user, title, text });

	if (note) {
		const user = await User.findById(note.user).lean().exec();
		res.status(201).json({
			message: `new note ${title} created for user ${user.username}`,
		});
	} else {
		res.status(400).json({ message: "invalid note data received" });
	}
});

//@desc update note
//@route PATCH /notes
//@access private
const updateNote = asyncHandler(async (req, res) => {
	const { id, user, title, text, completed } = req.body;

	// confirm data
	if (!id || !user || !title || !text || typeof completed !== "boolean") {
		return res.status(400).json({ message: "all fields required" });
	}

	const note = await Note.findById(id).exec();

	if (!note) {
		return res.status(400).json({ message: "note not found" });
	}

	// find dupe
	const duplicate = await Note.findOne({ title }).lean().exec();

	// allow update to original note
	if (duplicate && duplicate?._id.toString() !== id) {
		return res.status(409).json({ message: "duplicate note title" });
	}

	note.user = user;
	note.title = title;
	note.text = text;
	note.completed = completed;

	const updatedNote = await note.save();

	res.json({ message: `${updatedNote.title} updated` });
});

//@desc delete note
//@route DELETE /notes
//@access private
const deleteNote = asyncHandler(async (req, res) => {
	const { id } = req.body;

	// confirm data
	if (!id) {
		return res.status(400).json({ message: "note id required" });
	}

	// find note
	const note = await Note.findById(id).exec();

	if (!note) {
		return res.status(400).json({ message: "note not found" });
	}

	const result = await note.deleteOne();

	const reply = `note ${result.title} with id ${result._id} deleted`;

	res.json(reply);
});

module.exports = {
	getAllNotes,
	createNewNote,
	updateNote,
	deleteNote,
};
