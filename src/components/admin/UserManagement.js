"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleHelp, MailPlus, RotateCcw } from "lucide-react";
import { getAdminUser } from "./adminSession";
import { useAdminSettings } from "./settings/adminSettingsContext";
import { useUsers } from "@/lib/users/usersContext";
import {
  roleCanInvite,
  roleCanManageUsers,
  USER_ROLES,
  USER_STATUSES,
} from "@/lib/users/usersDefaults";
import AdminStatsGrid from "./AdminStatsGrid";
import InviteUserModal from "./InviteUserModal";
import styles from "./UserManagement.module.css";

const ROLE_FILTER_OPTIONS = [
  { id: "all", label: "All roles" },
  { id: "admin", label: "Admin" },
  { id: "manager", label: "Manager" },
  { id: "staff", label: "Staff" },
];

const STATUS_FILTER_OPTIONS = [
  { id: "all", label: "All statuses" },
  { id: "active", label: "Active" },
  { id: "invited", label: "Invited" },
  { id: "disabled", label: "Disabled" },
];

export default function UserManagement() {
  const { locations } = useAdminSettings();
  const { users, inviteUser, updateUser, removeUser, resendInvite } = useUsers();

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rolesHelpOpen, setRolesHelpOpen] = useState(false);
  const rolesHelpRef = useRef(null);

  useEffect(() => {
    if (!rolesHelpOpen) return undefined;

    const handlePointerDown = (event) => {
      if (
        rolesHelpRef.current &&
        !rolesHelpRef.current.contains(event.target)
      ) {
        setRolesHelpOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setRolesHelpOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [rolesHelpOpen]);

  const currentUser = getAdminUser();
  const currentRole = USER_ROLES[currentUser.role]
    ? currentUser.role
    : "admin";
  const canInvite = roleCanInvite(currentRole);
  const canManage = roleCanManageUsers(currentRole);

  const activeLocations = useMemo(
    () => locations.filter((l) => l.status === "active"),
    [locations]
  );

  const filteredUsers = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (statusFilter !== "all" && user.status !== statusFilter) return false;

      if (!search) return true;

      const haystack = [user.name, user.email, user.role, user.locations.join(" ")]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === "active");
    const invited = users.filter((u) => u.status === "invited");
    const admins = users.filter((u) => u.role === "admin");

    return [
      { label: "Total users", value: String(users.length) },
      { label: "Active", value: String(active.length) },
      { label: "Pending invites", value: String(invited.length) },
      { label: "Admins", value: String(admins.length) },
    ];
  }, [users]);

  const handleInvite = (payload) => inviteUser(payload);

  const handleRoleChange = (user, newRole) => {
    if (!canManage) return;
    if (user.email === currentUser.email && newRole !== "admin") {
      window.alert("You cannot remove your own admin access.");
      return;
    }
    updateUser(user.id, { role: newRole });
  };

  const handleStatusToggle = (user) => {
    if (!canManage) return;
    if (user.email === currentUser.email) {
      window.alert("You cannot disable your own account.");
      return;
    }

    const nextStatus = user.status === "disabled" ? "active" : "disabled";
    updateUser(user.id, { status: nextStatus });
  };

  const handleDelete = (user) => {
    if (!canManage) return;
    if (user.email === currentUser.email) {
      window.alert("You cannot delete your own account.");
      return;
    }

    if (window.confirm(`Remove user "${user.name}"?`)) {
      removeUser(user.id);
    }
  };

  const handleReset = () => {
    setRoleFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
  };

  return (
    <div className={styles.page}>
      <div className={styles.rolesHelp} ref={rolesHelpRef}>
        {rolesHelpOpen && (
          <div
            className={styles.rolesHelpPopover}
            role="dialog"
            aria-label="Role descriptions"
          >
            <p className={styles.rolesHelpTitle}>User roles</p>
            <ul className={styles.rolesHelpList}>
              {Object.entries(USER_ROLES).map(([id, role]) => (
                <li key={id} className={styles.rolesHelpItem}>
                  <span
                    className={styles.rolesHelpLabel}
                    style={{ color: role.color }}
                  >
                    {role.label}
                  </span>
                  <p>{role.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="button"
          className={styles.rolesHelpBtn}
          onClick={() => setRolesHelpOpen((open) => !open)}
          aria-expanded={rolesHelpOpen}
          aria-label="What do user roles mean?"
          title="Role guide"
        >
          <CircleHelp size={22} />
        </button>
      </div>

      {!canInvite && (
        <p className={styles.notice}>
          You are signed in as <strong>{USER_ROLES[currentRole].label}</strong>.
          Only admins can invite new team members.
        </p>
      )}

      <div className={styles.filtersBlock}>
        <AdminStatsGrid stats={stats} />

        <div className={styles.toolbar}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="user-role-filter">
            Role
          </label>
          <select
            id="user-role-filter"
            className={styles.select}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {ROLE_FILTER_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="user-status-filter">
            Status
          </label>
          <select
            id="user-status-filter"
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={`${styles.field} ${styles.fieldGrow}`}>
          <label className={styles.label} htmlFor="user-search">
            Search
          </label>
          <input
            id="user-search"
            type="search"
            className={styles.input}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Name, email, location..."
          />
        </div>

        <div className={styles.toolbarActions}>
          <button type="button" className={styles.resetBtn} onClick={handleReset}>
            <RotateCcw size={16} />
            Reset
          </button>
          {canInvite && (
            <button
              type="button"
              className={styles.inviteBtn}
              onClick={() => setInviteOpen(true)}
            >
              <MailPlus size={16} />
              Invite member
            </button>
          )}
        </div>
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Team members</h3>
            <p>
              {filteredUsers.length} user
              {filteredUsers.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <p className={styles.empty}>No users match your filters.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Locations</th>
                  <th>Status</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const role = USER_ROLES[user.role];
                  const status = USER_STATUSES[user.status];
                  const isSelf = user.email === currentUser.email;

                  return (
                    <tr key={user.id}>
                      <td>
                        {user.name}
                        {isSelf && (
                          <span className={styles.meta}>You</span>
                        )}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <select
                          className={styles.roleSelect}
                          value={user.role}
                          disabled={!canManage || isSelf}
                          onChange={(e) =>
                            handleRoleChange(user, e.target.value)
                          }
                          style={{
                            borderColor: `${role.color}55`,
                            color: role.color,
                          }}
                        >
                          {Object.entries(USER_ROLES).map(([id, r]) => (
                            <option key={id} value={id}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={styles.locations}>
                        {user.locations.length > 0
                          ? user.locations.join(", ")
                          : "All locations"}
                      </td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            color: status.color,
                            background: `${status.color}22`,
                          }}
                        >
                          {status.label}
                        </span>
                      </td>
                      {canManage && (
                        <td>
                          <div className={styles.actions}>
                            {user.status === "invited" && (
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => {
                                  resendInvite(user.id);
                                  window.alert(`Invite resent to ${user.email}`);
                                }}
                              >
                                Resend
                              </button>
                            )}
                            {!isSelf && (
                              <>
                                <button
                                  type="button"
                                  className={styles.actionBtn}
                                  onClick={() => handleStatusToggle(user)}
                                >
                                  {user.status === "disabled"
                                    ? "Enable"
                                    : "Disable"}
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                  onClick={() => handleDelete(user)}
                                >
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canInvite && (
        <InviteUserModal
          open={inviteOpen}
          locations={activeLocations}
          onClose={() => setInviteOpen(false)}
          onInvite={handleInvite}
        />
      )}
    </div>
  );
}
