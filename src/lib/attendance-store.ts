// Mock attendance module for Teacher > Mis Alumnos.
//
// The Session Report engine that will record real attendance (Present /
// Delayed / Absent-with-cause / Cancelled / No Show) is not built yet in
// the Teacher Panel, so we synthesize deterministic-looking counts from
// the student id. When the real engine lands, replace `attendanceFor`
// with a query over completed sessions using the exact same bucketing:
//
//   - present            → status = "completed"                (present)
//   - late               → status = "delayed"                  (late)
//   - absentOrNoShow     → status ∈ {"absent","no_show"} with cause = "student"
//                          OR status = "cancelled" with cause = "student"
//
// Teacher-caused absences are intentionally excluded from the student's
// attendance metric.

export interface StudentAttendance {
  present: number;
  late: number;
  absentOrNoShow: number;
}

export function attendanceFor(studentId: string): StudentAttendance {
  let h = 0;
  for (let i = 0; i < studentId.length; i++) h = (h * 31 + studentId.charCodeAt(i)) | 0;
  const seed = Math.abs(h);
  const present = 6 + (seed % 9);         // 6-14
  const late = (seed >> 2) % 5;           // 0-4
  const absentOrNoShow = (seed >> 5) % 6; // 0-5
  return { present, late, absentOrNoShow };
}

export function attendanceTotal(a: StudentAttendance): number {
  return a.present + a.late + a.absentOrNoShow;
}

export function attendancePct(a: StudentAttendance): number {
  const t = attendanceTotal(a);
  return t === 0 ? 0 : Math.round((a.present / t) * 100);
}

/** Glow trigger: more Late+Absent than Present. */
export function attendanceAlert(a: StudentAttendance): boolean {
  return a.late + a.absentOrNoShow > a.present;
}