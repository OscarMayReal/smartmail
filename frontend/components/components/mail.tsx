"use client";
import "./components.css";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Checkbox } from "../ui/checkbox";
import { ArchiveIcon, BoldIcon, Code2Icon, CodeIcon, FolderIcon, FolderInputIcon, ForwardIcon, InboxIcon, ItalicIcon, ListIcon, ListOrderedIcon, PencilIcon, QuoteIcon, RedoIcon, ReplyIcon, SendIcon, StrikethroughIcon, Trash2Icon, UndoIcon, XIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Toggle } from "../ui/toggle";
import { Switch } from "../ui/switch";
import { ButtonGroup } from "../ui/button-group";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { email } from "../../../server/generated/prisma/browser";
import { useContext } from "react";
import { GlobalContext } from "@/app/app/layout";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MailContext } from "@/app/app/mail/layout";
import { toast } from "sonner";
import { getTypeIcon } from "./folder";
import { folder } from "../../../server/generated/prisma/browser";

export async function moveEmailInteractive({ messageId, messages, router, params, setMessages, folder, auth, moveToNext = true }: { messageId: string, messages: email[], router: any, params: any, setMessages: (messages: email[]) => void, folder: folder, auth: any, moveToNext?: boolean }) {
    await fetch(`/api/mail/messages/${messageId}/move`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + auth.data?.sessionId,
        },
        body: JSON.stringify({ folderId: folder.id }),
    })
    var newMessages = await fetch(`/api/mail/folders/${params.id}/messages`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + auth.data?.sessionId,
        },
    }).then((res) => res.json())
    const thisMessagePosition = messages.findIndex((message) => message.id === messageId)
    if (thisMessagePosition < messages.length - 1 && moveToNext) {
        router.push(`/app/mail/mailbox/${params.id}/message/${messages[thisMessagePosition + 1].id}`)
    } else if (thisMessagePosition > 0 && moveToNext) {
        router.push(`/app/mail/mailbox/${params.id}/message/${messages[thisMessagePosition - 1].id}`)
    } else if (moveToNext) {
        router.push(`/app/mail/mailbox/${params.id}`)
    } else {
        router.push(`/app/mail/mailbox/${params.id}`)
    }
    setMessages(newMessages.map((message: email & { selected: boolean }) => ({ ...message, selected: false })))
    toast.success("Email moved to " + folder.name)
}

export function MailItem({ item }: { item: email & { selected: boolean } }) {
    const { setMessages, messages } = useContext(MailContext)
    const router = useRouter();
    const params = useParams();
    return (
        <div className={"mail-item" + (params.messageid == item.id || item.selected ? " active" : "")} onClick={() => { router.push(`/app/mail/mailbox/${params.id}/message/${item.id}`) }}>
            <Checkbox checked={item.selected} onCheckedChange={(checked) => {
                setMessages(messages.map((message) => { if (message.id == item.id) message.selected = checked; return message }))
            }} />
            <Avatar style={{ width: "40px", height: "40px", border: "1px solid var(--qu-border-color)" }}>
                <AvatarFallback className="text-[var(--qu-text)]">AB</AvatarFallback>
            </Avatar>
            <div className="mail-item-content">
                <div className="mail-item-title">{item.name ? item.name : item.from}</div>
                <div className="mail-item-subtitle">{item.subject}</div>
            </div>
        </div>
    );
}

export function MailboxHeader({ title }: { title: string }) {
    const { setMessages, messages } = useContext(MailContext)
    return (
        <div className="mail-header">
            <Checkbox checked={messages.every((message) => message.selected) && messages.length > 0} onCheckedChange={(checked) => {
                setMessages(messages.map((message) => { message.selected = checked; return message }))
            }} />
            <div className="mail-header-title">{messages.some((message) => message.selected) ? messages.filter((message) => message.selected).length + " Selected" : title}</div>
            <div className="flex-1" />
            <div className="flex flex-row gap-2 items-center">
                <div className="text-[var(--qu-text-secondary)]">Hide Read</div>
                <Switch />
            </div>
        </div>
    );
}

