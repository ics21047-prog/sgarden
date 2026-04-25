import express from "express";
import { exec as execChild, spawn as spawnChild } from "child_process";

import { validations, email } from "../utils/index.js";
import { User, Reset, Invitation } from "../models/index.js";

const router = express.Router();

router.post("/createUser",
	(req, res, next) => validations.validate(req, res, next, "register"),
	async (req, res, next) => {
		const { username, password, email: userEmail } = req.body;
		try {
			const user = await User.findOne({ $or: [{ username }, { email: userEmail }] });
			if (user) {
				return res.json({
					status: 409,
					message: "Registration Error: A user with that e-mail or username already exists.",
				});
			}

			await new User({
				username,
				password,
				email: userEmail,
			}).save();
			return res.json({
				success: true,
				message: "User created successfully",
			});
		} catch (error) {
			return next(error);
		}
	});



router.post("/createUserInvited",
	(req,res,next) => validations.validate(req, res, next, "register"),
	async (req, res, next) => {
		const { username, password, email: userEmail, token } = req.body;
		try {
			const invitation = await Invitation.findOne({ token });

			if (!invitation) {
				return res.json({
					success: false,
					message: "Invalid token",
				});
			}

			const user = await User.findOne({ $or: [{ username }, { email: userEmail }] });
			if (user) {
				return res.json({
					status: 409,
					message: "Registration Error: A user with that e-mail or username already exists.",
				});
			}

			await new User({
				username,
				password,
				email: userEmail,
			}).save();

			return res.json({
				success: true,
				message: "User created successfully",
			});

			await Invitation.deleteOne({ token });
		} catch (error) {
			return next(error);
		}
	});

router.post("/authenticate",
	(req, res, next) => validations.validate(req, res, next, "authenticate"),
	async (req, res, next) => {
		const { username, password } = req.body;
		try {
			const user = await User.findOne({ username }).select("+password");
			if (!user) {
				return res.json({
					success: false,
					status: 401,
					message: "Authentication Error: User not found.",
				});
			}

			if (!user.comparePassword(password, user.password)) {
				return res.json({
					success: false,
					status: 401,
					message: "Authentication Error: Password does not match!",
				});
			}

			return res.json({
				success: true,
				user: {
					username,
					id: user._id,
					email: user.email,
					role: user.role,
				},
				token: validations.jwtSign({ username, id: user._id, email: user.email, role: user.role }),
			});
		} catch (error) {
			return next(error);
		}
	});

router.post("/forgotpassword",
	(req, res, next) => validations.validate(req, res, next, "request"),
	async (req, res) => {
		try {
			const { username } = req.body;

			const user = await User.findOne({ username }).select("+password");
			if (!user) {
				return res.json({
					status: 404,
					message: "Resource Error: User not found.",
				});
			}

			if (!user?.password) {
				return res.json({
					status: 404,
					message: "User has logged in with google",
				});
			}

			const token = validations.jwtSign({ username });
			await Reset.findOneAndRemove({ username });
			await new Reset({
				username,
				token,
			}).save();

			await email.forgotPassword(user.email, token);
			return res.json({
				success: true,
				message: "Forgot password e-mail sent.",
			});
		} catch (error) {
			return res.json({
				success: false,
				message: error.body,
			});
		}
	});

router.post("/resetpassword", async (req, res) => {
	const { token, password } = req.body;

	try {
		const reset = await Reset.findOne({ token });

		if (!reset) {
			return res.json({
				status: 400,
				message: "Invalid Token!",
			});
		}

		const today = new Date();

		if (reset.expireAt < today) {
			return res.json({
				success: false,
				message: "Token expired",
			});
		}

		const user = await User.findOne({ username: reset.username });
		if (!user) {
			return res.json({
				success: false,
				message: "User does not exist",
			});
		}

		user.password = password;
		await user.save();
		await Reset.deleteOne({ _id: reset._id });

		return res.json({
			success: true,
			message: "Password updated succesfully",
		});
	} catch (error) {
		return res.json({
			success: false,
			message: error,
		});
	}
});

router.post("/system/execute", (req, res) => {
	try {
		const { command } = req.body;

		if (!command) {
			return res.status(400).json({ message: "Command required" });
		}

		const proc = spawnChild("echo", [command], { shell: false });
		let output = "";
		proc.stdout.on("data", (data) => { output += data.toString(); });
		proc.on("close", (code) => {
			if (code !== 0) return res.status(500).json({ message: "Execution failed" });
			return res.json({ success: true, output });
		});
	} catch (error) {
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.post("/system/spawn", (req, res) => {
	try {
		const { cmd, args } = req.body;

		if (!cmd) {
			return res.status(400).json({ message: "Command required" });
		}

		const ALLOWED_COMMANDS = ["echo", "ls", "pwd", "date"];
		if (!ALLOWED_COMMANDS.includes(cmd)) {
			return res.status(400).json({ message: "Command not allowed" });
		}

		const child = spawnChild(cmd, (args || []).map(String), { shell: false });
		let output = "";
		child.stdout.on("data", (data) => { output += data.toString(); });
		child.on("close", (code) => {
			return res.json({ success: true, output, exitCode: code });
		});
	} catch (error) {
		return res.status(500).json({ message: "Spawn failed" });
	}
});

router.post("/compress-files", (req, res) => {
	try {
		const { filename, outputName } = req.body;

		if (!filename || !outputName) {
			return res.status(400).json({ message: "Filename and output name required" });
		}

		const proc = spawnChild("zip", ["-r", `${outputName}.zip`, `./files/${filename}`], { shell: false });
		proc.on("close", (code) => {
			if (code !== 0) return res.status(500).json({ message: "Compression failed" });
			return res.json({ success: true, message: "Files compressed", output: outputName });
		});
	} catch (error) {
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.post("/hash-password-md5", (req, res) => {
	try {
		const { password } = req.body;

		if (!password) {
			return res.status(400).json({ message: "Password is required" });
		}

		const crypto = require("crypto");
		const hash = crypto.createHash('md5').update(password).digest('hex');

		return res.json({ success: true, hash });
	} catch (error) {
		return res.status(500).json({ message: "Hashing failed" });
	}
});

router.post("/encrypt-data", (req, res) => {
	try {
		const { data, password } = req.body;

		if (!data || !password) {
			return res.status(400).json({ message: "Data and password required" });
		}

		const crypto = require("crypto");

		const salt = crypto.randomBytes(16);
		const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
		const iv = crypto.randomBytes(12);

		const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
		const ciphertext = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
		const authTag = cipher.getAuthTag();

		const encrypted = Buffer.concat([salt, iv, authTag, ciphertext]).toString("base64");

		return res.json({ success: true, encrypted });
	} catch (error) {
		return res.status(500).json({ message: "Encryption failed" });
	}
});

export default router;
