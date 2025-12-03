import { HTMLInputTypeAttribute, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarcodeIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
// import { Editor } from "@monaco-editor/react";
// import {BarcodeScanner} from '@thewirv/react-barcode-scanner';

export function InputField({ label, value, setValue, type, style, autoComplete }: { label: string, value: string, setValue: (value: string) => void, type?: HTMLInputTypeAttribute, style?: React.CSSProperties, autoComplete?: HTMLInputTypeAttribute }) {
    return (
        <div style={{ padding: "20px 20px 0px 20px", ...style }}>
            <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "10px" }}>{label}</div>
            <Input autoCorrect="off" autoCapitalize="off" style={{ backgroundColor: "var(--header-background)" }} value={value} onChange={(e) => setValue(e.target.value)} type={type} autoComplete={autoComplete} />
        </div>
    );
}

export function PrefixedInput({ label, value, setValue, prefix, style }: { label: string, value: string, setValue: (value: string) => void, prefix: string, style?: React.CSSProperties }) {
    return (
        <div style={{ padding: "20px 20px 0px 20px", ...style }}>
            <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "10px" }}>{label}</div>
            <div className="flex items-center border border-input rounded-md shadow-xs bg-background focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-[color,box-shadow] px-3 h-9 text-base">
                <span style={{ color: "var(--qu-text-secondary)" }} className="select-none text-[14px]">{prefix}</span>
                <input autoCorrect="off" autoCapitalize="off" type="text" value={value} onChange={(e) => setValue(e.target.value)} className="outline-none text-[14px] w-full" />
            </div>
        </div>
    );
}

// export function MonacoInput({label, value, setValue, style}: {label: string, value: string, setValue: (value: string) => void, style?: React.CSSProperties}) {
//     return (
//         <div style={{padding: "20px 20px 0px 20px", ...style}}>
//             <div style={{fontSize: "14px", fontWeight: "500", marginBottom: "10px"}}>{label}</div>
//             <div className="flex items-center border border-input rounded-md shadow-xs bg-background focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] overflow-hidden transition-[color,box-shadow] h-[fit-content] text-base">
//                 <Editor value={value} width={"100%"} options={{
//                     minimap: {
//                         enabled: false
//                     }
//                 }} onChange={(value) => setValue(value)} height="200px" language="json" />
//             </div>
//         </div>
//     );
// }

export function SwitchInput({ label, value, setValue }: { label: string, value: boolean, setValue: (value: boolean) => void }) {
    return (
        <div style={{ padding: "20px 20px 0px 20px" }} className="flex items-center justify-between">
            <div style={{ fontSize: "14px", fontWeight: "500" }}>{label}</div>
            <Switch checked={value} onCheckedChange={setValue} />
        </div>
    );
}

export function SelectField({ label, value, setValue, options, noMargin }: { label: string, value: string, setValue: (value: string) => void, options: { id: string, name: string, description?: string, disabled?: boolean }[], noMargin?: boolean }) {
    return (
        <div style={noMargin ? { padding: "0px" } : { padding: "20px 20px 0px 20px" }}>
            {label && <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "10px" }}>{label}</div>}
            <Select value={value} onValueChange={setValue}>
                <SelectTrigger style={{ backgroundColor: "var(--header-background)", width: "100%", height: "fit-content" }}>
                    <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem disabled={option.disabled} key={option.id} value={option.id}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
                                <div style={{ color: "var(--qu-text)" }}>{option.name}</div>
                                {option.description && <div style={{ color: "var(--qu-text-secondary)" }}>{option.description}</div>}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// export function BarcodeScannerInput({value, title, noMargin, setValue}: {value: string, title: string, noMargin?: boolean, setValue: (value: string) => void}) {
//     const [open, setOpen] = useState(false);
//     return (
//         <div style={{padding: noMargin ? "0px" : "20px 20px 0px 20px"}}>
//             <div style={{fontSize: "14px", fontWeight: "500", marginBottom: "10px"}}>{title}</div>
//             <div style={{display: "flex", flexDirection: "row", alignItems: "center", gap: "10px"}}>
//                 <Input value={value} onChange={(e) => setValue(e.target.value)} style={{flex: 1, backgroundColor: "var(--header-background)", color: "var(--qu-text)"}} />
//                 <Button variant="outline" onClick={() => {
//                     setOpen(true);
//                 }}>
//                     <BarcodeIcon /> Scan
//                 </Button>
//             </div>
//             <Dialog open={open} onOpenChange={setOpen}>
//                 <DialogContent>
//                     <DialogHeader>
//                         <DialogTitle>Scan Barcode</DialogTitle>
//                     </DialogHeader>
//                     {open && <BarcodeScanner onSuccess={(barcode) => {
//                         setValue(barcode);
//                         setOpen(false);
//                     }} doScan={open} onError={(error) => {
//                         console.log(error);
//                     }} />}
//                 </DialogContent>
//             </Dialog>
//         </div>
//     );
// }

export function SuffixedInput({ label, value, setValue, suffix, fitInput, pattern, style, type }: { label: string, value: string, setValue: (value: string) => void, suffix: string, fitInput?: boolean, pattern?: string, style?: React.CSSProperties, type?: HTMLInputTypeAttribute }) {
    return (
        <div style={{ padding: "20px 20px 0px 20px", ...style }}>
            <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "10px" }}>{label}</div>
            <div className="flex items-center border border-input rounded-md shadow-xs bg-background focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-[color,box-shadow] px-3 h-9 text-base">
                <input autoCorrect="off" autoCapitalize="off" pattern={pattern} type={type} value={value} onChange={(e) => setValue(e.target.value)} className={"outline-none text-[14px]" + (fitInput ? "" : " w-full")} style={{ fieldSizing: "content" }} />
                <span style={{ color: "var(--qu-text-secondary)" }} className="select-none text-[14px]">{suffix}</span>
            </div>
        </div>
    );
}