import { create } from "zustand";

const STORAGE_KEY = "sgarden-settings";

export const DEFAULT_SETTINGS = {
	pageSize: 10,
	defaultDashboard: "/dashboard",
	dateFormat: "DD/MM/YYYY",
	sidebarCollapsed: false,
};

const loadInitial = () => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_SETTINGS;
		return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
	} catch {
		return DEFAULT_SETTINGS;
	}
};

const useSettingsStore = create((setState) => ({
	settings: loadInitial(),
	saveSettings: (next) => setState(() => {
		const merged = { ...DEFAULT_SETTINGS, ...next };
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
		} catch { /* localStorage unavailable */ }
		return { settings: merged };
	}),
	updateSetting: (key, value) => setState((state) => {
		const merged = { ...state.settings, [key]: value };
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
		} catch { /* localStorage unavailable */ }
		return { settings: merged };
	}),
}));

export default useSettingsStore;
