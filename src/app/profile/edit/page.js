"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./edit.module.css";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  ArrowLeft,
  Save,
  X,
  Sparkles,
  Camera,
  Upload,
  Trash2,
} from "lucide-react";
import { getSession } from "@/services/auth";
import { supabase } from "@/lib/supabase";

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    badge: "GOLD MEMBER",
    avatar: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = React.useRef(null);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const { session } = await getSession();
        if (session) {
          const user = session.user;
          setProfile({
            name: user.user_metadata?.full_name || "",
            email: user.email || "",
            phone: user.user_metadata?.phone_number || "",
            badge: "GOLD MEMBER",
            avatar: user.user_metadata?.avatar_url || ""
          });
        } else {
          router.push("/login");
        }
      } catch (e) {
        console.error("Error loading profile:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Please select an image smaller than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setProfile((prev) => ({ ...prev, avatar: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveSuccess(false);

    try {
      const { session } = await getSession();
      if (!session) {
        alert("Session expired. Please log in again.");
        router.push("/login");
        return;
      }

      const user = session.user;
      const updates = {
        data: {
          full_name: profile.name,
          phone_number: profile.phone,
          avatar_url: profile.avatar,
        }
      };

      // Only update email if it actually changed
      if (profile.email && profile.email !== user.email) {
        updates.email = profile.email;
      }

      const { data, error } = await supabase.auth.updateUser(updates);

      if (error) {
        alert("Error updating profile: " + error.message);
        setIsLoading(false);
        return;
      }

      setSaveSuccess(true);
      setIsLoading(false);
      setTimeout(() => {
        router.push("/profile");
      }, 1000);
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("An unexpected error occurred while saving your profile.");
      setIsLoading(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <motion.div {...fadeInUp} className={styles.header}>
        <Link href="/profile" className={styles.backLink}>
          <ArrowLeft size={16} /> BACK TO PROFILE
        </Link>
        <h1>EDIT ATHLETE PROFILE</h1>
        <p>Modify your account credentials and custom athlete card details.</p>
      </motion.div>

      {/* MAIN CONTAINER */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.profileBox}
      >
        {saveSuccess && (
          <div className={styles.successMessage}>
            <Sparkles size={18} />
            <span>Profile saved successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          {/* LEFT: AVATAR CARD */}
          <div className={styles.avatarCol}>
            <div className={styles.avatarCard}>
              <div
                className={styles.avatarPreviewWrapper}
                onClick={triggerFileSelect}
                title="Click to upload profile photo"
              >
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Athlete Avatar"
                    className={styles.avatarPreview}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <User size={48} />
                  </div>
                )}

                <div className={styles.avatarHoverOverlay}>
                  <Camera size={18} />
                  <span>CHANGE PHOTO</span>
                </div>

                <div className={styles.cameraIcon}>
                  <Camera size={13} />
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
              />

              <div className={styles.badgeWrapper}>
                <span className={`${styles.badge} ${styles[profile.badge ? profile.badge.toLowerCase().replace(" ", "") : "basicmember"]}`}>
                  {profile.badge || "BASIC MEMBER"}
                </span>
              </div>

              {/* Interactive Profile Controls */}
              <div className={styles.avatarActions}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={triggerFileSelect}
                >
                  <Upload size={13} />
                  <span>Upload Image</span>
                </button>

                {profile.avatar && (
                  <button
                    type="button"
                    className={styles.actionBtnDanger}
                    onClick={handleRemoveAvatar}
                  >
                    <Trash2 size={13} />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: ACCOUNT DETAILS FORM */}
          <div className={styles.detailsCol}>
            <h3 className={styles.sectionTitle}>Account Credentials</h3>

            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.fieldLabel}>FULL NAME</label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.fieldIcon} />
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                  className={styles.formInput}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.fieldLabel}>EMAIL ADDRESS</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.fieldIcon} />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter email address"
                  className={styles.formInput}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.fieldLabel}>PHONE NUMBER</label>
              <div className={styles.inputWrapper}>
                <Phone size={18} className={styles.fieldIcon} />
                <input
                  id="phone"
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  required
                  placeholder=" श्रीलंका code / local (+94 ...)"
                  className={styles.formInput}
                />
              </div>
            </div>


            {/* BUTTON ACTION GROUP */}
            <div className={styles.btnGroup}>
              <button
                type="submit"
                disabled={isLoading}
                className={styles.saveBtn}
              >
                <Save size={16} />
                {isLoading ? "SAVING..." : "SAVE CHANGES"}
              </button>

              <Link href="/profile" className={styles.cancelBtn}>
                <X size={16} />
                CANCEL
              </Link>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
