import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { UserProfile, Church, Guest, GuestAction, JourneyStep, User, Subscription, FeatureFlags, GlobalAnalytics, Role, SubscriptionTier, CreateChurchArgs, ShoppingItem } from '../backend';

// ── User Profile ──────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ── Church ────────────────────────────────────────────────────────────────────

export function useGetChurch(id: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Church>({
    queryKey: ['church', id],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getChurch(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateChurch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: CreateChurchArgs) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createChurch(args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churches'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUpdateChurchBranding() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; logoUrl: string; primaryColor: string; subdomain: string; settings: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateChurchBranding(args.id, args.logoUrl, args.primaryColor, args.subdomain, args.settings);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['church', variables.id] });
    },
  });
}

export function useListAllChurches() {
  const { actor, isFetching } = useActor();

  return useQuery<Church[]>({
    queryKey: ['churches'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listAllChurches();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Guests ────────────────────────────────────────────────────────────────────

export function useRegisterGuest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; churchId: string; name: string; phone: string; email: string; interests: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerGuest(args.id, args.churchId, args.name, args.phone, args.email, args.interests);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guests', variables.churchId] });
    },
  });
}

export function useGetGuest(id: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Guest>({
    queryKey: ['guest', id],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getGuest(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useListGuests(churchId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Guest[]>({
    queryKey: ['guests', churchId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listGuests(churchId);
    },
    enabled: !!actor && !isFetching && !!churchId,
  });
}

export function useUpdateGuestStep() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; newStep: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateGuestStep(args.id, args.newStep);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guest', data.id] });
      queryClient.invalidateQueries({ queryKey: ['guests', data.churchId] });
    },
  });
}

export function useUpdateGuestInfo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; name: string; phone: string; email: string; interests: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateGuestInfo(args.id, args.name, args.phone, args.email, args.interests);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guest', data.id] });
      queryClient.invalidateQueries({ queryKey: ['guests', data.churchId] });
    },
  });
}

export function useAddGuestAction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; guestId: string; actionType: string; status: string; assignedTo: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addGuestAction(args.id, args.guestId, args.actionType, args.status, args.assignedTo);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guestActions', variables.guestId] });
    },
  });
}

export function useListGuestActions(guestId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<GuestAction[]>({
    queryKey: ['guestActions', guestId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listGuestActions(guestId);
    },
    enabled: !!actor && !isFetching && !!guestId,
  });
}

// ── Journey Steps ─────────────────────────────────────────────────────────────

export function useListJourneySteps(churchId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<JourneyStep[]>({
    queryKey: ['journeySteps', churchId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listJourneySteps(churchId);
    },
    enabled: !!actor && !isFetching && !!churchId,
  });
}

export function useCreateJourneyStep() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; churchId: string; stepNumber: bigint; title: string; description: string; videoUrl: string; ctaText: string; automationConfig: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createJourneyStep(args.id, args.churchId, args.stepNumber, args.title, args.description, args.videoUrl, args.ctaText, args.automationConfig);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journeySteps', variables.churchId] });
    },
  });
}

export function useUpdateJourneyStep() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; churchId: string; stepNumber: bigint; title: string; description: string; videoUrl: string; ctaText: string; automationConfig: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateJourneyStep(args.id, args.stepNumber, args.title, args.description, args.videoUrl, args.ctaText, args.automationConfig);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journeySteps', variables.churchId] });
    },
  });
}

export function useDeleteJourneyStep() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; churchId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteJourneyStep(args.id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journeySteps', variables.churchId] });
    },
  });
}

export function useReorderJourneySteps() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { orderedIds: string[]; churchId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reorderJourneySteps(args.orderedIds);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journeySteps', variables.churchId] });
    },
  });
}

// ── Team / Users ──────────────────────────────────────────────────────────────

export function useListUsers(churchId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<User[]>({
    queryKey: ['users', churchId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listUsers(churchId);
    },
    enabled: !!actor && !isFetching && !!churchId,
  });
}

export function useInviteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { userId: string; churchId: string; email: string; role: Role }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.inviteUser(Principal.fromText(args.userId), args.churchId, args.email, args.role);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', variables.churchId] });
    },
  });
}

export function useUpdateUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { userId: string; role: Role; churchId: string }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.updateUserRole(Principal.fromText(args.userId), args.role);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', variables.churchId] });
    },
  });
}

export function useRemoveUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { userId: string; churchId: string }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.removeUser(Principal.fromText(args.userId));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', variables.churchId] });
    },
  });
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

export function useGetSubscription(churchId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Subscription>({
    queryKey: ['subscription', churchId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSubscription(churchId);
    },
    enabled: !!actor && !isFetching && !!churchId,
    retry: false,
  });
}

export function useListAllSubscriptions() {
  const { actor, isFetching } = useActor();

  return useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listAllSubscriptions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateSubscriptionTier() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { churchId: string; tier: SubscriptionTier; status: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSubscriptionTier(args.churchId, args.tier, args.status);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.churchId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useRecordSubscription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { churchId: string; tier: SubscriptionTier; stripeCustomerId: string; stripeSubscriptionId: string; status: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordSubscription(args.churchId, args.tier, args.stripeCustomerId, args.stripeSubscriptionId, args.status);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.churchId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

// ── Feature Flags ─────────────────────────────────────────────────────────────

export function useGetFeatureFlags(churchId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<FeatureFlags | null>({
    queryKey: ['featureFlags', churchId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getFeatureFlags(churchId);
    },
    enabled: !!actor && !isFetching && !!churchId,
  });
}

export function useSetFeatureFlag() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { churchId: string; onboarding: boolean; extraFeatures: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setFeatureFlag(args.churchId, args.onboarding, args.extraFeatures);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags', variables.churchId] });
    },
  });
}

// ── Global Analytics ──────────────────────────────────────────────────────────

export function useGetGlobalAnalytics() {
  const { actor, isFetching } = useActor();

  return useQuery<GlobalAnalytics>({
    queryKey: ['globalAnalytics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getGlobalAnalytics();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Stripe Checkout ───────────────────────────────────────────────────────────

export type CheckoutSession = {
  id: string;
  url: string;
};

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (items: ShoppingItem[]): Promise<CheckoutSession> => {
      if (!actor) throw new Error('Actor not available');
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-failure`;
      const result = await actor.createCheckoutSession(items, successUrl, cancelUrl);
      const session = JSON.parse(result) as CheckoutSession;
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    },
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['stripeConfigured'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { secretKey: string; allowedCountries: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setStripeConfiguration({ secretKey: args.secretKey, allowedCountries: args.allowedCountries });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
    },
  });
}
