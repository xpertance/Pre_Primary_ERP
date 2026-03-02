/** Safe escape for a single CSV cell value */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/"/g, '""');
  // Wrap in quotes if contains comma, newline or quote
  return /[,"\n]/.test(str) ? `"${str}"` : str;
}

/** Download a CSV string as a file */
function downloadCSV(csv: string, filename: string) {
  const BOM = "\uFEFF"; // UTF-8 BOM so Excel opens it correctly
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Flatten a student record into a plain object with readable columns.
 * Nested arrays (parents, medical.allergies, pickupInfo) are expanded
 * into individual columns instead of raw JSON.
 */
function flattenStudent(s: any) {
  // Primary parent (index 0)
  const p0 = s.parents?.[0] || {};
  // Secondary parent (index 1)
  const p1 = s.parents?.[1] || {};
  // Only first pickup person
  const pu0 = s.pickupInfo?.[0] || {};

  return {
    "Admission No": s.admissionNo || "",
    "First Name": s.firstName || "",
    "Last Name": s.lastName || "",
    "Gender": s.gender || "",
    "Date of Birth": s.dob ? new Date(s.dob).toLocaleDateString() : "",
    "Email": s.email || "",
    "Class": typeof s.classId === "object" ? (s.classId?.name || "") : (s.classId || ""),
    "Section": typeof s.classId === "object" ? (s.classId?.section || "") : "",
    "Admission Date": s.admissionDate ? new Date(s.admissionDate).toLocaleDateString() : "",
    "Parent 1 Name": p0.name || "",
    "Parent 1 Relation": p0.relation || "",
    "Parent 1 Phone": p0.phone || "",
    "Parent 1 Email": p0.email || "",
    "Parent 2 Name": p1.name || "",
    "Parent 2 Relation": p1.relation || "",
    "Parent 2 Phone": p1.phone || "",
    "Parent 2 Email": p1.email || "",
    "Pickup Person": pu0.name || "",
    "Pickup Phone": pu0.phone || "",
    "Pickup Relation": pu0.relation || "",
    "Allergies": (s.medical?.allergies || []).join("; "),
    "Medical Notes": s.medical?.notes || "",
    "Address": s.address || "",
    "Blood Group": s.bloodGroup || "",
  };
}

/**
 * Export a list of students as a clean, human-readable CSV.
 * Nested fields are flattened into individual columns.
 */
export function exportStudentsToCSV(students: any[], filename = "students.csv") {
  if (!students?.length) {
    alert("No student data to export.");
    return;
  }

  const rows = students.map(flattenStudent);
  const headers = Object.keys(rows[0]);

  const csv = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => headers.map((h) => escapeCSV(row[h as keyof typeof row])).join(",")),
  ].join("\n");

  downloadCSV(csv, filename);
}

/**
 * Generic CSV export — works for flat data (classes, teachers, events, etc.)
 * Objects are JSON-stringified if they can't be flattened automatically.
 */
export function exportToCSV(data: any[], filename = "export.csv") {
  const rows = data || [];

  if (!rows.length) {
    alert("No data to export.");
    return;
  }

  // Collect all top-level keys
  const keys = rows.reduce((acc: string[], row) => {
    Object.keys(row).forEach((k) => {
      if (!acc.includes(k)) acc.push(k);
    });
    return acc;
  }, []);

  const csv = [
    keys.map(escapeCSV).join(","),
    ...rows.map((row) =>
      keys
        .map((k) => {
          const v = row[k];
          if (v === null || v === undefined) return "";
          if (typeof v === "object") return escapeCSV(JSON.stringify(v));
          return escapeCSV(String(v));
        })
        .join(",")
    ),
  ].join("\n");

  downloadCSV(csv, filename);
}

export function exportToJSON(data: any[], filename = "export.json") {
  const blob = new Blob([JSON.stringify(data || [], null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const exportUtils = { exportToCSV, exportStudentsToCSV, exportToJSON };
export default exportUtils;