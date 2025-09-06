import { create } from 'zustand';

export type TripStatus = 'active' | 'inactive' | 'full' | 'completed' | 'cancelled' | 'deleted' | 'under_review';
export type QuestionVisibility = 'public' | 'hidden';

interface UserContentState {
  // Trip status optimistic updates
  tripStatuses: Record<string, TripStatus>;
  setTripStatus: (tripId: string, status: TripStatus) => void;
  revertTripStatus: (tripId: string) => void;
  
  // Question visibility optimistic updates
  questionVisibilities: Record<string, QuestionVisibility>;
  setQuestionVisibility: (questionId: string, visibility: QuestionVisibility) => void;
  revertQuestionVisibility: (questionId: string) => void;
  
  // Loading states for ongoing mutations
  isUpdatingTrip: Record<string, boolean>;
  isUpdatingQuestion: Record<string, boolean>;
  setTripUpdating: (tripId: string, isUpdating: boolean) => void;
  setQuestionUpdating: (questionId: string, isUpdating: boolean) => void;
}

export const useUserContentStore = create<UserContentState>((set, get) => ({
  // Trip status management
  tripStatuses: {},
  setTripStatus: (tripId: string, status: TripStatus) => {
    set((state) => ({
      tripStatuses: {
        ...state.tripStatuses,
        [tripId]: status,
      },
    }));
  },
  revertTripStatus: (tripId: string) => {
    set((state) => {
      const { [tripId]: removed, ...rest } = state.tripStatuses;
      return { tripStatuses: rest };
    });
  },

  // Question visibility management
  questionVisibilities: {},
  setQuestionVisibility: (questionId: string, visibility: QuestionVisibility) => {
    set((state) => ({
      questionVisibilities: {
        ...state.questionVisibilities,
        [questionId]: visibility,
      },
    }));
  },
  revertQuestionVisibility: (questionId: string) => {
    set((state) => {
      const { [questionId]: removed, ...rest } = state.questionVisibilities;
      return { questionVisibilities: rest };
    });
  },

  // Loading states
  isUpdatingTrip: {},
  isUpdatingQuestion: {},
  setTripUpdating: (tripId: string, isUpdating: boolean) => {
    set((state) => ({
      isUpdatingTrip: {
        ...state.isUpdatingTrip,
        [tripId]: isUpdating,
      },
    }));
  },
  setQuestionUpdating: (questionId: string, isUpdating: boolean) => {
    set((state) => ({
      isUpdatingQuestion: {
        ...state.isUpdatingQuestion,
        [questionId]: isUpdating,
      },
    }));
  },
}));