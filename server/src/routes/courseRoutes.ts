import express from "express";
import multer from "multer";
import {
  createCourse,
  archiveCourse,
  unarchiveCourse,
  deleteCourse,
  getCourse,
  updateCourse,
  addCourseInstructor,
  removeCourseInstructor,
  getCourseInstructors,
  getUploadVideoUrl,
  getUploadImageUrl,
  createAssignment,
  getAssignments,
  deleteAssignment,
  getAssignment,
  updateAssignment,
  createSubmission,
  getUploadFileUrl,
  createComment,
  upvoteComment,
  downvoteComment,
  createReply,
  getComments,
  likeChapter,
  dislikeChapter,
  getUserCourseSubmissions,
  enrollUser,
  unenrollUser,
  fixCourseImageUrls,
} from "../controllers/courseController";
import { requireAuth } from "@clerk/express";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/", 
  requireAuth(), 
  createCourse
);
router.post(
  "/fix-image-urls", 
  requireAuth(), 
  fixCourseImageUrls
);

router.get(
  "/:courseId", 
  getCourse
);

// orgId for notification link
router.put(
  "/:orgId/:courseId", 
  requireAuth(), 
  upload.none(), 
  updateCourse
);

router.put(
  "/:courseId/archive", 
  requireAuth(), 
  archiveCourse
);

router.put(
  "/:courseId/unarchive", 
  requireAuth(), 
  unarchiveCourse
);

router.delete(
  "/:courseId", 
  requireAuth(), 
  deleteCourse
);

router.post(
  "/:courseId/instructors",
  requireAuth(),
  addCourseInstructor
);

router.delete(
  "/:courseId/instructors",
  requireAuth(),
  removeCourseInstructor
);

router.get(
  "/:courseId/instructors",
  requireAuth(),
  getCourseInstructors
);

router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/get-upload-url",
  requireAuth(),
  getUploadVideoUrl
);

router.post(
  "/:courseId/get-upload-image-url",
  requireAuth(),
  getUploadImageUrl
);

router.get(
  "/:courseId/sections/:sectionId/chapters/:chapterId/assignments/:assignmentId",
  getAssignment
); // requireAuth(),

router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/assignments",
  requireAuth(),
  createAssignment
);
router.get(
  "/:courseId/sections/:sectionId/chapters/:chapterId/assignments",
  requireAuth(),
  getAssignments
);
router.delete(
  "/:courseId/sections/:sectionId/chapters/:chapterId/assignments/:assignmentId",
  requireAuth(),
  deleteAssignment
);
router.put(
  "/:courseId/sections/:sectionId/chapters/:chapterId/assignments/:assignmentId",
  requireAuth(),
  updateAssignment
);

router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/assignments/:assignmentId/submit",
  requireAuth(),
  createSubmission
);

router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/get-upload-file-url",
  requireAuth(),
  getUploadFileUrl
);

router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/comments",
  requireAuth(),
  createComment
);
router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/comments/:commentId/upvote",
  requireAuth(),
  upvoteComment
);
router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/comments/:commentId/downvote",
  requireAuth(),
  downvoteComment
);
router.get(
  "/:courseId/sections/:sectionId/chapters/:chapterId/comments",
  requireAuth(),
  getComments
);

// orgId for notification link
router.post(
  "/:orgId/:courseId/sections/:sectionId/chapters/:chapterId/comments/:commentId/replies",
  requireAuth(),
  createReply
);

router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/like",
  requireAuth(),
  likeChapter
);
router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/dislike",
  requireAuth(),
  dislikeChapter
);

router.get(
  "/:courseId/submissions/:userId",
  requireAuth(),
  getUserCourseSubmissions
);

router.post(
  "/:courseId/enroll/:userId",
  requireAuth(),
  enrollUser
);

router.post(
  "/:courseId/unenroll/:userId", 
  requireAuth(), 
  unenrollUser
);

export default router;
