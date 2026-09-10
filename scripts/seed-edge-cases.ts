import { db } from '../server/db';
import { users, trips, tripMetadata, questions, answers, comments, topics, chatThreads, chatMessages } from '../shared/schema';

/**
 * Extends the existing seed data with edge cases for testing user normalization
 * This script adds users with missing names, avatars, and other edge cases
 */
async function seedEdgeCases() {
  console.log('🌱 Starting edge case seed data...');

  try {
    // Edge case users for testing normalization
    const edgeCaseUsers = [
      {
        id: 'user-no-name',
        email: 'no.name@example.com',
        name: null,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        image: null,
        provider: 'email',
        emailVerified: true,
      },
      {
        id: 'user-email-only',
        email: 'test.email.fallback@ceylonexpand.com',
        name: null,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        image: null,
        provider: 'google',
        emailVerified: true,
      },
      {
        id: 'user-partial-name',
        email: 'partial.name@example.com',
        name: null,
        firstName: 'John',
        lastName: null,
        profileImageUrl: 'https://example.com/invalid-avatar.jpg',
        image: null,
        provider: 'facebook',
        emailVerified: true,
      },
      {
        id: 'user-complete-profile',
        email: 'complete.profile@example.com',
        name: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        profileImageUrl: 'https://via.placeholder.com/150',
        image: 'https://via.placeholder.com/150',
        provider: 'microsoft',
        emailVerified: true,
      },
      {
        id: 'user-malformed-data',
        email: null,
        name: '',
        firstName: '   ',
        lastName: '   ',
        profileImageUrl: 'not-a-valid-url',
        image: '',
        provider: 'apple',
        emailVerified: false,
      },
    ];

    // Insert edge case users
    for (const user of edgeCaseUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
    }

    // Create edge case trips with organizers that have missing data
    const edgeCaseTrips: (typeof trips.$inferInsert)[] = [
      {
        id: 'trip-no-name-organizer',
        title: 'Trip by User with No Name',
        fromLocation: 'Colombo',
        toLocation: 'Kandy',
        date: new Date('2025-10-15'),
        time: '08:00',
        seatsAvailable: 3,
        price: '1500.00',
        region: 'Central',
        contactInfo: 'Contact via chat',
        organizerId: 'user-no-name',
        status: 'active',
        category: 'culture',
      },
      {
        id: 'trip-email-fallback-organizer',
        title: 'Trip by Email-Only User',
        fromLocation: 'Galle',
        toLocation: 'Matara',
        date: new Date('2025-10-20'),
        time: '10:00',
        seatsAvailable: 2,
        price: '800.00',
        region: 'Southern',
        contactInfo: 'Contact via chat',
        organizerId: 'user-email-only',
        status: 'active',
        category: 'beach',
      },
      {
        id: 'trip-missing-optional-fields',
        title: 'Trip with Missing Optional Fields',
        fromLocation: 'Negombo',
        toLocation: 'Anuradhapura',
        date: new Date('2025-11-01'),
        time: '06:00',
        seatsAvailable: 4,
        price: null, // Missing price
        region: 'North Central',
        contactInfo: 'Contact via chat',
        organizerId: 'user-partial-name',
        status: 'active',
        category: 'unknown',
        tags: null, // Missing tags
      },
    ];

    for (const trip of edgeCaseTrips) {
      await db.insert(trips).values(trip).onConflictDoNothing();
    }
    await db.insert(tripMetadata).values([
      {
        tripId: 'trip-no-name-organizer',
        notes: 'Test trip with organizer who has no name data',
      },
      {
        tripId: 'trip-email-fallback-organizer',
        notes: 'Test trip with organizer using email fallback for display name',
      },
      {
        tripId: 'trip-missing-optional-fields',
        notes: null,
      },
    ]).onConflictDoNothing();

    // Create topics for community edge cases
    const testTopic = {
      id: 'topic-edge-case',
      name: 'Edge Case Testing',
      slug: 'edge-case-testing',
      description: 'Topic for testing edge cases in community features',
    };

    await db.insert(topics).values(testTopic).onConflictDoNothing();

    // Community edge cases - questions with minimal user data
    const edgeCaseQuestions = [
      {
        id: 'question-anonymous-user',
        title: 'Question by User with No Name',
        body: 'This is a question posted by a user who has no name data.',
        userId: 'user-no-name',
        topicId: 'topic-edge-case',
        isAnonymous: false,
        tags: ['testing', 'edge-case'],
      },
      {
        id: 'question-email-fallback',
        title: 'Question by Email-Only User',
        body: 'This question tests the email fallback display name functionality.',
        userId: 'user-email-only',
        topicId: 'topic-edge-case',
        isAnonymous: false,
        tags: ['email-fallback'],
      },
      {
        id: 'question-malformed-user',
        title: 'Question by User with Malformed Data',
        body: 'Testing question display when user has malformed data.',
        userId: 'user-malformed-data',
        topicId: 'topic-edge-case',
        isAnonymous: true, // Anonymous to test fallback
        tags: ['malformed-data'],
      },
    ];

    for (const question of edgeCaseQuestions) {
      await db.insert(questions).values(question).onConflictDoNothing();
    }

    // Answers with edge case users
    const edgeCaseAnswers = [
      {
        id: 'answer-no-name-user',
        body: 'This is an answer by a user with no name.',
        questionId: 'question-email-fallback',
        userId: 'user-no-name',
      },
      {
        id: 'answer-partial-name-user',
        body: 'Answer by user with only first name.',
        questionId: 'question-anonymous-user',
        userId: 'user-partial-name',
      },
    ];

    for (const answer of edgeCaseAnswers) {
      await db.insert(answers).values(answer).onConflictDoNothing();
    }

    // Comments with edge case users
    const edgeCaseComments = [
      {
        id: 'comment-no-name',
        content: 'Comment by user with no name data.',
        tripId: 'trip-email-fallback-organizer',
        userId: 'user-no-name',
      },
      {
        id: 'comment-malformed-user',
        content: 'Comment by user with malformed data.',
        tripId: 'trip-no-name-organizer',
        userId: 'user-malformed-data',
      },
    ];

    for (const comment of edgeCaseComments) {
      await db.insert(comments).values(comment).onConflictDoNothing();
    }

    // Chat edge cases - threads and messages with users having no names
    const edgeChatThread = {
      id: 'thread-edge-case',
      tripId: 'trip-no-name-organizer',
    };

    await db.insert(chatThreads).values(edgeChatThread).onConflictDoNothing();

    const edgeCaseMessages = [
      {
        id: 'message-no-name-sender',
        threadId: 'thread-edge-case',
        authorId: 'user-no-name',
        body: 'Message from user with no name data.',
        messageType: 'text' as const,
      },
      {
        id: 'message-email-fallback-sender',
        threadId: 'thread-edge-case',
        authorId: 'user-email-only',
        body: 'Message from user using email fallback.',
        messageType: 'text' as const,
      },
    ];

    for (const message of edgeCaseMessages) {
      await db.insert(chatMessages).values({
        id: message.id,
        threadId: message.threadId,
        senderId: message.authorId,
        text: message.body,
        kind: message.messageType,
      }).onConflictDoNothing();
    }

    console.log('✅ Edge case seed data completed successfully!');
    console.log('Created edge case data for:');
    console.log('- 5 users with various missing data scenarios');
    console.log('- 3 trips with different organizer data conditions');
    console.log('- 3 community questions with edge case authors');
    console.log('- 2 answers from edge case users');
    console.log('- 2 comments from edge case users');
    console.log('- 1 chat thread with 2 messages from edge case users');

  } catch (error) {
    console.error('❌ Error seeding edge case data:', error);
    throw error;
  }
}

// Run the seed if this file is executed directly
if (require.main === module) {
  seedEdgeCases()
    .then(() => {
      console.log('🎉 Edge case seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Edge case seeding failed:', error);
      process.exit(1);
    });
}

export { seedEdgeCases };