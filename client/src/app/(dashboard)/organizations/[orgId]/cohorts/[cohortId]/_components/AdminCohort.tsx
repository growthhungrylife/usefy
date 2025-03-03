"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/Spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, UserPlus, BookOpen, Users, UserCheck, UserX, Edit, MoreHorizontal } from "lucide-react"
import { getUserName, handleEnroll } from "@/lib/utils"
import {
  useGetOrganizationCoursesQuery,
  useAddLearnerToCohortMutation,
  useAddCourseToCohortMutation,
  useAddCourseInstructorMutation,
  useRemoveCourseInstructorMutation,
  useCreateTransactionMutation,
  useUnenrollUserMutation,
} from "@/state/api"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { User } from "@clerk/nextjs/server"

interface AdminCohortPageProps {
  cohort: any
  cohortLoading: boolean
  orgUsers: any
  usersLoading: boolean
  refetch: () => void
}

const AdminCohortPage = ({ cohort, cohortLoading, orgUsers, usersLoading, refetch }: AdminCohortPageProps) => {
  const { data: orgCourses, isLoading: coursesLoading } = useGetOrganizationCoursesQuery(cohort.organizationId as string)

  const [addLearnerToCohort] = useAddLearnerToCohortMutation()
  const [addCourseToCohort] = useAddCourseToCohortMutation()
  const [addCourseInstructor] = useAddCourseInstructorMutation()
  const [removeCourseInstructor] = useRemoveCourseInstructorMutation()
  const [createTransaction] = useCreateTransactionMutation()
  const [unenrollUser] = useUnenrollUserMutation()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLearnerId, setSelectedLearnerId] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedInstructorId, setSelectedInstructorId] = useState("")
  const [isAddLearnerDialogOpen, setIsAddLearnerDialogOpen] = useState(false)
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false)
  const [isChangeInstructorDialogOpen, setIsChangeInstructorDialogOpen] = useState(false)
  const [courseToEdit, setCourseToEdit] = useState<any>(null)
  const [isRemoveInstructorAlertOpen, setIsRemoveInstructorAlertOpen] = useState(false)

  const handleAddLearner = async () => {
    if (!selectedLearnerId) {
      toast.error("Please select a learner")
      return
    }

    try {
      await addLearnerToCohort({
        organizationId: cohort.organizationId as string,
        cohortId: cohort.cohortId as string,
        learnerId: selectedLearnerId,
      })

      toast.success("Learner added to cohort successfully")
      setIsAddLearnerDialogOpen(false)
      setSelectedLearnerId("")
      refetch()
    } catch (error) {
      toast.error("Failed to add learner to cohort")
      setIsAddLearnerDialogOpen(false)
      setSelectedLearnerId("")
    }
  }

  const handleAddCourse = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a course")
      return
    }

    if (!selectedInstructorId) {
      toast.error("Please select an instructor")
      return
    }

    try {
      await addCourseToCohort({
        organizationId: cohort.organizationId as string,
        cohortId: cohort.cohortId as string,
        courseId: selectedCourseId,
      })

      await addCourseInstructor({
        courseId: selectedCourseId,
        userId: selectedInstructorId,
      })

      handleEnroll(selectedInstructorId, selectedCourseId, createTransaction)

      toast.success("Course added to cohort with instructor successfully")
      setIsAddCourseDialogOpen(false)
      setSelectedCourseId("")
      setSelectedInstructorId("")
      refetch()
    } catch (error) {
      toast.error("Failed to add course to cohort")
      setIsAddCourseDialogOpen(false)
      setSelectedCourseId("")
      setSelectedInstructorId("")
    }
  }

  const handleChangeInstructor = async () => {
    if (!courseToEdit || !selectedInstructorId) {
      toast.error("Please select an instructor")
      return
    }

    try {
      if (courseToEdit.instructors && courseToEdit.instructors.length > 0) {
        await removeCourseInstructor({
          courseId: courseToEdit.courseId,
          userId: courseToEdit.instructors[0].userId,
        })

        await unenrollUser({
          courseId: courseToEdit.courseId,
          userId: courseToEdit.instructors[0].userId,
        })
      }

      await addCourseInstructor({
        courseId: courseToEdit.courseId,
        userId: selectedInstructorId,
      })

      handleEnroll(selectedInstructorId, courseToEdit.courseId, createTransaction)

      toast.success("Course instructor updated successfully")
      setIsChangeInstructorDialogOpen(false)
      setCourseToEdit(null)
      setSelectedInstructorId("")
      refetch()
    } catch (error) {
      toast.error("Failed to update course instructor")
      setIsChangeInstructorDialogOpen(false)
      setCourseToEdit(null)
      setSelectedInstructorId("")
    }
  }

  const handleRemoveInstructor = async () => {
    if (!courseToEdit || !courseToEdit.instructors || courseToEdit.instructors.length === 0) {
      toast.error("No instructor to remove")
      return
    }

    try {
      await removeCourseInstructor({
        courseId: courseToEdit.courseId,
        userId: courseToEdit.instructors[0].userId,
      })

      // Unenroll the instructor
      await unenrollUser({
        courseId: courseToEdit.courseId,
        userId: courseToEdit.instructors[0].userId,
      })

      toast.success("Instructor removed successfully")
      setIsRemoveInstructorAlertOpen(false)
      setCourseToEdit(null)
      refetch()
    } catch (error) {
      toast.error("Failed to remove instructor")
      setIsRemoveInstructorAlertOpen(false)
      setCourseToEdit(null)
    }
  }

  const openChangeInstructorDialog = (course: any) => {
    setCourseToEdit(course)
    setSelectedInstructorId(course.instructors && course.instructors.length > 0 ? course.instructors[0].userId : "")
    setIsChangeInstructorDialogOpen(true)
  }

  const openRemoveInstructorAlert = (course: any) => {
    if (!course.instructors || course.instructors.length === 0) {
      toast.error("No instructor assigned to this course")
      return
    }
    setCourseToEdit(course)
    setIsRemoveInstructorAlertOpen(true)
  }

  const filteredLearners =
    orgUsers?.learners?.filter(
      (learner: User) =>
        !cohort?.learners.some((l: any) => l.id === learner.id) &&
        (getUserName(learner)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          learner.emailAddresses[0].emailAddress?.toLowerCase().includes(searchTerm.toLowerCase())),
    ) || []

  const availableCourses = orgCourses?.filter(
    (course) => !cohort?.courses.some((c: any) => c.courseId === course.courseId),
  )

  const getInstructorName = (instructorId: string) => {
    const instructor = orgUsers?.instructors?.find((i: User) => i.id === instructorId)
    return instructor ? getUserName(instructor) : instructorId
  }

  if (cohortLoading || usersLoading || coursesLoading) {
    return <Spinner />
  }

  if (!cohort) {
    return <div>Cohort not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{cohort.name}</h1>
      </div>

      <Tabs defaultValue="learners" className="w-full">
        <TabsList>
          <TabsTrigger value="learners" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Learners
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learners" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cohort Learners</h2>
            <Dialog
              open={isAddLearnerDialogOpen}
              onOpenChange={(open) => {
                setIsAddLearnerDialogOpen(open)
                if (!open) setSelectedLearnerId("")
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Learner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Learner to Cohort</DialogTitle>
                  <DialogDescription>Select a learner to add to this cohort.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search learners..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto border rounded-md">
                    {filteredLearners?.length > 0 ? (
                      filteredLearners?.map((learner: User) => (
                        <div
                          key={learner.id}
                          className={`flex items-center justify-between p-3 hover:bg-accent cursor-pointer ${
                            selectedLearnerId === learner.id ? "bg-accent" : ""
                          }`}
                          onClick={() => setSelectedLearnerId(learner.id)}
                        >
                          <div>
                            <p className="font-medium">{getUserName(learner)}</p>
                            <p className="text-sm text-muted-foreground">{learner.emailAddresses[0].emailAddress}</p>
                          </div>
                          {selectedLearnerId === learner.id && <UserCheck className="h-5 w-5 text-primary" />}
                        </div>
                      ))
                    ) : (
                      <p className="p-3 text-center text-muted-foreground">No learners found</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddLearnerDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddLearner}>Add to Cohort</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cohort.learners.length > 0 ? (
                    cohort.learners.map((learner: any) => (
                      <TableRow key={learner.id}>
                        <TableCell className="font-medium">{getUserName(learner)}</TableCell>
                        <TableCell>{learner.emailAddresses[0].emailAddress}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No learners in this cohort
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cohort Courses</h2>
            <Dialog
              open={isAddCourseDialogOpen}
              onOpenChange={(open) => {
                setIsAddCourseDialogOpen(open)
                if (!open) {
                  setSelectedCourseId("")
                  setSelectedInstructorId("")
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Course to Cohort</DialogTitle>
                  <DialogDescription>Select a course and assign an instructor.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger id="course">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCourses && availableCourses.length > 0 ? (
                          availableCourses?.map((course: Course) => (
                            <SelectItem key={course.courseId} value={course.courseId}>
                              {course.title}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-muted-foreground">No courses available</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructor">Instructor</Label>
                    <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
                      <SelectTrigger id="instructor">
                        <SelectValue placeholder="Select instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        {orgUsers?.instructors?.map((instructor: User) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {getUserName(instructor)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddCourseDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCourse}>Add to Cohort</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cohort.courses && cohort.courses.length > 0 ? (
                    cohort.courses.map((course: any) => (
                      <TableRow key={course.courseId}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>
                          {course.instructors && course.instructors.length > 0
                            ? getInstructorName(course.instructors[0].userId)
                            : "No instructor assigned"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Active</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openChangeInstructorDialog(course)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Change Instructor
                              </DropdownMenuItem>
                              {course.instructors && course.instructors.length > 0 && (
                                <DropdownMenuItem onClick={() => openRemoveInstructorAlert(course)}>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Remove Instructor
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No courses in this cohort
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Instructor Dialog */}
      <Dialog
        open={isChangeInstructorDialogOpen}
        onOpenChange={(open) => {
          setIsChangeInstructorDialogOpen(open)
          if (!open) {
            setCourseToEdit(null)
            setSelectedInstructorId("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Course Instructor</DialogTitle>
            <DialogDescription>Select a new instructor for {courseToEdit?.title}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newInstructor">Instructor</Label>
              <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
                <SelectTrigger id="newInstructor">
                  <SelectValue placeholder="Select instructor">
                    {selectedInstructorId ? getInstructorName(selectedInstructorId) : "Select instructor"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {orgUsers?.instructors?.map((instructor: User) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      <span className="flex flex-col">
                        <span>{getUserName(instructor)}</span>
                        <span className="text-xs text-muted-foreground">{instructor.emailAddresses[0].emailAddress}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangeInstructorDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeInstructor}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Instructor Alert Dialog */}
      <AlertDialog
        open={isRemoveInstructorAlertOpen}
        onOpenChange={(open) => {
          setIsRemoveInstructorAlertOpen(open)
          if (!open) setCourseToEdit(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Instructor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the instructor from this course? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveInstructor}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AdminCohortPage