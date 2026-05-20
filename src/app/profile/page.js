"use client";

import React from "react";
import Link from "next/link";
import styles from "./profile.module.css";
import { motion } from "framer-motion";

import {
    Mail,
    Phone,
    Pencil,
    LogOut,
    ShieldCheck,
    User,
} from "lucide-react";
export default function ProfilePage() {
    const [profile, setProfile] = React.useState({
        name: "Alex Harrison",
        email: "alex.harrison@stadium.club",
        phone: "+94 77 128 3567",
        badge: "GOLD MEMBER",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    });

    React.useEffect(() => {
        try {
            const stored = localStorage.getItem("athleteProfile");
            if (stored) {
                setProfile(JSON.parse(stored));
            } else {
                localStorage.setItem("athleteProfile", JSON.stringify(profile));
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const bookings = [
        {
            id: 1,
            title: "Main Arena - Field 2",
            date: "Oct 24, 2024",
            time: "19:00 - 21:00",
            price: "Rs. 3000.00",
            image:
                "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1200&auto=format&fit=crop",
        },
        {
            id: 2,
            title: "Practice Court A",
            date: "Oct 20, 2024",
            time: "17:00 - 18:30",
            price: "Rs. 2000.00",
            image:
                "https://images.unsplash.com/photo-1547347298-4074fc3086f0?q=80&w=1200&auto=format&fit=crop",
        },
        {
            id: 3,
            title: "North Wing - Court 4",
            date: "Oct 15, 2024",
            time: "20:00 - 21:00",
            price: "Rs. 5000.00",
            image:
                "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1200&auto=format&fit=crop",
        },
    ];

    const fadeInUp = {
        initial: { opacity: 0, y: 25 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.5 },
    };

    return (
        <div className={styles.container}>
            {/* HEADER */}
            <motion.div {...fadeInUp} className={styles.header}>
                <h1>ATHLETE PROFILE</h1>
                <p>Manage your membership and field access.</p>
            </motion.div>

            {/* MAIN GRID */}
            <div className={styles.mainGrid}>
                {/* LEFT PROFILE CARD */}
                <motion.div {...fadeInUp} className={styles.profileCard}>
                    <div className={styles.profileTop}>
                        <div className={styles.avatarWrapper}>
                            {profile.avatar ? (
                                <img
                                    src={profile.avatar}
                                    alt="Profile"
                                    className={styles.avatar}
                                />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    <User size={48} />
                                </div>
                            )}
                        </div>

                        <div className={styles.memberBadge}>{profile.badge}</div>

                        <h2>{profile.name}</h2>

                        <p className={styles.username}>
                            {profile.email}
                        </p>
                    </div>

                    {/* CONTACT */}
                    <div className={styles.contactBox}>
                        <Mail size={16} />
                        <span>{profile.email}</span>
                    </div>

                    <div className={styles.contactBox}>
                        <Phone size={16} />
                        <span>{profile.phone}</span>
                    </div>

                    {/* BUTTONS */}
                    <Link href="/profile/edit" className={styles.editBtn} style={{ textDecoration: 'none' }}>
                        <Pencil size={15} />
                        EDIT PROFILE
                    </Link>

                    <button className={styles.logoutBtn}>
                        <LogOut size={15} />
                        LOGOUT
                    </button>


                </motion.div>

                {/* RIGHT CONTENT */}
                <div className={styles.rightContent}>
                    {/* BOOKING HISTORY */}
                    <motion.div {...fadeInUp} className={styles.historyCard}>
                        <div className={styles.historyHeader}>
                            <h3>RECENT BOOKING HISTORY</h3>

                            <Link href="#">VIEW ALL</Link>
                        </div>

                        <div className={styles.bookingList}>
                            {bookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    className={styles.bookingItem}
                                >
                                    <img
                                        src={booking.image}
                                        alt={booking.title}
                                        className={styles.bookingImage}
                                    />

                                    <div className={styles.bookingInfo}>
                                        <h4>{booking.title}</h4>

                                        <p>
                                            {booking.date} | {booking.time}
                                        </p>

                                        <span>
                                            <ShieldCheck size={12} />
                                            COMPLETED
                                        </span>
                                    </div>

                                    <div className={styles.bookingPrice}>
                                        {booking.price}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>


                </div>
            </div>
        </div>
    );
}