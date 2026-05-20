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
import { getSession, signOut } from "@/services/auth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = React.useState({
        name: "",
        email: "",
        phone: "",
        badge: "GOLD MEMBER",
        avatar: ""
    });
    const [bookings, setBookings] = React.useState([]);

    React.useEffect(() => {
        const loadProfile = async () => {
            const { session } = await getSession();
            if (session) {
                const user = session.user;
                setProfile({
                    name: user.user_metadata?.full_name || "Athlete",
                    email: user.email,
                    phone: user.user_metadata?.phone_number || "",
                    badge: "GOLD MEMBER",
                    avatar: user.user_metadata?.avatar_url || ""
                });

                // Fetch bookings
                const { data } = await supabase
                    .from('bookings')
                    .select('*, sports(name), locations(name)')
                    .eq('user_id', user.id)
                    .order('booking_date', { ascending: false });

                if (data) {
                    setBookings(data.map(b => ({
                        id: b.id,
                        title: `${b.locations?.name || 'Arena'} - ${b.sports?.name || 'Sport'}`,
                        date: new Date(b.booking_date).toLocaleDateString(),
                        time: `${b.start_time} - ${b.end_time}`,
                        price: `Rs. ${b.total_amount}.00`,
                        image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1200&auto=format&fit=crop",
                    })));
                }
            } else {
                router.push('/login');
            }
        };
        loadProfile();
    }, [router]);

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    // Bookings mapped dynamically

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

                    <button className={styles.logoutBtn} onClick={handleLogout}>
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