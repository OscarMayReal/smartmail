"use client";
import { Button } from "../ui/button";
import { BoldIcon, Code2Icon, CodeIcon, ItalicIcon, ListIcon, ListOrderedIcon, QuoteIcon, RedoIcon, SendIcon, StrikethroughIcon, UndoIcon, XIcon, UserIcon } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { TagInput, Tag } from "emblor-maintained";
import { useState, Dispatch, SetStateAction } from "react";
import { Input } from "../ui/input";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Separator } from "../ui/separator";
export function ComposeHeader({ onSend }: { onSend: () => void }) {
    const router = useRouter()
    const params = useParams()
    return (
        <div className="mail-header">
            <XIcon size="20" onClick={() => { router.push("/app/mail/mailbox/" + params.id) }} />
            <div className="mail-header-title">Compose</div>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={onSend} ><SendIcon />Send</Button>
        </div>
    );
}

export function RecepientsInput({ tags, setTags, subject, setSubject }: { tags: Tag[], setTags: Dispatch<SetStateAction<Tag[]>>, subject: string, setSubject: Dispatch<SetStateAction<string>> }) {
    const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2 items-center">
                <Button variant="outline">To</Button>
                <TagInput
                    tags={tags}
                    setTags={setTags}
                    activeTagIndex={activeTagIndex}
                    setActiveTagIndex={setActiveTagIndex}
                    placeholder="Add recepients..."
                    tagProps={{
                        className: "bg-[var(--qu-primary)] text-[var(--qu-text)]"
                    }}
                    inputProps={{
                        style: {
                            outline: "none",
                            border: "none",
                            padding: "0",
                            borderRadius: "0",
                            paddingLeft: "10px",
                            boxShadow: "none"
                        }
                    }}
                    styleClasses={{
                        inlineTagsContainer: "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-white p-1",
                        tag: {
                            body: "h-full"
                        }
                    }}
                />
            </div>
            <div className="flex flex-row gap-2 items-center">
                <Input placeholder="Subject" className="bg-[var(--qu-header-background)]" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
        </div>
    );
}

export function ComposerEditor({ text, setText }: { text: string, setText: (text: string) => void }) {
    const editor = useEditor({
        extensions: [
            StarterKit
        ],
        content: text,
        immediatelyRender: false,
        onTransaction: (transaction) => {
            setText(editor?.getHTML() ?? "");
        }
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
    function setReplyMode(arg0: null) {
        throw new Error("Function not implemented.");
    }

    return (
        <div className="reply-composer shadow-xs">
            <div className="reply-composer-header">
                <Button disabled={!editorState?.canUndo} variant="ghost" size="icon-sm" onClick={() => { editor?.chain().undo().run(); editor?.chain().focus().run() }}><UndoIcon /></Button>
                <Button disabled={!editorState?.canRedo} variant="ghost" size="icon-sm" onClick={() => { editor?.chain().redo().run(); editor?.chain().focus().run() }}><RedoIcon /></Button>
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
            </div>
            <EditorContent className="reply-composer-content p-3" editor={editor} />
        </div>
    );
}