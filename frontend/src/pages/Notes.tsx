import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Search, FileText, Tag, Calendar, ChevronRight, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { marked } from 'marked';
import TurndownService from 'turndown';

const turndownService = new TurndownService();

export default function NotesPage() {
    const [notes, setNotes] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [editingNote, setEditingNote] = useState<any>(null);
    const [fontSize, setFontSize] = useState(14);
    const quillRef = useRef<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const { data } = await api.get('/notes');
            setNotes(data);
        } catch (err) {
            toast({ title: "Error", description: "Failed to fetch notes", variant: "destructive" });
        }
    };

    const deleteNote = async (id: number) => {
        try {
            await api.delete(`/notes/${id}`);
            setNotes(n => n.filter(note => note.id !== id));
            toast({ title: "Deleted", description: "Note removed successfully" });
        } catch (err) {
            toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
        }
    };

    const handleCreateNote = async () => {
        try {
            const { data } = await api.post('/notes', {
                title: "New Research Note",
                content: "Start writing your insights here...",
                tags: ["web-note"]
            });
            setNotes(prev => [data, ...prev]);
            toast({ title: "Created", description: "New note added to your library" });
        } catch (err) {
            toast({ title: "Error", description: "Failed to create note", variant: "destructive" });
        }
    };

    const handleSaveEdit = async () => {
        if (!editingNote) return;
        try {
            const markdown = turndownService.turndown(editingNote.content);
            await api.put(`/notes/${editingNote.id}`, {
                title: editingNote.title,
                content: markdown
            });
            setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, title: editingNote.title, content_preview: markdown.substring(0, 100) } : n));
            setEditingNote(null);
            toast({ title: "Updated", description: "Your changes have been saved" });
        } catch (err) {
            toast({ title: "Error", description: "Failed to update note", variant: "destructive" });
        }
    };

    const filteredNotes = notes.filter(n =>
        n.title?.toLowerCase().includes(search.toLowerCase()) ||
        n.content_preview?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout title="Research Notes">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="relative flex-1 w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search your notes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:outline-none focus:border-primary/50 text-sm transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreateNote}
                            className="btn-primary py-2.5 px-6 flex items-center gap-2 shrink-0 transition-transform active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            New Note
                        </button>
                    </div>
                </div>

                {/* Notes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNotes.length > 0 ? filteredNotes.map((note, i) => (
                        <motion.div
                            key={note.id}
                            className={`card-premium p-5 flex flex-col h-full group cursor-pointer transition-all ${editingNote?.id === note.id ? "ring-2 ring-primary" : ""}`}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => {
                                // Fetch full note content before editing
                                api.get(`/notes/${note.id}`).then(({ data }) => {
                                    const htmlContent = marked(data.content);
                                    setEditingNote({ ...data, content: htmlContent });
                                });
                            }}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNote(note.id);
                                    }}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <h4 className="font-display font-semibold text-foreground mb-2 line-clamp-2 leading-tight">
                                {note.title || "Untitled Note"}
                            </h4>

                            <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                                {note.content_preview || "No content summary available."}
                            </p>

                            <div className="space-y-3 pt-4 border-t border-border mt-auto">
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(note.created_at).toLocaleDateString()}
                                </div>

                                {note.paper_title && (
                                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-secondary/50 border border-border">
                                        <span className="text-[10px] text-primary font-bold overflow-hidden truncate">
                                            {note.paper_title}
                                        </span>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-1">
                                    {(note.tags || []).slice(0, 3).map((tag: string) => (
                                        <span key={tag} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] font-semibold">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="col-span-full py-20 text-center space-y-3">
                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                                <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No notes found</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                Capture your thoughts while listening to podcasts or chatting with AI.
                            </p>
                        </div>
                    )}
                </div>

                {/* Edit Modal / Section */}
                {editingNote && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <motion.div
                            className="card-premium w-full max-w-2xl p-6 shadow-2xl space-y-4"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold font-display">Edit Note</h3>
                                <button onClick={() => setEditingNote(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <input
                                    className="flex-1 bg-muted/30 border-none text-lg font-bold p-2 px-3 rounded-lg focus:ring-1 focus:ring-primary/50 placeholder:opacity-50"
                                    value={editingNote.title}
                                    onChange={e => setEditingNote({ ...editingNote, title: e.target.value })}
                                    placeholder="Note Title"
                                />
                                <div className="flex items-center gap-1 bg-muted/20 px-2 py-1 rounded-lg border border-border">
                                    <input
                                        type="number"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(Math.min(48, Math.max(8, Number(e.target.value))))}
                                        className="w-12 text-center text-[11px] font-medium bg-muted/50 border border-border rounded py-0.5 focus:outline-none focus:border-primary/50"
                                        title="Font Size"
                                    />
                                    <span className="text-[10px] text-muted-foreground font-medium mr-1">px</span>
                                </div>
                            </div>
                            <div className="quill-wrapper-premium flex-1 min-h-[400px] overflow-hidden bg-muted/10 rounded-xl border border-border mt-2">
                                <ReactQuill
                                    theme="snow"
                                    value={editingNote.content}
                                    onChange={(val) => setEditingNote({ ...editingNote, content: val })}
                                    placeholder="Your research journey starts here..."
                                    className="h-full"
                                    modules={{
                                        toolbar: [
                                            ['bold', 'italic', 'underline'],
                                            [{ 'header': 1 }, { 'header': 2 }],
                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                            ['clean']
                                        ]
                                    }}
                                    style={{ fontSize: `${fontSize}px` }}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button onClick={() => setEditingNote(null)} className="px-6 py-2 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground">Cancel</button>
                                <button onClick={handleSaveEdit} className="btn-primary px-8 py-2">Save Changes</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
