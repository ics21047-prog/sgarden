import express from "express";

const router = express.Router({ mergeParams: true });

router.get("/hello", (_req, res) => {
	try {
		return res.send("Hello world!");
	} catch (error) {
		return res.status(500).json({ message: "Something went wrong." });
	}
});

export default router;
