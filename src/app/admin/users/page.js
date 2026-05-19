import UserManagement from "@/components/admin/UserManagement";

export const metadata = {
  title: "Users | Admin",
  description: "Manage team members, roles, and invitations.",
};

export default function AdminUsersPage() {
  return <UserManagement />;
}
