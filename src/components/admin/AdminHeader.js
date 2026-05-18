import styles from "./Admin.module.css";

export default function AdminHeader({ title, description }) {
  return (
    <header className={styles.header}>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  );
}
