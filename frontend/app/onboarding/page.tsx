"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "keystone-lib";
import { BuildingIcon, DoorClosedIcon, MailIcon, SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function OnboardingPage() {
    const auth = useAuth({ keystoneUrl: process.env.NEXT_PUBLIC_KEYSTONE_URL!, appId: process.env.NEXT_PUBLIC_APPID! });
    return (
        <>
            {auth.loaded && auth.data?.sessionId && (
                <Alert className="w-full m-5">
                    <BuildingIcon />
                    <AlertTitle>Setting up SmartMail for {auth.data?.tenant?.displayName || auth.data?.tenant?.name}</AlertTitle>
                    <AlertDescription>
                        you are performing onboarding for {auth.data?.tenant?.name}.
                    </AlertDescription>
                </Alert>
            )}
            <div className="flex flex-col items-center justify-center gap-2 w-full h-full p-5">
                {(auth.loaded && !auth.data?.sessionId) ? (
                    <Alert className="w-[500px]">
                        <DoorClosedIcon />
                        <AlertTitle>Not logged in or app not authorized</AlertTitle>
                        <AlertDescription>
                            Please log in or authorize the app to continue setting up SmartMail for your organization.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-4 w-full h-full p-5">
                        <MailIcon size={30} />
                        <h1 className="text-2xl font-bold">Configure SmartMail for your organization</h1>
                        <p className="text-center">Get professional email addresses for your organization</p>
                        <Link href="/admin"><Button variant="outline"><SettingsIcon />Go to Admin Console</Button></Link>
                    </div>
                )}
            </div>
        </>
    );
}