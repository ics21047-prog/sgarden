import { memo, useCallback, useEffect, useState } from "react";
import { Grid, Typography, Divider, Paper, Alert, Box, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import Input from "../components/Input.js";
import Spinner from "../components/Spinner.js";
import { SecondaryBackgroundButton, SecondaryBorderButton } from "../components/Buttons.js";
import { useSettingsStore, useSnackbar, dayjs } from "../utils/index.js";
import { getMyProfile, updateMyProfile, changeMyPassword } from "../api/index.js";

const Profile = () => {
	const { success: showSuccess, error: showError } = useSnackbar();
	const dateFormat = useSettingsStore((s) => s.settings.dateFormat);
	const [isLoading, setIsLoading] = useState(false);
	const [editMode, setEditMode] = useState(false);

	const [profile, setProfile] = useState({
		username: "",
		email: "",
		role: "",
		createdAt: "",
		lastActiveAt: "",
	});

	const [editUsername, setEditUsername] = useState("");
	const [editEmail, setEditEmail] = useState("");

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const [infoAlert, setInfoAlert] = useState(null);
	const [pwAlert, setPwAlert] = useState(null);

	const fetchProfile = useCallback(async () => {
		setIsLoading(true);
		try {
			const { success: ok, user } = await getMyProfile();
			if (ok) {
				setProfile(user);
				setEditUsername(user.username);
				setEditEmail(user.email);
			} else {
				showError("Failed to load profile.");
			}
		} catch {
			showError("Failed to load profile.");
		}
		setIsLoading(false);
	}, [showError]);

	useEffect(() => {
		fetchProfile();
	}, [fetchProfile]);

	const handleEditCancel = () => {
		setEditUsername(profile.username);
		setEditEmail(profile.email);
		setInfoAlert(null);
		setEditMode(false);
	};

	const handleInfoSave = async () => {
		if (!editUsername.trim() || !editEmail.trim()) {
			setInfoAlert({ type: "error", message: "Username and email are required." });
			showError("Username and email are required.");
			return;
		}
		setIsLoading(true);
		try {
			const { success: ok, message } = await updateMyProfile({
				username: editUsername.trim(),
				email: editEmail.trim(),
			});
			if (ok) {
				setProfile((prev) => ({ ...prev, username: editUsername.trim(), email: editEmail.trim() }));
				setInfoAlert({ type: "success", message: message || "Profile updated successfully." });
				showSuccess(message || "Profile updated successfully.");
				setEditMode(false);
			} else {
				setInfoAlert({ type: "error", message: message || "Failed to update profile." });
				showError(message || "Failed to update profile.");
			}
		} catch {
			setInfoAlert({ type: "error", message: "Failed to update profile." });
			showError("Failed to update profile.");
		}
		setIsLoading(false);
	};

	const handlePasswordSave = async () => {
		if (!currentPassword || !newPassword || !confirmPassword) {
			setPwAlert({ type: "error", message: "All password fields are required." });
			showError("All password fields are required.");
			return;
		}
		if (newPassword !== confirmPassword) {
			setPwAlert({ type: "error", message: "New passwords do not match." });
			showError("New passwords do not match.");
			return;
		}
		setIsLoading(true);
		try {
			const { success: ok, message } = await changeMyPassword({ currentPassword, newPassword, confirmPassword });
			if (ok) {
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
				setPwAlert({ type: "success", message: message || "Password changed successfully." });
				showSuccess(message || "Password changed successfully.");
			} else {
				setPwAlert({ type: "error", message: message || "Failed to change password." });
				showError(message || "Failed to change password.");
			}
		} catch {
			setPwAlert({ type: "error", message: "Failed to change password." });
			showError("Failed to change password.");
		}
		setIsLoading(false);
	};

	const renderAlert = (alert) => {
		if (!alert) return null;
		return (
			<Alert
				severity={alert.type}
				sx={{ mt: 2 }}
				data-testid={alert.type === "success" ? "profile-success-message" : "profile-error-message"}
			>
				{alert.message}
			</Alert>
		);
	};

	return (
		<>
			<Spinner open={isLoading} />
			<Grid
				data-testid="profile-page"
				container
				display="flex"
				direction="column"
				alignItems="center"
				py={4}
				px={2}
				gap={3}
			>
				{/* ── Account Information ── */}
				<Grid item width="100%" maxWidth="700px">
					<Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
						<Typography variant="h6" fontWeight="bold" color="primary.main" mb={2}>
							Account Information
						</Typography>
						<Divider sx={{ mb: 3 }} />

						{!editMode ? (
							<>
								<Grid container spacing={2}>
									<Grid item xs={12} sm={6}>
										<Typography variant="caption" color="text.secondary">Username</Typography>
										<Typography fontWeight="bold" data-testid="profile-username">
											{profile.username}
										</Typography>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Typography variant="caption" color="text.secondary">Email</Typography>
										<Typography fontWeight="bold" data-testid="profile-email">
											{profile.email}
										</Typography>
									</Grid>
									<Grid item xs={12} sm={4}>
										<Typography variant="caption" color="text.secondary">Role</Typography>
										<Typography
											fontWeight="bold"
											sx={{ textTransform: "capitalize" }}
											data-testid="profile-role"
										>
											{profile.role}
										</Typography>
									</Grid>
									<Grid item xs={12} sm={4}>
										<Typography variant="caption" color="text.secondary">Member since</Typography>
										<Typography fontWeight="bold" data-testid="profile-created-at">
											{profile.createdAt ? dayjs(profile.createdAt).format(dateFormat) : "—"}
										</Typography>
									</Grid>
									<Grid item xs={12} sm={4}>
										<Typography variant="caption" color="text.secondary">Last active</Typography>
										<Typography fontWeight="bold" data-testid="profile-last-active">
											{profile.lastActiveAt
												? dayjs(profile.lastActiveAt).format(`${dateFormat} HH:mm`)
												: "—"}
										</Typography>
									</Grid>
								</Grid>

								{renderAlert(infoAlert)}

								<Box display="flex" justifyContent="flex-end" mt={2}>
									<Box data-testid="profile-edit-button" display="inline-flex">
										<SecondaryBorderButton
											id="profile-edit-button"
											title="Edit"
											width="120px"
											onClick={() => { setInfoAlert(null); setEditMode(true); }}
										/>
									</Box>
								</Box>
							</>
						) : (
							<>
								<Grid container spacing={2}>
									<Grid item xs={12} sm={6}>
										<Input
											id="profile-edit-username"
											label="Username"
											value={editUsername}
											onChange={(e) => setEditUsername(e.target.value)}
										/>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Input
											id="profile-edit-email"
											label="Email"
											type="email"
											value={editEmail}
											onChange={(e) => setEditEmail(e.target.value)}
										/>
									</Grid>
								</Grid>

								{renderAlert(infoAlert)}

								<Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
									<SecondaryBorderButton
										title="Cancel"
										width="120px"
										onClick={handleEditCancel}
									/>
									<Box data-testid="profile-save-button" display="inline-flex">
										<SecondaryBackgroundButton
											id="profile-save-button"
											title="Save Changes"
											width="140px"
											onClick={handleInfoSave}
										/>
									</Box>
								</Box>
							</>
						)}
					</Paper>
				</Grid>

				{/* ── Change Password ── */}
				<Grid item width="100%" maxWidth="700px">
					<Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
						<Typography variant="h6" fontWeight="bold" color="primary.main" mb={2}>
							Change Password
						</Typography>
						<Divider sx={{ mb: 3 }} />

						<Grid container spacing={2}>
							<Grid item xs={12}>
								<Input
									label="Current Password"
									type={showCurrent ? "text" : "password"}
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									inputProps={{ "data-testid": "profile-password-current" }}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												<IconButton onClick={() => setShowCurrent((v) => !v)} edge="end">
													{showCurrent ? <VisibilityOff /> : <Visibility />}
												</IconButton>
											</InputAdornment>
										),
									}}
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<Input
									label="New Password"
									type={showNew ? "text" : "password"}
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									inputProps={{ "data-testid": "profile-password-new" }}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												<IconButton onClick={() => setShowNew((v) => !v)} edge="end">
													{showNew ? <VisibilityOff /> : <Visibility />}
												</IconButton>
											</InputAdornment>
										),
									}}
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<Input
									label="Confirm New Password"
									type={showConfirm ? "text" : "password"}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									inputProps={{ "data-testid": "profile-password-confirm" }}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												<IconButton onClick={() => setShowConfirm((v) => !v)} edge="end">
													{showConfirm ? <VisibilityOff /> : <Visibility />}
												</IconButton>
											</InputAdornment>
										),
									}}
								/>
							</Grid>
						</Grid>

						{renderAlert(pwAlert)}

						<Box display="flex" justifyContent="flex-end" mt={2}>
							<Box data-testid="profile-password-save" display="inline-flex">
								<SecondaryBackgroundButton
									id="profile-save-password-button"
									title="Save Password"
									width="160px"
									onClick={handlePasswordSave}
								/>
							</Box>
						</Box>
					</Paper>
				</Grid>
			</Grid>
		</>
	);
};

export default memo(Profile);
