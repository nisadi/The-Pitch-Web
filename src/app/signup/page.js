"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./signup.module.css";
import { motion } from "framer-motion";

import {
    User,
    Mail,
    Phone,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
} from "lucide-react";

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);

    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 },
    };
    return (
        <div className={styles.container}>
            <motion.div {...fadeInUp} className={styles.card}>
                {/* LEFT */}
                <div className={styles.leftSide}>
                    <div className={styles.brand}>THE PITCH</div>

                    <h1>JOIN THE CLUB</h1>

                    <p>
                        Create your athlete account and unlock premium field access.
                    </p>
                </div>

                {/* RIGHT */}
                <div className={styles.rightSide}>
                    <h2>SIGN UP</h2>

                    <div className={styles.formGroup}>
                        <label>FULL NAME</label>

                        <div className={styles.inputWrapper}>
                            <User size={18} />
                            <input type="text" placeholder="Enter full name" />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>EMAIL ADDRESS</label>

                        <div className={styles.inputWrapper}>
                            <Mail size={18} />
                            <input type="email" placeholder="Enter email" />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>PHONE NUMBER</label>

                        <div className={styles.inputWrapper}>
                            <Phone size={18} />
                            <input type="text" placeholder="Enter phone number" />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>PASSWORD</label>

                        <div className={styles.inputWrapper}>
                            <Lock size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create password"
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

                    <button className={styles.signupBtn}>
                        CREATE ACCOUNT
                        <ArrowRight size={18} />
                    </button>
                    <p className={styles.bottomText}>
                        Already have an account?
                        <Link href="/login"> Login</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}