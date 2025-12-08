import { LogInIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "../components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center justify-center h-screen">
      <div className="flex flex-row gap-2"><h1 className="text-3xl font-bold">SmartMail</h1><p>Beta</p></div>
      <Link href="/app/mail"><Button className="mt-2" variant="outline"><LogInIcon /> Login</Button></Link>
    </div>
  );
}
