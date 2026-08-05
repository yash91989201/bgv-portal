import { cn } from "@/lib/utils";

type BrandLogoProps = {
	className?: string;
	size?: "sm" | "md" | "lg";
};

const sizeClass = {
	sm: "size-9",
	md: "size-10",
	lg: "size-14",
} as const;

export function BrandLogo({ className, size = "md" }: BrandLogoProps) {
	return (
		<img
			src="/logo.png"
			alt="Kiewit"
			width={636}
			height={622}
			className={cn(
				"shrink-0 rounded-full object-cover",
				sizeClass[size],
				className,
			)}
		/>
	);
}
