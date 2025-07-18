

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import slugify from "slugify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/hooks/useAuthContext";
import { getAllBlogPosts, addBlogPost, updateBlogPost, deleteBlogPost } from "../actions";
import { PlusCircle, Loader2, Edit, Trash2 } from "lucide-react";
import type { BlogPost } from "@/types";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters.").max(200, "Excerpt must be 200 characters or less."),
  content: z.string().min(50, "Content must be at least 50 characters."),
  imageUrl: z.string().url("Must be a valid image URL."),
  status: z.enum(['draft', 'published']),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

function PostForm({ post, onSuccess, onCancel }: { post?: BlogPost | null; onSuccess: () => void; onCancel: () => void; }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuthContext();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: post ? {
            ...post,
            tags: post.tags?.join(', '),
        } : {
            title: "",
            excerpt: "",
            content: "",
            imageUrl: `https://placehold.co/1200x630.png`,
            status: "draft",
            tags: "",
        },
    });

    const onSubmit = async (data: FormData) => {
        if (!user || !user.profile) return;
        setIsSubmitting(true);
        const slug = slugify(data.title, { lower: true, strict: true });
        const payload = {
            ...data,
            slug,
            tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
            authorName: user.profile.name,
            authorId: user.uid,
        };

        const result = post
            ? await updateBlogPost(post.id, payload)
            : await addBlogPost(payload);

        if (result.success) {
            toast({ type: "success", title: "Success", description: result.message });
            onSuccess();
        } else {
            toast({ type: "error", title: "Error", description: result.message });
        }
        setIsSubmitting(false);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="excerpt" render={({ field }) => (
                    <FormItem><FormLabel>Excerpt</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="content" render={({ field }) => (
                    <FormItem><FormLabel>Content (Markdown)</FormLabel><FormControl><Textarea className="min-h-48" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                    <FormItem><FormLabel>Featured Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="tags" render={({ field }) => (
                    <FormItem><FormLabel>Tags (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>

                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {post ? "Save Changes" : "Create Post"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

export default function ManageBlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const { toast } = useToast();

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const data = await getAllBlogPosts();
            setPosts(data);
        } catch (error) {
            toast({ type: "error", title: "Error", description: "Could not fetch blog posts." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (id: string) => {
        const result = await deleteBlogPost(id);
        if (result.success) {
            toast({ type: "success", title: "Success", description: result.message });
            fetchPosts();
        } else {
            toast({ type: "error", title: "Error", description: result.message });
        }
    };

    const handleEdit = (post: BlogPost) => {
        setEditingPost(post);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingPost(null);
        setIsFormOpen(true);
    }
    
    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingPost(null);
        fetchPosts();
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        setEditingPost(null);
    }

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex justify-between items-start">
                <PageHeader
                    title="Manage Blog"
                    description="Create, edit, and publish blog posts."
                />
                <Button onClick={handleAdd}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Post
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Posts</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {posts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium">{post.title}</TableCell>
                                        <TableCell>
                                            <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                                {post.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{format(post.updatedAt, "PP")}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEdit(post)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="icon" variant="destructive" className="h-8 w-8">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete this post.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(post.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                 <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPost ? "Edit" : "Add New"} Post</DialogTitle>
                    </DialogHeader>
                    <div className="p-1">
                        <PostForm 
                            post={editingPost}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