export function MailItemHeader({ message }: { message: email }) {
    const { auth } = useContext(GlobalContext)
    const { setMessages, messages, folders } = useContext(MailContext)
    const router = useRouter();
    const params = useParams();
    return (
        <div className="mail-header">
            <XIcon size="20" />
            <div className="mail-header-title">{message.subject}</div>
            <div className="flex-1" />
            <ButtonGroup>
                {(folders.filter((folder) => folder.type == "smartmail.folder.trash")[0] || {}).id != params.id && <Button variant="outline" size="sm" onClick={() => {
                    moveEmailInteractive({ messageId: message.id, messages, router, params, setMessages, folder: folders.filter((folder) => folder.type == "smartmail.folder.trash")[0], auth })
                }}><Trash2Icon />Delete</Button>}
                {(folders.filter((folder) => folder.type == "smartmail.folder.archive")[0] || {}).id != params.id && <Button variant="outline" size="sm" onClick={() => {
                    moveEmailInteractive({ messageId: message.id, messages, router, params, setMessages, folder: folders.filter((folder) => folder.type == "smartmail.folder.archive")[0], auth })
                }}><ArchiveIcon /> Archive</Button>}
                {/* <Button variant="outline" size="sm"><FolderInputIcon /> Move</Button> */}
                <MoveEmailDropdown messageId={message.id} />
            </ButtonGroup>
        </div>
    );
}

export function MailItemFooter({ title, setReplyMode }: { title: string, setReplyMode: (mode: "reply" | "forward" | null) => void }) {
    return (
        <ButtonGroup>
            <Button variant="outline" size="sm" onClick={() => { setReplyMode("reply") }}><ReplyIcon />Reply</Button>
            <Button variant="outline" size="sm" onClick={() => { setReplyMode("forward") }}><ForwardIcon />Forward</Button>
        </ButtonGroup>
    );
}

export function SentfromHeader({ message }: { message: email }) {
    return (
        <div className="flex flex-row gap-2 items-center">
            <Avatar style={{ width: "40px", height: "40px", border: "1px solid var(--qu-border-color)" }}>
                <AvatarFallback className="text-[var(--qu-text)]">AB</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <div className="mail-page-sender-name">{message.name}</div>
                <div className="mail-page-sender-email">{message.from}</div>
            </div>
        </div>
    );
}

function ReplyForwardHeader() {
    const { auth } = useContext(GlobalContext)
    return (
        <div className="flex flex-row gap-2 items-center">
            <Avatar style={{ width: "40px", height: "40px", border: "1px solid var(--qu-border-color)" }}>
                <AvatarFallback className="text-[var(--qu-text)]">AB</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <div className="mail-page-sender-name">{auth.data?.user.name}</div>
                <div className="mail-page-sender-email">{auth.data?.user.email}</div>
            </div>
        </div>
    );
}

