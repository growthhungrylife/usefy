'use client';

import Header from '@/components/Header';
import CourseStats from './_components/CourseStats';
import UserList from './_components/UserList';
import UserDetails from './_components/UserDetails';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { User } from '@clerk/nextjs/server';
import FeedbackList from '@/app/(dashboard)/organizations/[orgId]/courses/[courseId]/chapters/[chapterId]/adaptive-quiz/FeedbackList';

export default function CourseStatsPage() {
    const pathname = usePathname();
    const courseId = pathname.split('/')[4];
    const [selectedUser, setSelectedUser] = useState<User>();

    return (
        <div className="container mx-auto p-4">
            <Header title="Course Stats" subtitle="View statistics for your course" />
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-1/3">
                    <UserList 
                        courseId={courseId} 
                        selectedUser={selectedUser}
                        onUserSelect={setSelectedUser}
                    />
                </div>
                <div className="w-full lg:w-2/3 space-y-8">
                    <CourseStats courseId={courseId} />
                    {selectedUser && (
                        <UserDetails 
                            user={selectedUser}
                            courseId={courseId}
                        />
                    )}
                </div>
            </div>
            <div className='mt-12'></div>
            <Header title="Feedback Submissions" subtitle="View feedback submissions for your course" />
            <FeedbackList courseId={courseId} />
        </div>
    );
}
