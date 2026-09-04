'use client';

import { Button, Select, Textarea, TextInput } from '@mantine/core';
import { useState } from 'react';
import type { Post } from '../dashboard';
import { FaCog } from 'react-icons/fa';

type PostForm = Pick<Post, 'title' | 'slug' | 'excerpt' | 'content' | 'status'>;

type Props = {
    post: Post;
    onSaved: () => void | Promise<void>;
};

export default function Post({ post, onSaved }: Props) {
    return (
        <div className="">
            
        </div>
    )
}