function MoveEmailDropdown({ messageId }: { messageId: string }) {
    const { folders } = useContext(MailContext)
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline"><FolderInputIcon /> Move</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-0">
                <Command>
                    <CommandInput placeholder="Search folders..." />
                    <CommandList>
                        <CommandEmpty>No folders found.</CommandEmpty>
                        <CommandGroup>
                            {folders.map((folder) => (
                                <MoveEmailItem key={folder.id} folder={folder} messageId={messageId} />
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function MoveSelectedMessagesDropdown() {
    const { folders, messages } = useContext(MailContext)
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                    <FolderInputIcon className="mr-2 h-4 w-4" />
                    Move to Folder
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0">
                <Command>
                    <CommandInput placeholder="Search folders..." />
                    <CommandList>
                        <CommandEmpty>No folders found.</CommandEmpty>
                        <CommandGroup>
                            {folders.map((folder) => (
                                <MoveEmailItem key={folder.id} folder={folder} messageId={messages.filter((message) => message.selected).map((message) => message.id)} />
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function MoveEmailItem({ folder, messageId }: { folder: any, messageId: string | string[] }) {
    const { auth } = useContext(GlobalContext)
    const { setMessages, messages } = useContext(MailContext)
    const router = useRouter()
    const params = useParams()
    var Icon = getTypeIcon(folder.type)
    return (
        <CommandItem disabled={folder.id == params.id} key={folder.id} onSelect={async () => {
            if (Array.isArray(messageId)) {
                for (const mid of messageId) {
                    moveEmailInteractive({ messageId: mid, messages, router, params, setMessages, folder, auth, moveToNext: false })
                }
            } else {
                moveEmailInteractive({ messageId, messages, router, params, setMessages, folder, auth })
            }
        }}>
            <Icon />
            {folder.name + (folder.id == params.id ? " (Current)" : "")}
        </CommandItem>
    );
}

export function ReplyComposer({ setReplyMode, replyMode, message }: { setReplyMode: (mode: "reply" | "forward" | null) => void, replyMode: "reply" | "forward" | null, message: email }) {
    const editor = useEditor({
        extensions: [
            StarterKit
        ],
        content: replyMode == "reply" ? `
            <p></p>
            <p>Sent with SmartMail</p>
            <hr />
            <p>On ${new Date(message.date).toDateString()} at ${new Date(message.date).toLocaleTimeString()} ${message.name} wrote:</p>
            <p>${message.email.html}</p>
        ` : replyMode == "forward" ? `
            <p></p>
            <p>Sent with SmartMail</p>
            <hr />
            <p>===== Forwarded message =====</p>
            <p>From ${message.name} <${message.from}></p>
            <p>To ${message.to}</p>
            <p>Date: ${new Date(message.date).toDateString()} at ${new Date(message.date).toLocaleTimeString()}</p>
            <p>Subject: ${message.subject}</p>
            <p>===== Forwarded message =====</p>
            <p>${message.email.html}</p>
        ` : "",
        immediatelyRender: false
    })
    const editorState = useEditorState({
        editor,
        selector: ctx => {
            if (!ctx.editor) return
            return {
                isBold: ctx.editor.isActive('bold') ?? false,
                canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
                isItalic: ctx.editor.isActive('italic') ?? false,
                canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
                isStrike: ctx.editor.isActive('strike') ?? false,
                canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
                isCode: ctx.editor.isActive('code') ?? false,
                canCode: ctx.editor.can().chain().toggleCode().run() ?? false,
                canClearMarks: ctx.editor.can().chain().unsetAllMarks().run() ?? false,
                isParagraph: ctx.editor.isActive('paragraph') ?? false,
                isHeading1: ctx.editor.isActive('heading', { level: 1 }) ?? false,
                isHeading2: ctx.editor.isActive('heading', { level: 2 }) ?? false,
                isHeading3: ctx.editor.isActive('heading', { level: 3 }) ?? false,
                isHeading4: ctx.editor.isActive('heading', { level: 4 }) ?? false,
                isHeading5: ctx.editor.isActive('heading', { level: 5 }) ?? false,
                isHeading6: ctx.editor.isActive('heading', { level: 6 }) ?? false,
                isBulletList: ctx.editor.isActive('bulletList') ?? false,
                isOrderedList: ctx.editor.isActive('orderedList') ?? false,
                isCodeBlock: ctx.editor.isActive('codeBlock') ?? false,
                isBlockquote: ctx.editor.isActive('blockquote') ?? false,
                canUndo: ctx.editor.can().chain().undo().run() ?? false,
                canRedo: ctx.editor.can().chain().redo().run() ?? false,
            }
        },
    })
    return (
        <>
            <Separator />
            <ReplyForwardHeader />
            <div className="reply-composer shadow-xs">
                <div className="reply-composer-header">
                    <Button variant="ghost" size="icon-sm" ><UndoIcon /></Button>
                    <Button variant="ghost" size="icon-sm" ><RedoIcon /></Button>
                    <Separator orientation="vertical" />
                    <Button variant={editorState?.isBold ? "default" : "ghost"} size="icon-sm" onClick={() => { editor?.chain().toggleBold().run(); editor?.chain().focus().run() }}><BoldIcon /></Button>
                    <Button variant={editorState?.isItalic ? "default" : "ghost"} size="icon-sm" onClick={() => { editor?.chain().toggleItalic().run(); editor?.chain().focus().run() }}><ItalicIcon /></Button>
                    <Button variant={editorState?.isStrike ? "default" : "ghost"} size="icon-sm" onClick={() => { editor?.chain().toggleStrike().run(); editor?.chain().focus().run() }}><StrikethroughIcon /></Button>
                    <Button variant={editorState?.isCode ? "default" : "ghost"} size="icon-sm" onClick={() => { editor?.chain().toggleCode().run(); editor?.chain().focus().run() }}><CodeIcon /></Button>
                    <Button variant={editorState?.isBulletList ? "default" : "ghost"} size="icon-sm" onClick={() => { editor?.chain().toggleBulletList().run(); editor?.chain().focus().run() }}><ListIcon /></Button>
                    <Button variant={editorState?.isOrderedList ? "default" : "ghost"} size="icon-sm" onClick={() => { editor?.chain().toggleOrderedList().run(); editor?.chain().focus().run() }}><ListOrderedIcon /></Button>
                    <Button variant={editorState?.isCodeBlock ? "default" : "ghost"} size="icon-sm" onClick={() => { editor?.chain().toggleCodeBlock().run(); editor?.chain().focus().run() }}><Code2Icon /></Button>
                    <Button variant={editorState?.isBlockquote ? "default" : "ghost"} size="icon-sm" onClick={() => { editor?.chain().toggleBlockquote().run(); editor?.chain().focus().run() }}><QuoteIcon /></Button>
                    <div className="flex-1" />
                    <Separator orientation="vertical" />
                    <Button variant="ghost" size="icon-sm" onClick={() => { setReplyMode(null) }}><XIcon /></Button>
                    <Button variant="default" size="icon-sm"><SendIcon /></Button>
                </div>
                <EditorContent className="reply-composer-content p-3" editor={editor} />
            </div>
        </>
    );
}