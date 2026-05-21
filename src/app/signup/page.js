"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./signup.module.css";
import { motion } from "framer-motion";
import { signUp } from "@/services/auth";

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
    const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", password: "" });
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setLoading(true);

        const { user, error: signUpError, adminCreated } = await signUp(
            formData.email,
            formData.password,
            formData.fullName,
            formData.phone
        );

        if (signUpError) {
            if (signUpError.message.includes("rate limit")) {
                setError("Email rate limit exceeded. Please try again later or copy your Supabase service_role key to .env.local to bypass verification.");
            } else {
                setError(signUpError.message);
            }
            setLoading(false);
        } else {
            if (adminCreated) {
                setSuccessMsg("Account created and verified! Logging you in...");
                setLoading(false);
                setTimeout(() => {
                    window.location.href = "/";
                }, 1500);
            } else {
                setSuccessMsg("Signup successful! Please check your email to confirm your account before logging in.");
                setLoading(false);
                setTimeout(() => {
                    router.push("/login");
                }, 5000);
            }
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
                {/* LEFT */}
                <div className={styles.leftSide}>
                    <div className={styles.brand}>THE PITCH</div>

                    <h1>JOIN THE CLUB</h1>

                    <p>
                        Create your athlete account and unlock premium field access.
                    </p>
                </div>

                {/* RIGHT */}
                <form className={styles.rightSide} onSubmit={handleSubmit}>
                    <h2>SIGN UP</h2>

                    {error && <p className={styles.errorMsg} style={{color: 'red', fontSize: '14px', marginBottom: '10px'}}>{error}</p>}
                    {successMsg && <p className={styles.successMsg} style={{color: '#00d289', fontSize: '14px', marginBottom: '10px'}}>{successMsg}</p>}

                    <div className={styles.formGroup}>
                        <label>FULL NAME</label>

                        <div className={styles.inputWrapper}>
                            <User size={18} />
                            <input type="text" name="fullName" placeholder="Enter full name" value={formData.fullName} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>EMAIL ADDRESS</label>

                        <div className={styles.inputWrapper}>
                            <Mail size={18} />
                            <input type="email" name="email" placeholder="Enter email" value={formData.email} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>PHONE NUMBER</label>

                        <div className={styles.inputWrapper}>
                            <Phone size={18} />
                            <input type="text" name="phone" placeholder="Enter phone number" value={formData.phone} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>PASSWORD</label>

                        <div className={styles.inputWrapper}>
                            <Lock size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Create password"
                                value={formData.password}
                                onChange={handleChange}
                                required
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

                    <button type="submit" className={styles.signupBtn} disabled={loading}>
                        {loading ? "CREATING..." : "CREATE ACCOUNT"}
                        <ArrowRight size={18} />
                    </button>
                    <p className={styles.bottomText}>
                        Already have an account?
                        <Link href="/login"> Login</Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}