"use client";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import * as React from "react";

type WithChildren = {
	children: React.ReactNode;
	className?: string;
};

// Direction-aware row entrance for chat messages
const makeRowVariants = (side: "left" | "right"): Variants => ({
	hidden: { opacity: 0, y: 10, x: side === "right" ? 10 : -10, scale: 0.98 },
	visible: {
		opacity: 1,
		y: 0,
		x: 0,
		scale: 1,
		transition: { type: "spring", stiffness: 130, damping: 22, mass: 0.6 },
	},
	exit: {
		opacity: 0,
		y: -6,
		x: 0,
		scale: 0.98,
		transition: { duration: 0.12 },
	},
});

type MessageRowMotionProps = WithChildren & {
	side?: "left" | "right";
	layout?: boolean;
};

export const MessageRowMotion = ({
	children,
	className,
	side = "left",
	layout = true,
}: MessageRowMotionProps) => (
	<motion.div
		className={className}
		variants={makeRowVariants(side)}
		initial="hidden"
		animate="visible"
		exit="exit"
		layout={layout}
	>
		{children}
	</motion.div>
);

// Avatar bubble pop-in
export const MessageAvatarMotion = ({ children, className }: WithChildren) => (
	<motion.div
		className={className}
		initial={{ opacity: 0, scale: 0.9 }}
		animate={{ opacity: 1, scale: 1 }}
		transition={{ type: "spring", stiffness: 190, damping: 18 }}
		layout="position"
	>
		{children}
	</motion.div>
);

// Chat bubble spring-in with subtle elevation
type MessageBubbleMotionProps = WithChildren & { isUser?: boolean };
export const MessageBubbleMotion = ({
	children,
	className,
	isUser,
}: MessageBubbleMotionProps) => (
	<motion.div
		className={className}
		initial={{ opacity: 0, y: 8, filter: "brightness(0.98)" }}
		animate={{ opacity: 1, y: 0, filter: "brightness(1)" }}
		transition={{ type: "spring", stiffness: 150, damping: 24 }}
		style={{
			boxShadow: isUser
				? "0 6px 16px rgba(244, 63, 94, 0.12)"
				: "0 6px 16px rgba(24, 24, 27, 0.35)",
		}}
		layout="position"
	>
		{children}
	</motion.div>
);

// Badges row and item reveal
export const BadgesRowMotion = ({ children, className }: WithChildren) => (
	<motion.div
		className={className}
		initial={{ opacity: 0 }}
		animate={{ opacity: 1 }}
		transition={{ duration: 0.18 }}
		layout
	>
		{children}
	</motion.div>
);

export const BadgeMotion = ({ children, className }: WithChildren) => (
	<motion.div
		className={className}
		initial={{ y: 4, opacity: 0 }}
		animate={{ y: 0, opacity: 1 }}
		transition={{ type: "spring", stiffness: 190, damping: 20 }}
		layout="position"
	>
		{children}
	</motion.div>
);

// Typing indicator fade presence
export const TypingIndicatorMotion = ({
	children,
	className,
}: WithChildren) => (
	<motion.div
		className={className}
		initial={{ opacity: 0 }}
		animate={{ opacity: 1 }}
		exit={{ opacity: 0 }}
	>
		{children}
	</motion.div>
);

// One-time shimmer sweep overlay (use in a relatively positioned container)
export const ShimmerOnce = () => (
	<motion.div
		className="pointer-events-none absolute inset-0 overflow-hidden"
		initial={{ opacity: 0 }}
		animate={{ opacity: [0, 0.35, 0] }}
		transition={{ duration: 0.6, ease: "easeOut" }}
	>
		<motion.div
			className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent"
			initial={{ x: "-120%" }}
			animate={{ x: "180%" }}
			transition={{ duration: 0.6, ease: "easeOut" }}
		/>
	</motion.div>
);

// Per-word staggered text reveal
type StaggerTextProps = { text: string; className?: string };
export const StaggerText = ({ text, className }: StaggerTextProps) => {
	const parts = React.useMemo(() => {
		const matches = Array.from(text.matchAll(/(\s+|\S+)/g));
		return matches.map((m) => ({ value: m[0], start: m.index ?? 0 }));
	}, [text]);
	const containerVariants: Variants = {
		visible: { transition: { staggerChildren: 0.012 } },
	};
	const wordVariants: Variants = {
		hidden: { y: 3, opacity: 0 },
		visible: {
			y: 0,
			opacity: 1,
			transition: { type: "spring", stiffness: 240, damping: 26 },
		},
	};
	return (
		<motion.p
			className={className}
			variants={containerVariants}
			initial="hidden"
			animate="visible"
		>
			{parts.map((segment) => (
				<motion.span
					key={segment.start}
					variants={wordVariants}
					style={{
						display: "inline-block",
						whiteSpace: segment.value.trim() ? "normal" : "pre",
					}}
				>
					{segment.value}
				</motion.span>
			))}
		</motion.p>
	);
};

export { motion, AnimatePresence };
