import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertTripSchema, 
  insertCommentSchema, 
  insertRatingSchema, 
  insertReportSchema,
  insertTopicSchema,
  insertQuestionSchema,
  insertAnswerSchema,
  insertVoteSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phoneNumber, bio } = req.body;
      
      const updatedUser = await storage.upsertUser({
        id: userId,
        email: req.user.claims.email,
        firstName: req.user.claims.first_name,
        lastName: req.user.claims.last_name,
        profileImageUrl: req.user.claims.profile_image_url,
        phoneNumber,
        bio,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Trip routes
  app.post('/api/trips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tripData = insertTripSchema.parse({ ...req.body, organizerId: userId });
      
      const trip = await storage.createTrip(tripData);
      res.json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trip data", errors: error.errors });
      }
      console.error("Error creating trip:", error);
      res.status(500).json({ message: "Failed to create trip" });
    }
  });

  app.get('/api/trips', async (req, res) => {
    try {
      const filters = {
        from: req.query.from as string,
        to: req.query.to as string,
        date: req.query.date as string,
        region: req.query.region as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        search: req.query.search as string,
      };
      
      const trips = await storage.searchTrips(filters);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.get('/api/trips/:id', async (req, res) => {
    try {
      const trip = await storage.getTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      res.json(trip);
    } catch (error) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ message: "Failed to fetch trip" });
    }
  });

  app.patch('/api/trips/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tripId = req.params.id;
      
      // Check if user is the organizer
      const trip = await storage.getTrip(tripId);
      if (!trip || trip.organizerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this trip" });
      }
      
      const updatedTrip = await storage.updateTrip(tripId, req.body);
      res.json(updatedTrip);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(500).json({ message: "Failed to update trip" });
    }
  });

  app.delete('/api/trips/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tripId = req.params.id;
      
      // Check if user is the organizer
      const trip = await storage.getTrip(tripId);
      if (!trip || trip.organizerId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this trip" });
      }
      
      await storage.deleteTrip(tripId);
      res.json({ message: "Trip deleted successfully" });
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ message: "Failed to delete trip" });
    }
  });

  // Update trip status (mark as completed/inactive)
  app.patch('/api/trips/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.claims.sub;

      // Verify valid status
      if (!["active", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be active, completed, or cancelled" });
      }

      // Verify the user owns this trip
      const trip = await storage.getTrip(id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      if (trip.organizerId !== userId) {
        return res.status(403).json({ message: "You can only update your own trips" });
      }

      const updatedTrip = await storage.updateTrip(id, { status });
      res.json(updatedTrip);
    } catch (error) {
      console.error("Error updating trip status:", error);
      res.status(500).json({ message: "Failed to update trip status" });
    }
  });

  // User trip routes
  app.get('/api/users/trips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trips = await storage.getUserTrips(userId);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching user trips:", error);
      res.status(500).json({ message: "Failed to fetch user trips" });
    }
  });

  app.get('/api/users/participations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const participations = await storage.getUserParticipations(userId);
      res.json(participations);
    } catch (error) {
      console.error("Error fetching user participations:", error);
      res.status(500).json({ message: "Failed to fetch user participations" });
    }
  });

  // Trip participation routes
  app.post('/api/trips/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tripId = req.params.id;
      
      const participation = await storage.joinTrip({
        tripId,
        userId,
        status: "pending",
      });
      
      res.json(participation);
    } catch (error) {
      console.error("Error joining trip:", error);
      res.status(500).json({ message: "Failed to join trip" });
    }
  });

  app.get('/api/trips/:id/participants', isAuthenticated, async (req, res) => {
    try {
      const participants = await storage.getTripParticipants(req.params.id);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching trip participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  app.patch('/api/participants/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const participation = await storage.updateParticipationStatus(req.params.id, status);
      res.json(participation);
    } catch (error) {
      console.error("Error updating participation status:", error);
      res.status(500).json({ message: "Failed to update participation status" });
    }
  });

  // Comment routes
  app.post('/api/trips/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tripId = req.params.id;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        tripId,
        userId,
      });
      
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get('/api/trips/:id/comments', async (req, res) => {
    try {
      const comments = await storage.getTripComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.delete('/api/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteComment(req.params.id);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Rating routes
  app.post('/api/trips/:id/ratings', isAuthenticated, async (req: any, res) => {
    try {
      const raterId = req.user.claims.sub;
      const tripId = req.params.id;
      const ratingData = insertRatingSchema.parse({
        ...req.body,
        tripId,
        raterId,
      });
      
      const rating = await storage.createRating(ratingData);
      res.json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rating data", errors: error.errors });
      }
      console.error("Error creating rating:", error);
      res.status(500).json({ message: "Failed to create rating" });
    }
  });

  app.get('/api/trips/:id/ratings', async (req, res) => {
    try {
      const ratings = await storage.getTripRatings(req.params.id);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  app.get('/api/users/:id/ratings', async (req, res) => {
    try {
      const ratings = await storage.getUserRatings(req.params.id);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching user ratings:", error);
      res.status(500).json({ message: "Failed to fetch user ratings" });
    }
  });

  // Report routes
  app.post('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const reporterId = req.user.claims.sub;
      const reportData = insertReportSchema.parse({
        ...req.body,
        reporterId,
      });
      
      const report = await storage.createReport(reportData);
      res.json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report data", errors: error.errors });
      }
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Community Q&A Routes
  
  // Topics
  app.post('/api/topics', isAuthenticated, async (req: any, res) => {
    try {
      const topicData = insertTopicSchema.parse(req.body);
      const topic = await storage.createTopic(topicData);
      res.json(topic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid topic data", errors: error.errors });
      }
      console.error("Error creating topic:", error);
      res.status(500).json({ message: "Failed to create topic" });
    }
  });

  app.get('/api/topics', async (req, res) => {
    try {
      const topics = await storage.getTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.get('/api/topics/:slug', async (req, res) => {
    try {
      const topic = await storage.getTopic(req.params.slug);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.json(topic);
    } catch (error) {
      console.error("Error fetching topic:", error);
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });

  // Questions
  app.post('/api/questions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const questionData = insertQuestionSchema.parse({ ...req.body, userId });
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.get('/api/questions', async (req, res) => {
    try {
      const filters = {
        search: req.query.q as string,
        topic: req.query.topic as string,
        sort: req.query.sort as 'top' | 'new' | 'unanswered',
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };
      const questions = await storage.getQuestions(filters);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get('/api/questions/:id', async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  app.patch('/api/questions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // First check if the question exists and belongs to the user
      const existingQuestion = await storage.getQuestion(req.params.id);
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      if (existingQuestion.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this question" });
      }
      
      const questionData = insertQuestionSchema.partial().parse(req.body);
      const question = await storage.updateQuestion(req.params.id, questionData);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete('/api/questions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // First check if the question exists and belongs to the user
      const existingQuestion = await storage.getQuestion(req.params.id);
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      if (existingQuestion.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this question" });
      }
      
      await storage.deleteQuestion(req.params.id);
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Answers
  app.post('/api/questions/:questionId/answers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const answerData = insertAnswerSchema.parse({ 
        ...req.body, 
        userId, 
        questionId: req.params.questionId 
      });
      const answer = await storage.createAnswer(answerData);
      res.json(answer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid answer data", errors: error.errors });
      }
      console.error("Error creating answer:", error);
      res.status(500).json({ message: "Failed to create answer" });
    }
  });

  app.get('/api/questions/:questionId/answers', async (req, res) => {
    try {
      const answers = await storage.getQuestionAnswers(req.params.questionId);
      res.json(answers);
    } catch (error) {
      console.error("Error fetching answers:", error);
      res.status(500).json({ message: "Failed to fetch answers" });
    }
  });

  app.post('/api/questions/:questionId/accept/:answerId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if the user owns the question
      const question = await storage.getQuestion(req.params.questionId);
      if (!question || question.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to accept answers for this question" });
      }
      
      await storage.acceptAnswer(req.params.questionId, req.params.answerId);
      res.json({ message: "Answer accepted successfully" });
    } catch (error) {
      console.error("Error accepting answer:", error);
      res.status(500).json({ message: "Failed to accept answer" });
    }
  });

  // Votes
  app.post('/api/vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const voteData = insertVoteSchema.parse({ ...req.body, userId });
      
      // Check if user already voted
      const existingVote = await storage.getUserVote(userId, voteData.questionId, voteData.answerId);
      
      if (existingVote) {
        if (existingVote.voteType === voteData.voteType) {
          // Same vote type - remove vote
          await storage.deleteVote(userId, voteData.questionId, voteData.answerId);
          res.json({ message: "Vote removed" });
        } else {
          // Different vote type - update vote
          const vote = await storage.updateVote(userId, voteData.questionId, voteData.answerId, voteData.voteType);
          res.json(vote);
        }
      } else {
        // New vote
        const vote = await storage.createVote(voteData);
        res.json(vote);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      }
      console.error("Error processing vote:", error);
      res.status(500).json({ message: "Failed to process vote" });
    }
  });

  app.get('/api/vote/:type/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, id } = req.params;
      
      const questionId = type === 'question' ? id : undefined;
      const answerId = type === 'answer' ? id : undefined;
      
      const vote = await storage.getUserVote(userId, questionId, answerId);
      res.json(vote);
    } catch (error) {
      console.error("Error fetching user vote:", error);
      res.status(500).json({ message: "Failed to fetch vote" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
