import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";

import { jwt, useSettingsStore } from "../utils/index.js";

const GuestOnly = ({ c }) => {
	const location = useLocation();
	const defaultDashboard = useSettingsStore((s) => s.settings.defaultDashboard);
	return jwt.isAuthenticated()
		? <Navigate to={defaultDashboard} state={{ from: location }} />
		: c;
};

GuestOnly.propTypes = { c: PropTypes.node.isRequired };
GuestOnly.whyDidYouRender = true;

export default GuestOnly;
