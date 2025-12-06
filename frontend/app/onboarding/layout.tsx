import { BaseHeader } from "@/components/qui/header";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-full w-full">
            <BaseHeader title="SmartMail Onboarding" />
            {children}
        </div>
    );
}