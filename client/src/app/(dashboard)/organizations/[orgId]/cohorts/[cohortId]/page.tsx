'use client'

import React from "react";
import { useUser } from "@clerk/nextjs";
import { useOrganization } from "@/context/OrganizationContext";
import AdminCohortPage from "./_components/AdminCohort";
import UserCohortPage from "./_components/UserCohort";
import { 
    useGetOrganizationUsersQuery,
    useGetCohortCoursesQuery
} from "@/state/api";
import { useParams } from "next/navigation";

export default function CohortPage() {
    const { user } = useUser()
    const { orgId, cohortId } = useParams()
    const { currentOrg } = useOrganization()
    const { data: orgUsers, isLoading: usersLoading } = useGetOrganizationUsersQuery(orgId as string)
    const { data: cohortCourses } = useGetCohortCoursesQuery({ organizationId: orgId as string, cohortId: cohortId as string })

    const isAdmin= currentOrg?.admins.some((admin) => admin.userId === user?.id)

    return (
        <>
            {isAdmin ? 
                <AdminCohortPage 
                    orgUsers={orgUsers as any}
                    usersLoading={usersLoading}
                    courses={cohortCourses as Course[]}
                /> : 
                <UserCohortPage 
                    orgUsers={orgUsers as any}
                    usersLoading={usersLoading}
                    courses={cohortCourses as Course[]}
                />
            }
        </>
    )
};