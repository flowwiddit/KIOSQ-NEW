"use client";

import { motion } from "framer-motion";

export function HeroMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
