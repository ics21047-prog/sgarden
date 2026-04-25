import { memo, useEffect, useState } from "react";
import { Grid, Typography, Divider, Paper, Alert, Box, MenuItem, FormControlLabel, Switch } from "@mui/material";

import Input from "../components/Input.js";
import { SecondaryBackgroundButton } from "../components/Buttons.js";
import { useSettingsStore, useSnackbar } from "../utils/index.js";

const pageSizeOptions = [5, 10, 20, 50];
const dashboardOptions = ["/dashboard", "/dashboard1", "/dashboard2"];
const dateFormatOptions = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

const Settings = () => {
	const { success: showSuccess } = useSnackbar();
	const settings = useSettingsStore((s) => s.settings);
	const saveSettings = useSettingsStore((s) => s.saveSettings);
	const [formState, setFormState] = useState(settings);
	const [alert, setAlert] = useState(null);

	useEffect(() => {
		setFormState(settings);
	}, [settings]);

	const handleSave = () => {
		saveSettings(formState);
		setAlert({ type: "success", message: "Settings saved." });
		showSuccess("Settings saved.");
	};

	return (
		<Grid
			data-testid="settings-page"
			container
			display="flex"
			direction="column"
			alignItems="center"
			py={4}
			px={2}
		>
			<Grid item width="100%" maxWidth="700px">
				<Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
					<Typography variant="h6" fontWeight="bold" color="primary.main" mb={2}>
						Preferences
					</Typography>
					<Divider sx={{ mb: 3 }} />
					<Grid container spacing={2}>
						<Grid item xs={12} sm={6}>
							<Input
								select
								label="Default page size"
								value={formState.pageSize}
								onChange={(event) => setFormState((prev) => ({ ...prev, pageSize: Number(event.target.value) }))}
								inputProps={{ "data-testid": "settings-page-size" }}
							>
								{pageSizeOptions.map((option) => (
									<MenuItem key={option} value={option}>{option}</MenuItem>
								))}
							</Input>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Input
								select
								label="Default dashboard"
								value={formState.defaultDashboard}
								onChange={(event) => setFormState((prev) => ({ ...prev, defaultDashboard: event.target.value }))}
								inputProps={{ "data-testid": "settings-default-dashboard" }}
							>
								{dashboardOptions.map((option) => (
									<MenuItem key={option} value={option}>{option.replace("/", "")}</MenuItem>
								))}
							</Input>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Input
								select
								label="Date format"
								value={formState.dateFormat}
								onChange={(event) => setFormState((prev) => ({ ...prev, dateFormat: event.target.value }))}
								inputProps={{ "data-testid": "settings-date-format" }}
							>
								{dateFormatOptions.map((option) => (
									<MenuItem key={option} value={option}>{option}</MenuItem>
								))}
							</Input>
						</Grid>
						<Grid item xs={12} sm={6} display="flex" alignItems="center">
							<FormControlLabel
								control={(
									<Switch
										checked={formState.sidebarCollapsed}
										onChange={(event) => setFormState((prev) => ({ ...prev, sidebarCollapsed: event.target.checked }))}
										inputProps={{ "data-testid": "settings-sidebar-collapsed" }}
									/>
								)}
								label="Sidebar collapsed by default"
							/>
						</Grid>
					</Grid>
					{alert && (
						<Alert severity={alert.type} sx={{ mt: 2 }}>
							{alert.message}
						</Alert>
					)}
					<Box display="flex" justifyContent="flex-end" mt={2}>
						<Box data-testid="settings-save-button" display="inline-flex">
							<SecondaryBackgroundButton
								id="settings-save-button"
								title="Save Settings"
								width="150px"
								onClick={handleSave}
							/>
						</Box>
					</Box>
				</Paper>
			</Grid>
		</Grid>
	);
};

export default memo(Settings);
