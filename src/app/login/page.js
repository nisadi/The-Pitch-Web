"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./login.module.css";
import { motion } from "framer-motion";

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

    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 },
    };

    return (
        <div className={styles.container}>
            <motion.div {...fadeInUp} className={styles.card}>
                {/* LEFT SIDE */}
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

                {/* RIGHT SIDE */}
                <div className={styles.rightSide}>
                    <h2>LOGIN</h2>

                    <div className={styles.formGroup}>
                        <label>EMAIL ADDRESS</label>

                        <div className={styles.inputWrapper}>
                            <Mail size={18} />

                            <input
                                type="email"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>PASSWORD</label>

                        <div className={styles.inputWrapper}>
                            <Lock size={18} />

                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
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

                    <button className={styles.loginBtn}>
                        LOGIN
                        <ArrowRight size={18} />
                    </button>

                    <p className={styles.bottomText}>
                        Don&apos;t have an account?
                        <Link href="/signup"> Sign Up</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}