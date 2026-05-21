import styles from "./Admin.module.css";

export default function AdminPanel({ title, children }) {
  return (
    <section className={styles.panel}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
