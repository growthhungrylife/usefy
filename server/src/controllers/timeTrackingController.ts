import { Request, Response } from "express";
import TimeTracking from "../models/timeTrackingModel";
import { v4 as uuidv4 } from 'uuid';
import { getAuth } from "@clerk/express";
import { AnyItem } from "dynamoose/dist/Item";

interface TimeTrackingRecord {
  timeTrackingId: string;
  userId: string;
  courseId: string;
  sectionId: string;
  chapterId: string;
  durationMs: number;
  trackedAt: string;
  date: string;
}

interface ChapterStats {
  totalUsers: number;
  averageDuration: number;
  totalDuration: number;
  dataPoints: Array<{
    date: string;
    duration: number;
  }>;
}

interface BatchChapterStats {
  [key: string]: ChapterStats;
}

export const createTimeTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, courseId, sectionId, chapterId, durationMs } = req.body;
    const trackedAt = new Date().toISOString();
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Validation
    if (!userId || !courseId || !sectionId || !chapterId || !durationMs) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (typeof durationMs !== 'number' || durationMs <= 0) {
      res.status(400).json({ message: "Invalid duration value" });
      return;
    }

    const newTimeTracking = new TimeTracking({
      timeTrackingId: uuidv4(),
      userId,
      courseId,
      sectionId,
      chapterId,
      durationMs,
      trackedAt,
      date
    });

    await newTimeTracking.save();
    
    res.status(201).json({ 
      message: "", 
      data: newTimeTracking 
    });
  } catch (error) {
    console.error("Error creating time tracking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChapterTimeTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chapterId } = req.params;
    const timeRecords = await TimeTracking.scan("chapterId").eq(chapterId).exec();
    
    res.json({
      message: "",
      data: timeRecords
    });
  } catch (error) {
    console.error("Error retrieving time tracking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserCourseTimeTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, courseId } = req.params;
    
    if (!userId || !courseId) {
      res.status(400).json({ 
        message: "Missing required parameters",
        data: [],
        explanation: "userId and courseId are required"
      });
      return;
    }

    console.log('Fetching time tracking for:', { userId, courseId });

    // Use the global secondary index for more efficient querying
    const records = await TimeTracking.scan()
      .where('userId').eq(userId)
      .and().where('courseId').eq(courseId)
      .exec();

    console.log('Raw records from database:', records);

    if (!records || records.length === 0) {
      console.log('No records found');
      res.json({
        message: "No time tracking data found",
        data: [],
        explanation: "No time tracking records found for this user and course"
      });
      return;
    }

    // Process records to ensure durationMs is a number
    const processedRecords = records.map(record => {
      const durationMs = Number(record.durationMs) || 0;
      return {
        ...record,
        durationMs,
        duration: Math.round(durationMs / 1000) // Convert to seconds
      };
    });

    console.log('Processed records:', processedRecords);

    // Return the processed records in a consistent format
    res.json({
      message: "Time tracking data retrieved successfully",
      data: processedRecords,
      explanation: "Successfully retrieved time tracking data"
    });
  } catch (error) {
    console.error("Error retrieving course time tracking:", error);
    res.status(500).json({ 
      message: "Internal server error",
      data: [],
      explanation: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
};

export const getChapterStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId, chapterId } = req.query;
    
    if (!courseId || !chapterId) {
      res.status(400).json({ 
        message: "Missing required parameters",
        data: {
          totalUsers: 0,
          averageDuration: 0,
          totalDuration: 0,
          dataPoints: []
        },
        explanation: "courseId and chapterId are required"
      });
      return;
    }

    console.log('Fetching chapter stats for:', { courseId, chapterId });

    // Simple query without complex filtering
    const records = await TimeTracking.scan()
      .where('courseId').eq(courseId)
      .and().where('chapterId').eq(chapterId)
      .exec();

    console.log('Raw records for chapter:', records);

    // If no records found, return empty stats
    if (!records || records.length === 0) {
      console.log('No records found for chapter');
      res.json({
        message: "No time tracking data found",
        data: {
          totalUsers: 0,
          averageDuration: 0,
          totalDuration: 0,
          dataPoints: []
        },
        explanation: "No time tracking records found for this chapter"
      });
      return;
    }

    // Calculate unique users and their total durations
    const userDurations = records.reduce((acc: { [key: string]: number }, record) => {
      if (!acc[record.userId]) {
        acc[record.userId] = 0;
      }
      acc[record.userId] += Number(record.durationMs) || 0;
      return acc;
    }, {});

    const uniqueUsers = Object.keys(userDurations).length;
    const totalDuration = Object.values(userDurations).reduce((sum, duration) => sum + duration, 0);
    const averageDuration = uniqueUsers > 0 ? totalDuration / uniqueUsers : 0;

    // Group records by date for data points
    const dataPoints = records.reduce((acc: any[], record) => {
      const date = record.date;
      const existingPoint = acc.find(p => p.date === date);
      const duration = Number(record.durationMs) || 0;
      
      if (existingPoint) {
        existingPoint.duration += duration;
      } else {
        acc.push({
          date,
          duration
        });
      }
      
      return acc;
    }, []).sort((a, b) => a.date.localeCompare(b.date));

    const stats = {
      totalUsers: uniqueUsers,
      averageDuration: Math.round(averageDuration / 1000), // in seconds
      totalDuration: Math.round(totalDuration / 1000),      // in seconds
      dataPoints
    };

    console.log('Processed chapter stats:', stats);

    res.json({
      message: "Chapter statistics retrieved successfully",
      data: stats,
      explanation: "Successfully retrieved chapter statistics"
    });
  } catch (error) {
    console.error("Error getting chapter stats:", error);
    res.status(500).json({ 
      message: "Internal server error",
      data: {
        totalUsers: 0,
        averageDuration: 0,
        totalDuration: 0,
        dataPoints: []
      },
      explanation: error instanceof Error ? error.message : "Unknown error occurred while retrieving chapter stats"
    });
  }
};

export const getCourseStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.query;
    
    if (!courseId) {
      res.status(400).json({ 
        message: "Missing required parameters",
        data: {
          totalUsers: 0,
          totalDuration: 0,
          averageDurationPerUser: 0,
          dailyData: []
        },
        explanation: "courseId is required"
      });
      return;
    }

    // Simple query without complex filtering
    const records = await TimeTracking.scan()
      .where('courseId').eq(courseId)
      .exec();

    if (!records || records.length === 0) {
      res.json({
        message: "No time tracking data found",
        data: {
          totalUsers: 0,
          totalDuration: 0,
          averageDurationPerUser: 0,
          dailyData: []
        },
        explanation: "No time tracking records found for this course"
      });
      return;
    }

    // Calculate unique users
    const uniqueUsers = new Set(records.map(record => record.userId)).size;
    
    // Calculate total duration with proper number conversion
    const totalDuration = records.reduce((sum, record) => {
      const durationMs = Number(record.durationMs) || 0;
      return sum + durationMs;
    }, 0);
    
    // Calculate average duration per user
    const averageDurationPerUser = uniqueUsers > 0 ? totalDuration / uniqueUsers : 0;

    // Group by date for time series data
    const dailyData = records.reduce((acc: any[], record) => {
      const date = record.date;
      const existingDay = acc.find(d => d.date === date);
      const durationMs = Number(record.durationMs) || 0;
      
      if (existingDay) {
        existingDay.duration += durationMs;
        if (!existingDay.activeUsers.includes(record.userId)) {
          existingDay.activeUsers.push(record.userId);
        }
      } else {
        acc.push({
          date,
          duration: durationMs,
          activeUsers: [record.userId]
        });
      }
      
      return acc;
    }, []);

    // Process daily data to count unique users per day
    const processedDailyData = dailyData.map(day => ({
      date: day.date,
      duration: Math.round(day.duration / 1000), // Convert to seconds
      activeUsers: day.activeUsers.length
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      message: "Course statistics retrieved successfully",
      data: {
        totalUsers: uniqueUsers,
        totalDuration: Math.round(totalDuration / 1000), // Convert to seconds
        averageDurationPerUser: Math.round(averageDurationPerUser / 1000), // Convert to seconds
        dailyData: processedDailyData
      },
      explanation: "Successfully retrieved course statistics"
    });
  } catch (error) {
    console.error("Error getting course stats:", error);
    res.status(500).json({ 
      message: "Internal server error",
      data: {
        totalUsers: 0,
        totalDuration: 0,
        averageDurationPerUser: 0,
        dailyData: []
      },
      explanation: error instanceof Error ? error.message : "Unknown error occurred while retrieving course stats"
    });
  }
};

