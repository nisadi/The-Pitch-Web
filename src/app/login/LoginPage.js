"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { loginUser } from "@/services/auth";
import {
    canAccessAdminPath,
    getDefaultAdminRoute,
} from "@/components/admin/adminNav";
import { setAdminSession } from "@/components/admin/adminSession";
import styles from "./login.module.css";

import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const [error, setError] = useState(
        searchParams.get("error") === "disabled"
            ? "Your account has been disabled. Contact an administrator."
            : ""
    );

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await loginUser(formData.email, formData.password);

            if (result.error) {
                setError(result.error.message || "Could not sign in.");
                setLoading(false);
                return;
            }

            if (result.isAdmin) {
                // Admin / Manager / Staff — store session, route to admin
                setAdminSession(result.user);

                const next = searchParams.get("next");
                let destination = getDefaultAdminRoute(result.roleId);
                if (
                    next &&
                    next.startsWith("/admin") &&
                    canAccessAdminPath(result.roleId, next)
                ) {
                    destination = next;
                }

                router.replace(destination);
            } else {
                // Regular customer
                router.push("/");
            }
        } catch (err) {
            setError(err?.message ?? "Could not sign in.");
        } finally {
            setLoading(false);
        }
    };

    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 },
    };

    return (
        <div className={styles.container}>
            <motion.div {...fadeInUp} className={styles.card}>
                {/* LEFT SIDE — Branding */}
                <div className={styles.leftSide}>
                    <div className={styles.brand}>THE PITCH</div>

                    <h1>WELCOME BACK</h1>

                    <p>
                        Access your bookings, memberships and training sessions.
                    </p>

                    <div className={styles.featureBox}>
                        <ShieldCheck size={18} />
                        Secure athlete login experience
                    </div>
                </div>

                {/* RIGHT SIDE — Form */}
                <form className={styles.rightSide} onSubmit={handleSubmit}>
                    <h2>LOGIN</h2>

                    {error && (
                        <p className={styles.errorMsg}>{error}</p>
                    )}

                    <div className={styles.formGroup}>
                        <label>EMAIL ADDRESS</label>

                        <div className={styles.inputWrapper}>
                            <Mail size={18} />

                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>PASSWORD</label>

                        <div className={styles.inputWrapper}>
                            <Lock size={18} />

                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                autoComplete="current-password"
                            />

                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className={styles.rowBetween}>
                        <label className={styles.checkbox}>
                            <input type="checkbox" />
                            Remember me
                        </label>
                        <Link href="#">Forgot Password?</Link>
                    </div>

                    <button type="submit" className={styles.loginBtn} disabled={loading}>
                        {loading ? "LOGGING IN..." : "LOGIN"}
                        <ArrowRight size={18} />
                    </button>

                    <p className={styles.bottomText}>
                        Don&apos;t have an account?
                        <Link href="/signup"> Sign Up</Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
