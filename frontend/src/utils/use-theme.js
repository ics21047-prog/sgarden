import { create } from "zustand";

const STORAGE_KEY = "sgarden-dark";

const useThemeStore = create((setState) => ({
	isDark: localStorage.getItem(STORAGE_KEY) === "true",
	toggleDark: () => setState((s) => {
		const next = !s.isDark;
		localStorage.setItem(STORAGE_KEY, String(next));
		return { isDark: next };
	}),
}));

export default useThemeStore;
