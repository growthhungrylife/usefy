import { Request, Response } from "express";
import Cohort from "../models/cohortModel";
import Course from "../models/courseModel";
import { clerkClient } from "..";

export const createCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId, name } = req.body;
    const organizationId = req.params.organizationId;

    try {
        const cohort = new Cohort({
            cohortId,
            name,
            organizationId,
            instructors: [],
            learners: [],
            courses: [],
        });
        await cohort.save();
        res.json({ message: "Cohort created successfully", data: cohort });
    } catch (error) {
        res.status(500).json({ message: "Error creating cohort", error });
    }
};

export const getCohorts = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.params.organizationId;
    try {
        const cohorts = await Cohort.scan("organizationId").eq(organizationId).exec();
        res.json({ message: "Cohorts retrieved successfully", data: cohorts });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving cohorts", error });
    }
};

export const getCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    try {
        const cohortInfo = await Cohort.get(cohortId);

        if (!cohortInfo) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }

        const courseIds = cohortInfo.courses?.map((course: any) => course.courseId) || [];
        const courses = courseIds.length > 0 ? await Course.batchGet(courseIds) : [];

        const learnerIds = cohortInfo.learners?.map((learner: any) => learner.userId) || [];
        const learners = learnerIds.length > 0 ? (await clerkClient.users.getUserList({ userId: Array.from(learnerIds) })).data : [];

        const cohort = {
            cohortId: cohortInfo.cohortId,
            name: cohortInfo.name,
            organizationId: cohortInfo.organizationId,
            learners,
            courses,
        };

        res.json({ message: "Cohort retrieved successfully", data: cohort });
    } catch (error) {
        console.error("Error retrieving cohort:", error);
        res.status(500).json({ message: "Error retrieving cohort", error });
    }
};

export const deleteCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    try {
        const cohort = await Cohort.get(cohortId);
        if (!cohort) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }
        await Cohort.delete(cohortId);
        res.json({ message: "Cohort deleted successfully", data: cohort });
    } catch (error) {
        res.status(500).json({ message: "Error deleting cohort", error });
    }
};

export const updateCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const { name } = req.body;
    try {
        const cohort = await Cohort.get(cohortId);
        if (!cohort) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }
        cohort.name = name;
        await cohort.save();
        res.json({ message: "Cohort updated successfully", data: cohort });
    } catch (error) {
        res.status(500).json({ message: "Error updating cohort", error });
    }
};



export const addLearnerToCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const { learnerId } = req.body;
    try {
        const cohort = await Cohort.get(cohortId);
        if (!cohort) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }
        cohort.learners.push({ userId: learnerId });
        await cohort.save();
        res.json({ message: "Learner added to cohort successfully", data: cohort });
    } catch (error) {
        res.status(500).json({ message: "Error adding learner to cohort", error });
    }
};

export const removeLearnerFromCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const { learnerId } = req.body;
    try {
        const cohort = await Cohort.get(cohortId);
        if (!cohort) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }
        cohort.learners = cohort.learners.filter((learner: any) => learner.userId !== learnerId);
        await cohort.save();
        res.json({ message: "Learner removed from cohort successfully", data: cohort });
    } catch (error) {
        res.status(500).json({ message: "Error removing learner from cohort", error });
    }
};

export const addCourseToCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const { courseId } = req.body;
    try {
        const cohort = await Cohort.get(cohortId);
        if (!cohort) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }
        cohort.courses.push({ courseId });
        await cohort.save();
        res.json({ message: "Course added to cohort successfully", data: cohort });
    } catch (error) {
        res.status(500).json({ message: "Error adding course to cohort", error });
    }
};

export const removeCourseFromCohort = async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const { courseId } = req.body;
    try {
        const cohort = await Cohort.get(cohortId);
        if (!cohort) {
            res.status(404).json({ message: "Cohort not found" });
            return;
        }
        cohort.courses = cohort.courses.filter((course: any) => course.courseId !== courseId);
        await cohort.save();
        res.json({ message: "Course removed from cohort successfully", data: cohort });
    } catch (error) {
        res.status(500).json({ message: "Error removing course from cohort", error });
    }
};