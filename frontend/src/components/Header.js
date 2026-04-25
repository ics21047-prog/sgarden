import { useState, useMemo, useEffect, useRef, memo } from "react";
import { styled } from "@mui/material/styles";
import {
	AppBar,
	Toolbar,
	Typography,
	Menu,
	MenuItem,
	IconButton,
	Button,
	Paper,
	Breadcrumbs,
	Box,
	Switch,
	Dialog,
	DialogTitle,
	DialogContent,
	TextField,
	List,
	ListSubheader,
	ListItemButton,
	ListItemText,
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
	ExpandMore,
	MoreVert as MoreIcon,
	AccountCircle as AccountCircleIcon,
	Settings as SettingsIcon,
	Search as SearchIcon,
	Close as CloseIcon,
	WbSunny,
	DarkMode,
} from "@mui/icons-material";
import { makeStyles } from "@mui/styles";
import { Image } from "mui-image";

import { getUsersData } from "../api/index.js";
import { jwt, capitalize, useThemeStore } from "../utils/index.js";
import logo from "../assets/images/logo.png";
import { ReactComponent as LogoutIcon } from "../assets/images/logout.svg";

const RECENT_SEARCHES_STORAGE_KEY = "sgarden-global-search-recent";
const MAX_RECENT_SEARCHES = 5;
const sanitizeCategory = (category) => category.toLowerCase().replaceAll(/\s+/g, "-");
const sanitizeId = (id) => String(id).replaceAll(/[^a-zA-Z0-9-_]/g, "-");

const useStyles = makeStyles((theme) => ({
	grow: {
		flexGrow: 1,
		flexBasis: "auto",
		background: theme.palette.background.paper,
		zIndex: 1200,
		height: "70px",
	},
	root: {
		height: "30px",
		padding: theme.spacing(0.5),
		borderRadius: "0px",
		background: theme.palette.mode === "dark"
			? theme.palette.background.default
			: theme.palette.grey.main,
	},
	icon: {
		marginRight: 0.5,
		width: 20,
		height: 20,
	},
	expanded: {
		background: "transparent",
	},
	innerSmallAvatar: {
		color: theme.palette.common.black,
		fontSize: "inherit",
	},
	anchorOriginBottomRightCircular: {
		".MuiBadge-anchorOriginBottomRightCircular": {
			right: 0,
			bottom: 0,
		},
	},
	avatar: {
		width: "30px",
		height: "30px",
		background: "white",
	},
	iconButton: {
		padding: "3px 6px",
	},
	menuItemButton: {
		width: "100%",
		bgcolor: "grey.light",
		"&:hover": {
			bgcolor: "grey.dark",
		},
	},
	grey: {
		color: "grey.500",
	},
	svgIcon: {
		width: "100%",
		height: "100%",
		"& g": {
			"& path": {
				fill: theme.palette.secondary.main,
			},
		},
	},
}));

const ButtonWithText = ({ text, icon, more, handler, dataTestId }) => (
	<Button data-testid={dataTestId} sx={{ height: "100%", display: "flex", flexDirection: "column", p: 1, mx: 1 }} onClick={(event) => handler(event)}>
		<div style={{ width: "100%", height: "100%" }}>
			{icon}
		</div>
		<Typography align="center" color="secondary.main" fontSize="small" fontWeight="bold" display="flex" alignItems="center" sx={{ textTransform: "capitalize" }}>
			{text}
			{more && <ExpandMore />}
		</Typography>
	</Button>
);

const Header = ({ isAuthenticated }) => {
	const classes = useStyles();

	const location = useLocation();
	const navigate = useNavigate();
	const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
	const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [usersForSearch, setUsersForSearch] = useState([]);
	const [recentSearches, setRecentSearches] = useState([]);
	const searchInputReference = useRef(null);

	const isDark = useThemeStore((s) => s.isDark);
	const toggleDark = useThemeStore((s) => s.toggleDark);

	const handleMobileMenuClose = () => setMobileMoreAnchorEl(null);
	const handleMobileMenuOpen = (event) => setMobileMoreAnchorEl(event.currentTarget);
	const handleOpenGlobalSearch = () => setSearchOpen(true);
	const handleCloseGlobalSearch = () => {
		setSearchOpen(false);
		setSearchQuery("");
	};

	useEffect(() => {
		try {
			const storedRecent = JSON.parse(localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY) || "[]");
			if (Array.isArray(storedRecent)) setRecentSearches(storedRecent);
		} catch { /* empty */ }
	}, []);

	useEffect(() => {
		if (!isAuthenticated) return;
		if (!jwt.isAdmin()) return;

		(async () => {
			try {
				const { success, users } = await getUsersData();
				if (success) {
					setUsersForSearch(users.map((user) => ({
						id: user._id,
						title: user.username,
						description: user.email,
						path: "/users",
						category: "Users",
					})));
				}
			} catch { /* empty */ }
		})();
	}, [isAuthenticated]);

	useEffect(() => {
		if (!searchOpen) return;
		searchInputReference.current?.focus();
	}, [searchOpen]);

	useEffect(() => {
		const onKeyDown = (event) => {
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setSearchOpen(true);
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	const CrumpLink = styled(Link)(({ theme }) => ({ display: "flex", color: theme.palette.third.main }));

	const buttons = [
		{
			icon: <AccountCircleIcon sx={{ color: "secondary.main", width: "100%", height: "100%" }} />,
			text: "Profile",
			handler: () => navigate("/profile"),
			dataTestId: "profile-nav-link",
		},
		{
			icon: <SettingsIcon sx={{ color: "secondary.main", width: "100%", height: "100%" }} />,
			text: "Settings",
			handler: () => navigate("/settings"),
			dataTestId: "settings-nav-link",
		},
		{
			icon: <LogoutIcon className={classes.svgIcon} />,
			text: "Logout",
			handler: () => {
				jwt.destroyToken();
				navigate("/");
			},
		},
	];

	const renderMobileMenu = (
		<Menu
			keepMounted
			anchorEl={mobileMoreAnchorEl}
			anchorOrigin={{ vertical: "top", horizontal: "right" }}
			transformOrigin={{ vertical: "top", horizontal: "right" }}
			open={isMobileMenuOpen}
			onClose={handleMobileMenuClose}
		>
			{buttons.map((button) => (
				<MenuItem key={button.text} data-testid={button.dataTestId} onClick={button.handler}>
					<Image src={button.icon} width="20px" sx={{ fill: "third" }} />
					<p style={{ marginLeft: "5px" }}>{button.text}</p>
					{button.more && <ExpandMore />}
				</MenuItem>
			))}
		</Menu>
	);

	const pathnames = location.pathname.split("/").filter(Boolean);
	const crumps = [];
	const staticEntities = useMemo(() => [
		{ id: "dashboard", title: "Overview Dashboard", path: "/dashboard", category: "Dashboards" },
		{ id: "dashboard1", title: "Analytics Dashboard", path: "/dashboard1", category: "Dashboards" },
		{ id: "dashboard2", title: "Insights Dashboard", path: "/dashboard2", category: "Dashboards" },
		{ id: "profile", title: "Profile", path: "/profile", category: "Pages" },
		{ id: "settings", title: "Settings", path: "/settings", category: "Pages" },
		{ id: "map", title: "Map", path: "/map", category: "Pages" },
		...(jwt.isAdmin() ? [{ id: "users", title: "Users", path: "/users", category: "Pages" }] : []),
	], []);

	const groupedSearchResults = useMemo(() => {
		const source = [...staticEntities, ...usersForSearch];
		const normalizedQuery = searchQuery.trim().toLowerCase();

		const filtered = normalizedQuery
			? source.filter((entry) =>
				`${entry.title} ${entry.description || ""} ${entry.category}`.toLowerCase().includes(normalizedQuery))
			: [];

		return filtered.reduce((accumulator, result) => {
			accumulator[result.category] ||= [];
			accumulator[result.category].push(result);
			return accumulator;
		}, {});
	}, [searchQuery, staticEntities, usersForSearch]);

	const selectSearchResult = (result) => {
		navigate(result.path);

		const newRecent = [
			result,
			...recentSearches.filter((search) => search.id !== result.id || search.path !== result.path),
		].slice(0, MAX_RECENT_SEARCHES);

		setRecentSearches(newRecent);
		try {
			localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(newRecent));
		} catch { /* empty */ }

		handleCloseGlobalSearch();
	};

	for (const [ind, path] of pathnames.entries()) {
		let text = capitalize(path);
		crumps.push(<CrumpLink to={`/${pathnames.slice(0, ind + 1).join("/")}`}>{text}</CrumpLink>);
	}

	return (
		<>
			<AppBar id="header" position="static" className={classes.grow}>
				<Toolbar className="header-container">
					<Box component={Link} to="/">
						<Image src={logo} alt="Logo" sx={{ p: 0, my: 0, height: "100%", maxWidth: "200px" }} />
					</Box>
					<Box className={classes.grow} style={{ height: "100%" }} />

					{/* Dark mode toggle — always visible */}
					<Box sx={{ display: "flex", alignItems: "center", px: 1 }}>
						{isAuthenticated && (
							<IconButton data-testid="global-search-trigger" color="secondary" onClick={handleOpenGlobalSearch}>
								<SearchIcon />
							</IconButton>
						)}
						{isDark
							? <DarkMode data-testid="theme-indicator-dark" sx={{ color: "secondary.main", mr: 0.5 }} />
							: <WbSunny data-testid="theme-indicator-light" sx={{ color: "secondary.main", mr: 0.5 }} />}
						<Switch
							data-testid="dark-mode-toggle"
							checked={isDark}
							onChange={toggleDark}
							size="small"
							color="secondary"
						/>
					</Box>

					{isAuthenticated
					&& (
						<>
							<Box sx={{ display: { xs: "none", sm: "none", md: "flex" }, height: "100%", py: 1 }}>
								{buttons.map((button) => (
									<ButtonWithText
										key={button.text}
										icon={button.icon}
										text={button.text}
										handler={button.handler}
										more={button.more}
										dataTestId={button.dataTestId}
									/>
								))}
							</Box>
							<Box sx={{ display: { xs: "flex", sm: "flex", md: "none" } }}>
								<IconButton color="primary" onClick={handleMobileMenuOpen}><MoreIcon /></IconButton>
							</Box>
						</>
					)}
				</Toolbar>
			</AppBar>
			{isAuthenticated
			&& (
				<Paper elevation={0} className={classes.root}>
					<Breadcrumbs className="header-container">{crumps.map((e, ind) => <div key={`crump_${ind}`}>{e}</div>)}</Breadcrumbs>
				</Paper>
			)}
			{isAuthenticated
			&& (
				<>
					{renderMobileMenu}
					<Dialog
						open={searchOpen}
						onClose={handleCloseGlobalSearch}
						fullWidth
						maxWidth="sm"
						PaperProps={{ "data-testid": "global-search-dialog" }}
					>
						<DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							Global Search
							<IconButton data-testid="global-search-close" onClick={handleCloseGlobalSearch}>
								<CloseIcon />
							</IconButton>
						</DialogTitle>
						<DialogContent>
							<TextField
								inputRef={searchInputReference}
								fullWidth
								placeholder="Search users, dashboards, pages..."
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								inputProps={{ "data-testid": "global-search-input" }}
							/>
							{searchQuery.trim().length === 0
								? (
									<Box data-testid="global-search-recent" mt={2}>
										<Typography variant="subtitle2" mb={1}>Recent searches</Typography>
										{recentSearches.length === 0 && (
											<Typography variant="body2" color="text.secondary">No recent searches.</Typography>
										)}
										{recentSearches.map((item, index) => (
											<ListItemButton
												key={`${item.id}-${index}`}
												data-testid={`global-search-recent-item-${index}`}
												onClick={() => selectSearchResult(item)}
											>
												<ListItemText primary={item.title} secondary={item.category} />
											</ListItemButton>
										))}
									</Box>
								)
								: (
									<Box data-testid="global-search-results" mt={2}>
										{Object.keys(groupedSearchResults).length === 0 && (
											<Typography data-testid="global-search-no-results" variant="body2" color="text.secondary">
												No results found.
											</Typography>
										)}
										{Object.entries(groupedSearchResults).map(([category, entries]) => (
											<List
												key={category}
												subheader={(
													<ListSubheader data-testid={`global-search-category-${sanitizeCategory(category)}`}>
														{category}
													</ListSubheader>
												)}
											>
												{entries.map((result) => {
													const resultId = sanitizeId(result.id);
													return (
														<ListItemButton
															key={`${result.id}-${result.path}`}
															data-testid={`global-search-result-${resultId}`}
															onClick={() => selectSearchResult(result)}
														>
															<ListItemText
																primary={(
																	<span data-testid={`global-search-result-title-${resultId}`}>
																		{result.title}
																	</span>
																)}
																secondary={result.description || result.path}
															/>
														</ListItemButton>
													);
												})}
											</List>
										))}
									</Box>
								)}
						</DialogContent>
					</Dialog>
				</>
			)}
		</>
	);
};

export default memo(Header);
