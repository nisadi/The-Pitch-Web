"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleHelp, Eye, EyeOff, MailPlus, RotateCcw } from "lucide-react";
import { getAdminUser } from "./adminSession";
import { useUsers } from "@/lib/users/usersContext";
import {
  roleCanInvite,
  roleCanManageUsers,
  OWNER_EMAIL,
  USER_STATUSES,
} from "@/lib/users/usersDefaults";
import AdminStatsGrid from "./AdminStatsGrid";
import InviteUserModal from "./InviteUserModal";
import styles from "./UserManagement.module.css";


const STATUS_FILTER_OPTIONS = [
  { id: "all", label: "All statuses" },
  { id: "active", label: "Active" },
  { id: "disabled", label: "Disabled" },
];

export default function UserManagement() {
  const {
    ready,
    syncError,
    users,
    roles,
    rolesById,
    inviteUser,
    updateUser,
    removeUser,
  } = useUsers();

  const roleFilterOptions = useMemo(
    () => [
      { id: "all", label: "All roles" },
      ...roles.map((role) => ({ id: role.id, label: role.label })),
    ],
    [roles]
  );

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rolesHelpOpen, setRolesHelpOpen] = useState(false);
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [passwordVisible, setPasswordVisible] = useState({});
  const [passwordEditing, setPasswordEditing] = useState({});
  const [passwordSavingId, setPasswordSavingId] = useState(null);
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
  const currentRoleId = rolesById[currentUser.roleId ?? currentUser.role]
    ? (currentUser.roleId ?? currentUser.role)
    : "admin";
  const canInvite = roleCanInvite(currentRoleId);
  const canManage = roleCanManageUsers(currentRoleId);

  const filteredUsers = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter !== "all" && user.roleId !== roleFilter) return false;
      if (statusFilter !== "all" && user.status !== statusFilter) return false;

      if (!search) return true;

      const haystack = [
        user.name,
        user.email,
        user.roleId,
        rolesById[user.roleId]?.label ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [users, roleFilter, statusFilter, searchQuery, rolesById]);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === "active");
    const disabled = users.filter((u) => u.status === "disabled");
    const admins = users.filter((u) => u.roleId === "admin");

    return [
      { label: "Total users", value: String(users.length) },
      { label: "Active", value: String(active.length) },
      { label: "Disabled", value: String(disabled.length) },
      { label: "Admins", value: String(admins.length) },
    ];
  }, [users]);

  const handleInvite = async (payload) => inviteUser(payload);

  const handleRoleChange = (user, newRole) => {
    if (!canManage) return;
    if (user.email === currentUser.email && newRole !== "admin") {
      window.alert("You cannot remove your own admin access.");
      return;
    }
    updateUser(user.id, { roleId: newRole });
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

  const handlePasswordDraft = (userId, value) => {
    setPasswordDrafts((prev) => ({ ...prev, [userId]: value }));
  };

  const togglePasswordVisible = (userId) => {
    setPasswordVisible((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const startPasswordEdit = (user) => {
    setPasswordEditing((prev) => ({ ...prev, [user.id]: true }));
    setPasswordDrafts((prev) => ({
      ...prev,
      [user.id]: user.displayPassword ?? "",
    }));
    setPasswordVisible((prev) => ({ ...prev, [user.id]: false }));
  };

  const cancelPasswordEdit = (userId) => {
    setPasswordEditing((prev) => ({ ...prev, [userId]: false }));
    setPasswordDrafts((prev) => ({ ...prev, [userId]: "" }));
    setPasswordVisible((prev) => ({ ...prev, [userId]: false }));
  };

  const handlePasswordSave = async (user) => {
    const nextPassword = passwordDrafts[user.id]?.trim() ?? "";
    if (nextPassword.length < 8) {
      window.alert("Password must be at least 8 characters.");
      return;
    }

    if (
      !window.confirm(
        `Update password for ${user.name}? They will need the new password to sign in.`
      )
    ) {
      return;
    }

    setPasswordSavingId(user.id);
    try {
      await updateUser(user.id, {
        password: nextPassword,
        displayPassword: nextPassword,
      });
      setPasswordEditing((prev) => ({ ...prev, [user.id]: false }));
      setPasswordDrafts((prev) => ({ ...prev, [user.id]: "" }));
      setPasswordVisible((prev) => ({ ...prev, [user.id]: false }));
    } finally {
      setPasswordSavingId(null);
    }
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
              {roles.map((role) => (
                <li key={role.id} className={styles.rolesHelpItem}>
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
          You are signed in as{" "}
          <strong>{rolesById[currentRoleId]?.label ?? "Staff"}</strong>.
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
            {roleFilterOptions.map((option) => (
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
            placeholder="Name or email..."
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
              {!ready
                ? "Loading from Supabase…"
                : `${filteredUsers.length} user${filteredUsers.length === 1 ? "" : "s"}`}
            </p>
            {syncError && (
              <p className={styles.syncError}>{syncError}</p>
            )}
          </div>
        </div>

        {!ready ? (
          <p className={styles.empty}>Syncing with Supabase…</p>
        ) : filteredUsers.length === 0 ? (
          <p className={styles.empty}>No users match your filters.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Password</th>
                  <th>Status</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const role = rolesById[user.roleId];
                  const status = USER_STATUSES[user.status];
                  const isSelf = user.email === currentUser.email;
                  const isOwner = user.email === OWNER_EMAIL;

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
                          value={user.roleId}
                          disabled={!canManage || isSelf}
                          onChange={(e) =>
                            handleRoleChange(user, e.target.value)
                          }
                          style={{
                            borderColor: `${role?.color ?? "#6b7280"}55`,
                            color: role?.color ?? "#6b7280",
                          }}
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {canManage ? (
                          (() => {
                            const isEditing = Boolean(passwordEditing[user.id]);
                            const stored = user.displayPassword ?? "";
                            const isVisible = Boolean(passwordVisible[user.id]);
                            const draft = passwordDrafts[user.id] ?? "";

                            const displayValue = isEditing ? draft : stored;

                            return (
                              <div className={styles.passwordCell}>
                                <input
                                  type="text"
                                  className={[
                                    styles.passwordInput,
                                    !isVisible && displayValue
                                      ? styles.passwordInputMasked
                                      : "",
                                    !isEditing && isVisible && displayValue
                                      ? styles.passwordInputVisible
                                      : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                  value={displayValue}
                                  onChange={(e) =>
                                    isEditing &&
                                    handlePasswordDraft(
                                      user.id,
                                      e.target.value
                                    )
                                  }
                                  readOnly={!isEditing}
                                  placeholder={
                                    isEditing
                                      ? "Min. 8 characters"
                                      : stored
                                        ? ""
                                        : "••••••••"
                                  }
                                  minLength={isEditing ? 8 : undefined}
                                  autoComplete="new-password"
                                  spellCheck={false}
                                />
                                {!isOwner && (
                                  <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => togglePasswordVisible(user.id)}
                                    aria-label={
                                      isVisible
                                        ? "Hide password"
                                        : "Show password"
                                    }
                                    title={
                                      isVisible
                                        ? "Hide password"
                                        : "Show password"
                                    }
                                  >
                                    {isVisible ? (
                                      <EyeOff size={16} />
                                    ) : (
                                      <Eye size={16} />
                                    )}
                                  </button>
                                )}
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      className={styles.passwordSaveBtn}
                                      disabled={
                                        passwordSavingId === user.id ||
                                        draft.trim().length < 8
                                      }
                                      onClick={() => handlePasswordSave(user)}
                                    >
                                      {passwordSavingId === user.id
                                        ? "Saving…"
                                        : "Save"}
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.passwordCancelBtn}
                                      disabled={passwordSavingId === user.id}
                                      onClick={() =>
                                        cancelPasswordEdit(user.id)
                                      }
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : !isOwner && (
                                  <button
                                    type="button"
                                    className={styles.passwordEditBtn}
                                    onClick={() => startPasswordEdit(user)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <span className={styles.passwordMasked}>••••••••</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            color: isOwner ? "var(--primary)" : status.color,
                            background: isOwner
                              ? "rgba(163, 255, 0, 0.16)"
                              : `${status.color}22`,
                          }}
                        >
                          {isOwner ? "superadmin" : status.label}
                        </span>
                      </td>
                      {canManage && (
                        <td>
                          <div className={styles.actions}>
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
          roles={roles}
          onClose={() => setInviteOpen(false)}
          onInvite={handleInvite}
        />
      )}
    </div>
  );
}
