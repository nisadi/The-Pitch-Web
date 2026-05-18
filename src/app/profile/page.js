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
    Calendar,
    ShieldCheck,
    BadgeCheck,
} from "lucide-react";

export default function ProfilePage() {
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
                            <img
                                src="https://randomuser.me/api/portraits/men/32.jpg"
                                alt="Profile"
                                className={styles.avatar}
                            />
                        </div>

                        <div className={styles.memberBadge}>GOLD MEMBER</div>

                        <h2>Alex Harrison</h2>

                        <p className={styles.username}>
                            alex.harrison@stadium.club
                        </p>
                    </div>

                    {/* CONTACT */}
                    <div className={styles.contactBox}>
                        <Mail size={16} />
                        <span>alex.harrison@stadium.club</span>
                    </div>

                    <div className={styles.contactBox}>
                        <Phone size={16} />
                        <span>+94 77 128 3567</span>
                    </div>

                    {/* BUTTONS */}
                    <button className={styles.editBtn}>
                        <Pencil size={15} />
                        EDIT PROFILE
                    </button>

                    <button className={styles.logoutBtn}>
                        <LogOut size={15} />
                        LOGOUT
                    </button>

                    {/* STATS */}
                    <div className={styles.statsCard}>
                        <span className={styles.statsLabel}>
                            LIFETIME STATS
                        </span>

                        <div className={styles.statsGrid}>
                            <div>
                                <h3>42</h3>
                                <p>TOTAL BOOKINGS</p>
                            </div>

                            <div>
                                <h3>180h</h3>
                                <p>PITCH TIME</p>
                            </div>
                        </div>
                    </div>
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

                    {/* BOTTOM CARDS */}
                    <div className={styles.bottomCards}>
                        <motion.div
                            {...fadeInUp}
                            className={styles.perksCard}
                        >
                            <div className={styles.cardTop}>
                                <BadgeCheck size={18} />
                                <span>ACTIVE</span>
                            </div>

                            <h3>Gold Perks</h3>

                            <ul>
                                <li>18% Discount on all bookings</li>
                                <li>24h Early access to field reservations</li>
                                <li>Free lockers and towels</li>
                            </ul>
                        </motion.div>

                        <motion.div
                            {...fadeInUp}
                            className={styles.sessionCard}
                        >
                            <Calendar size={18} />

                            <h3>Next Session</h3>

                            <p>
                                You have a session coming up in 2 days at main
                                arena.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}