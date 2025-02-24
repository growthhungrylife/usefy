import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Archive, BarChartBig, Pencil, Trash2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

const TeacherCourseCard = ({
  course,
  onEdit,
  onDelete,
  onView,
  onArchive,
  onUnarchive,
  onStats,
  isOwner,
}: TeacherCourseCardProps) => {
  const { user } = useUser();
  
  // Check if the current user is enrolled in the course
  const isUserEnrolled = course.enrollments?.some(
    enrollment => enrollment.userId === user?.id
  );
  
  // Show "View Only" only if user is not the owner AND not enrolled
  const showViewOnly = !isOwner && !isUserEnrolled;
  
  return (
    <Card className="course-card-teacher group">
      <CardHeader
        className="course-card-teacher__header"
        onClick={() => onView(course)} // Allow everyone to view the course
      >
        <Image
          src={course.image || "/placeholder.png"}
          alt={course.title}
          width={370}
          height={150}
          className="course-card-teacher__image"
          priority
        />
      </CardHeader>

      <CardContent className="course-card-teacher__content">
        <div className="flex flex-col">
          <CardTitle className="course-card-teacher__title">
            {course.title}
          </CardTitle>

          <CardDescription className="course-card-teacher__category">
            {course.category}
          </CardDescription>

          <p className="text-sm mb-2">
            Status:{" "}
            <span
              className={cn(
                "font-semibold px-2 py-1 rounded",
                course.status === "Published"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              )}
            >
              {course.status}
            </span>
          </p>
          {course.enrollments && (
            <p className="ml-1 mt-1 inline-block text-secondary bg-secondary/10 text-sm font-normal">
              <span className="font-bold text-white-100">
                {course.enrollments.length}
              </span>{" "}
              Enrolled
            </p>
          )}
        </div>

        {/* Responsive buttons */}
        <div className="flex flex-col gap-2 mt-3 sm:flex-row sm:flex-wrap xl:space-y-0 xl:gap-2">
          {isOwner ? (
            <>
              <Button
                className="bg-gray-800 hover:bg-gray-600"
                onClick={() => onEdit(course)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                className="bg-gray-800 hover:bg-gray-600"
                onClick={() => onStats(course)}
              >
                <BarChartBig className="w-4 h-4 mr-2" />
                Stats
              </Button>
              {course.status === "Published" || course.status === "Draft" ? (
                <Button
                  className="bg-gray-800 hover:bg-gray-600"
                  onClick={() => onArchive(course)}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              ) : (
                <Button
                  className="bg-gray-800 hover:bg-gray-600"
                  onClick={() => onUnarchive(course)}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Unarchive
                </Button>
              )}
              <Button
                className="bg-gray-800 hover:bg-gray-600 text-red-500"
                onClick={() => onDelete(course)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          ) : (
            showViewOnly && <p className="text-sm text-gray-500 italic">View Only</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherCourseCard;