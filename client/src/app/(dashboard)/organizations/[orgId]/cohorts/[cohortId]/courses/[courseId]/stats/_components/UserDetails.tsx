"use client"

import type React from "react"
import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGetUserCourseProgressQuery, useGetUserCourseSubmissionsQuery } from "@/state/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, Book, Trophy } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { User } from "@clerk/nextjs/server"
import { getUserName } from "@/lib/utils"

interface UserDetailsProps {
  user: User
  courseId: string
}

export default function UserDetails({ user, courseId }: UserDetailsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { data: progress, isLoading: isProgressLoading } = useGetUserCourseProgressQuery({ userId: user.id, courseId })
  const { data: submissions, isLoading: isSubmissionsLoading } = useGetUserCourseSubmissionsQuery({
    userId: user.id,
    courseId,
  })

  const isLoading = isProgressLoading || isSubmissionsLoading

  const filteredSubmissions = submissions?.filter((submission) =>
    submission.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Card className="h-auto border-none shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={user.imageUrl} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback className="text-lg">{`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl font-bold">
              {getUserName(user)}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
          <div className="space-y-8">
            {/* User Stats */}
            <div className="grid grid-cols-3 gap-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : (
                <>
                  <StatCard
                    icon={<Clock className="h-5 w-5 text-primary" />}
                    title="Last Active"
                    value={
                      progress?.lastAccessedTimestamp
                        ? new Date(progress.lastAccessedTimestamp).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"
                    }
                  />
                  <StatCard
                    icon={<Book className="h-5 w-5 text-primary" />}
                    title="Enrolled On"
                    value={
                      progress?.enrollmentDate
                        ? new Date(progress.enrollmentDate).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"
                    }
                  />
                  <StatCard
                    icon={<Trophy className="h-5 w-5 text-primary" />}
                    title="Overall Progress"
                    value={
                      progress?.overallProgress ? `${progress.overallProgress.toFixed(0)}% Complete` : "0% Complete"
                    }
                  />
                </>
              )}
            </div>

            {/* Detailed Progress */}
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : progress ? (
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-xl">Course Progress Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Accordion type="single" collapsible className="w-full">
                    {progress.sections.map((section, i) => (
                      <AccordionItem key={section.sectionId} value={`section-${section.sectionId}`}>
                        <AccordionTrigger className="text-lg">Section {i + 1}</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 mt-2">
                            {section.chapters.map((chapter, j) => (
                              <div
                                key={chapter.chapterId}
                                className="flex items-center justify-between bg-muted p-3 rounded-lg hover:bg-muted/80 transition-colors"
                              >
                                <span className="text-sm font-medium">Chapter {j + 1}</span>
                                <div className="flex items-center gap-3">
                                  {chapter.quizCompleted && <Badge variant="secondary">Quiz Complete</Badge>}
                                  <Badge variant={chapter.completed ? "default" : "secondary"}>
                                    {chapter.completed ? "Completed" : "In Progress"}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ) : null}

            {/* User Submissions */}
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              submissions && (
                <Card className="">
                  <CardHeader>
                    <CardTitle className="text-xl">Assignment Submissions</CardTitle>
                    <div className="relative mt-2">
                      <Input
                        type="text"
                        placeholder="Search assignments"
                        className="toolbar__search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filteredSubmissions?.length ? (
                      filteredSubmissions.map((submission) => (
                        <div
                          key={submission.submissionId}
                          className="flex justify-between items-center bg-muted p-4 rounded-lg hover:bg-muted/80 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium">{submission.assignmentTitle}</p>
                            <p className="text-xs text-muted-foreground mt-1">{submission.evaluation.explanation}</p>
                          </div>
                          <Badge variant={submission.evaluation?.passed ? "default" : "destructive"} className="ml-4">
                            {submission.evaluation?.passed ? `Passed (${submission.evaluation.score})` : "Failed"}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No submissions found</p>
                    )}
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string
}

function StatCard({ icon, title, value }: StatCardProps) {
  return (
    <Card className="">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <div className="rounded-full bg-primary/10 p-3 mb-2">{icon}</div>
        <p className="text-sm font-medium mb-1">{title}</p>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