export const getBatchChapterStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId, chapterIds } = req.body;
    
    if (!courseId || !chapterIds || !Array.isArray(chapterIds)) {
      res.status(400).json({ 
        message: "Missing required parameters",
        data: {},
        explanation: "courseId and chapterIds array are required"
      });
      return;
    }

    console.log('Fetching batch chapter stats for:', { courseId, chapterIds });

    const allChapterStats: BatchChapterStats = {};

    // Process each chapter
    for (const chapterId of chapterIds) {
      try {
        const records = await TimeTracking.scan()
          .where('courseId').eq(courseId)
          .and().where('chapterId').eq(chapterId)
          .limit(1000)
          .exec();

        console.log(`Raw records for chapter ${chapterId}:`, records);

        if (!records || records.length === 0) {
          allChapterStats[chapterId] = {
            totalUsers: 0,
            averageDuration: 0,
            totalDuration: 0,
            dataPoints: []
          };
          continue;
        }

        // Calculate unique users and their total durations
        const userDurations = records.reduce((userAcc: { [key: string]: number }, record) => {
          if (!userAcc[record.userId]) {
            userAcc[record.userId] = 0;
          }
          userAcc[record.userId] += Number(record.durationMs) || 0;
          return userAcc;
        }, {});

        const uniqueUsers = Object.keys(userDurations).length;
        const totalDuration = Object.values(userDurations).reduce((sum, duration) => sum + duration, 0);
        const averageDuration = uniqueUsers > 0 ? totalDuration / uniqueUsers : 0;

        // Group records by date for data points
        const dataPoints = records.reduce((dateAcc: { [key: string]: number }, record) => {
          const date = record.date.split('T')[0];
          if (!dateAcc[date]) {
            dateAcc[date] = 0;
          }
          dateAcc[date] += Number(record.durationMs) || 0;
          return dateAcc;
        }, {});

        allChapterStats[chapterId] = {
          totalUsers: uniqueUsers,
          averageDuration: Math.round(averageDuration / 1000),
          totalDuration: Math.round(totalDuration / 1000),
          dataPoints: Object.entries(dataPoints)
            .map(([date, duration]) => ({
              date,
              duration: Math.round(duration / 1000)
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
        };

        console.log(`Processed stats for chapter ${chapterId}:`, allChapterStats[chapterId]);

        // Add a small delay between chapters
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing chapter ${chapterId}:`, error);
        allChapterStats[chapterId] = {
          totalUsers: 0,
          averageDuration: 0,
          totalDuration: 0,
          dataPoints: []
        };
      }
    }

    console.log('Final batch chapter stats:', allChapterStats);

    res.json({
      message: "Batch chapter statistics retrieved successfully",
      data: allChapterStats,
      explanation: "Successfully retrieved statistics for all requested chapters"
    });
  } catch (error) {
    console.error("Error retrieving batch chapter stats:", error);
    res.status(500).json({ 
      message: "Internal server error",
      data: {},
      explanation: error instanceof Error ? error.message : "Unknown error occurred while retrieving batch chapter statistics"
    });
  }
};