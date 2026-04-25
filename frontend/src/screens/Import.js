import { memo, useMemo, useRef, useState } from "react";
import {
	Grid,
	Typography,
	Paper,
	Box,
	Button,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Alert,
} from "@mui/material";

const parseCsv = (content) => {
	const lines = content
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
	if (lines.length === 0) return { headers: [], rows: [] };

	const headers = lines[0].split(",").map((header) => header.trim());
	const rows = lines.slice(1).map((line, index) => {
		const cells = line.split(",").map((cell) => cell.trim());
		return { index, cells };
	});

	return { headers, rows };
};

const validateRows = (headers, rows) => rows.map((row) => {
	const errors = [];
	if (row.cells.length !== headers.length) {
		errors.push("Column count does not match header.");
	}
	if (row.cells.some((cell) => cell.length === 0)) {
		errors.push("Contains empty value.");
	}
	return { ...row, errors };
});

const Import = () => {
	const fileInputReference = useRef(null);
	const [fileName, setFileName] = useState("");
	const [headers, setHeaders] = useState([]);
	const [rows, setRows] = useState([]);
	const [summary, setSummary] = useState(null);
	const [dragOver, setDragOver] = useState(false);

	const rowCount = rows.length;
	const errorRows = useMemo(() => rows.filter((row) => row.errors.length > 0), [rows]);
	const validRows = useMemo(() => rows.filter((row) => row.errors.length === 0), [rows]);

	const resetState = () => {
		setFileName("");
		setHeaders([]);
		setRows([]);
		setSummary(null);
		if (fileInputReference.current) fileInputReference.current.value = "";
	};

	const loadFile = async (file) => {
		if (!file) return;
		const text = await file.text();
		const parsed = parseCsv(text);
		const validated = validateRows(parsed.headers, parsed.rows);

		setFileName(file.name);
		setHeaders(parsed.headers);
		setRows(validated);
		setSummary(null);
	};

	const handleInputChange = async (event) => {
		const file = event.target.files?.[0];
		await loadFile(file);
	};

	const handleDrop = async (event) => {
		event.preventDefault();
		setDragOver(false);
		const file = event.dataTransfer.files?.[0];
		await loadFile(file);
	};

	const handleSubmit = () => {
		setSummary({
			inserted: validRows.length,
			skipped: errorRows.length,
		});
	};

	return (
		<Grid data-testid="import-page" container direction="column" alignItems="center" py={3} px={2}>
			<Grid item width="100%" maxWidth="960px">
				<Paper elevation={2} sx={{ p: 3 }}>
					<Typography variant="h6" color="primary.main" fontWeight="bold" mb={2}>
						Bulk Data Import
					</Typography>

					<Box
						data-testid="import-dropzone"
						onClick={() => fileInputReference.current?.click()}
						onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
						onDragLeave={() => setDragOver(false)}
						onDrop={handleDrop}
						sx={{
							border: "2px dashed",
							borderColor: dragOver ? "secondary.main" : "grey.500",
							borderRadius: 2,
							p: 3,
							textAlign: "center",
							cursor: "pointer",
							backgroundColor: dragOver ? "rgba(0,0,0,0.04)" : "transparent",
						}}
					>
						<input
							ref={fileInputReference}
							type="file"
							accept=".csv,text/csv"
							data-testid="import-file-input"
							style={{ display: "none" }}
							onChange={handleInputChange}
						/>
						<Typography>Drag and drop CSV here, or click to browse</Typography>
						{fileName && (
							<Typography data-testid="import-file-name" color="secondary.main" mt={1}>
								{fileName}
							</Typography>
						)}
					</Box>

					{rows.length > 0 && (
						<Box mt={3}>
							<Table size="small" data-testid="import-preview-table">
								<TableHead>
									<TableRow>
										{headers.map((header) => <TableCell key={header}><b>{header}</b></TableCell>)}
									</TableRow>
								</TableHead>
								<TableBody>
									{rows.map((row, index) => (
										<TableRow
											key={`row-${index}`}
											data-testid={row.errors.length > 0 ? `import-error-row-${index}` : `import-preview-row-${index}`}
											sx={row.errors.length > 0 ? { backgroundColor: "rgba(255, 0, 0, 0.08)" } : {}}
										>
											{headers.map((_, cellIndex) => (
												<TableCell key={`cell-${index}-${cellIndex}`}>
													{row.cells[cellIndex] || "—"}
												</TableCell>
											))}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Box>
					)}

					{errorRows.length > 0 && (
						<Alert data-testid="import-error-message" severity="error" sx={{ mt: 2 }}>
							{`${errorRows.length} row(s) have validation issues and will be skipped.`}
						</Alert>
					)}

					<Box display="flex" justifyContent="flex-end" gap={1.5} mt={3}>
						<Button data-testid="import-cancel" variant="outlined" color="secondary" onClick={resetState}>
							Cancel
						</Button>
						<Button
							data-testid="import-submit"
							variant="contained"
							color="secondary"
							disabled={rowCount === 0}
							onClick={handleSubmit}
						>
							Import
						</Button>
					</Box>

					{summary && (
						<Alert data-testid="import-summary" severity="success" sx={{ mt: 2 }}>
							{`Imported ${summary.inserted} row(s). Skipped ${summary.skipped} row(s).`}
						</Alert>
					)}
				</Paper>
			</Grid>
		</Grid>
	);
};

export default memo(Import);
