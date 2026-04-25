import { useState, useEffect, memo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import queryString from "query-string";

import { jwt, useSettingsStore, useSnackbar } from "../utils/index.js";
import api from "../api/index.js";

const Auth = () => {
	const location = useLocation();
	const { error: error_ } = useSnackbar();
	const defaultDashboard = useSettingsStore((s) => s.settings.defaultDashboard);
	const [redirectTo, setRedirectTo] = useState(defaultDashboard);

	useEffect(() => {
		try {
			setRedirectTo((p) => JSON.parse(sessionStorage.getItem("redirectTo")) || p || defaultDashboard);
			sessionStorage.removeItem("redirectTo");
		} catch { /** empty */ }
	}, [defaultDashboard]);

	const [state, setState] = useState({ user: null, error: null });
	const [error, setError] = useState(queryString.parse(location.search)?.error || null);

	useEffect(() => {
		let isMounted = true;

		(async () => {
			try {
				const { token, error: err } = queryString.parse(location.search);
				if (error) {
					setError(err);
				} else {
					if (token) jwt.setToken(token);
					const usr = await api.get("user/attempt-auth/");
					if (isMounted) setState({ user: usr });
				}
			} catch {
				error_();
			}
		})();

		return () => { isMounted = false; };
	}, [error, error_, location.search]);

	if (error) return (<Navigate replace to="/" state={{ error }} />);
	if (!state.user) return <div />;
	return state.user.ok ? <Navigate replace to={redirectTo} /> : <Navigate replace to="/" />;
};

export default memo(Auth);
