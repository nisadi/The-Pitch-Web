import styles from "./Admin.module.css";

export default function AdminStatsGrid({ stats, loading = false }) {
  return (
    <div className={styles.statsGrid}>
      {stats.map((stat) => (
        <div key={stat.label} className={styles.statCard}>
          <label>{stat.label}</label>
          <strong>{loading ? "…" : stat.value}</strong>
        </div>
      ))}
    </div>
  );
}
