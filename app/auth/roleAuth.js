/**
 * Static in-app credentials (no backend).
 * Route names MUST match React Navigation stack screen names: Doctor | Nurse | Lab | Pharmacy
 */

export const ROLE_ROUTES = {
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  LAB: 'Lab',
  PHARMACY: 'Pharmacy',
};

/** Maps each role route to its login username and password */
export const STATIC_USERS = {
  [ROLE_ROUTES.DOCTOR]: { username: 'doctor', password: '1234' },
  [ROLE_ROUTES.NURSE]: { username: 'nurse', password: '1234' },
  [ROLE_ROUTES.LAB]: { username: 'lab', password: '1234' },
  [ROLE_ROUTES.PHARMACY]: { username: 'pharmacy', password: '1234' },
};

/**
 * Reusable role check: returns the stack route name if username/password match that role's static user.
 * @param {string} username
 * @param {string} password
 * @param {string} selectedRoleRoute - one of ROLE_ROUTES values (e.g. "Doctor")
 * @returns {{ ok: true, routeName: string } | { ok: false, message: string }}
 */
export function validateRoleLogin(username, password, selectedRoleRoute) {
  const entry = STATIC_USERS[selectedRoleRoute];
  if (!entry) {
    return { ok: false, message: 'Please select a valid role.' };
  }
  const u = (username || '').trim();
  const p = password || '';
  if (u !== entry.username || p !== entry.password) {
    return { ok: false, message: 'Invalid username or password for the selected role.' };
  }
  return { ok: true, routeName: selectedRoleRoute };
}

/** Labels for pickers / UI */
export const ROLE_OPTIONS = [
  { value: ROLE_ROUTES.DOCTOR, label: 'Doctor' },
  { value: ROLE_ROUTES.NURSE, label: 'Nurse' },
  { value: ROLE_ROUTES.LAB, label: 'Lab' },
  { value: ROLE_ROUTES.PHARMACY, label: 'Pharmacy' },
];
