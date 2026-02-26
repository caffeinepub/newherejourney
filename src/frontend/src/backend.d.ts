import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CreateChurchArgs {
    id: string;
    name: string;
    branding?: Branding;
    subdomain: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface User {
    id: Principal;
    role: Role;
    email: string;
    churchId: string;
}
export interface FeatureFlags {
    extraFeatures: boolean;
    onboarding: boolean;
}
export interface http_header {
    value: string;
    name: string;
}
export interface Subscription {
    id: string;
    status: string;
    stripeSubscriptionId: string;
    createdAt: Time;
    tier: SubscriptionTier;
    updatedAt: Time;
    stripeCustomerId: string;
    churchId: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface GuestAction {
    id: string;
    status: string;
    assignedTo: string;
    actionType: string;
    guestId: string;
}
export interface Guest {
    id: string;
    interests: Array<string>;
    name: string;
    createdAt: Time;
    email: string;
    updatedAt: Time;
    currentStep: bigint;
    churchId: string;
    phone: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface GlobalAnalytics {
    totalSubscriptions: bigint;
    totalGuests: bigint;
    totalChurches: bigint;
}
export interface Church {
    id: string;
    primaryColor: string;
    name: string;
    createdAt: Time;
    updatedAt: Time;
    logoUrl: string;
    settings: string;
    subdomain: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface JourneyStep {
    id: string;
    title: string;
    automationConfig: string;
    description: string;
    ctaText: string;
    stepNumber: bigint;
    churchId: string;
    videoUrl: string;
}
export interface Branding {
    primaryColor: string;
    logoUrl: string;
    settings: string;
}
export interface UserProfile {
    name: string;
    role: Role;
    email: string;
    churchId: string;
}
export enum Role {
    admin = "admin",
    superAdmin = "superAdmin",
    pastor = "pastor",
    volunteer = "volunteer"
}
export enum SubscriptionTier {
    pro = "pro",
    growth = "growth",
    starter = "starter"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addGuestAction(id: string, guestId: string, actionType: string, status: string, assignedTo: string): Promise<GuestAction>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createChurch(args: CreateChurchArgs): Promise<Church>;
    createJourneyStep(id: string, churchId: string, stepNumber: bigint, title: string, description: string, videoUrl: string, ctaText: string, automationConfig: string): Promise<JourneyStep>;
    deleteJourneyStep(id: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChurch(id: string): Promise<Church>;
    getFeatureFlags(churchId: string): Promise<FeatureFlags | null>;
    getGlobalAnalytics(): Promise<GlobalAnalytics>;
    getGuest(id: string): Promise<Guest>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getSubscription(churchId: string): Promise<Subscription>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    inviteUser(userId: Principal, churchId: string, email: string, role: Role): Promise<User>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listAllChurches(): Promise<Array<Church>>;
    listAllSubscriptions(): Promise<Array<Subscription>>;
    listGuestActions(guestId: string): Promise<Array<GuestAction>>;
    listGuests(churchId: string): Promise<Array<Guest>>;
    listJourneySteps(churchId: string): Promise<Array<JourneyStep>>;
    listUsers(churchId: string): Promise<Array<User>>;
    recordSubscription(churchId: string, tier: SubscriptionTier, stripeCustomerId: string, stripeSubscriptionId: string, status: string): Promise<Subscription>;
    registerGuest(id: string, churchId: string, name: string, phone: string, email: string, interests: Array<string>): Promise<Guest>;
    removeUser(userId: Principal): Promise<void>;
    reorderJourneySteps(orderedIds: Array<string>): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setFeatureFlag(churchId: string, onboarding: boolean, extraFeatures: boolean): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateChurchBranding(id: string, logoUrl: string, primaryColor: string, subdomain: string, settings: string): Promise<Church>;
    updateGuestInfo(id: string, name: string, phone: string, email: string, interests: Array<string>): Promise<Guest>;
    updateGuestStep(id: string, newStep: bigint): Promise<Guest>;
    updateJourneyStep(id: string, stepNumber: bigint, title: string, description: string, videoUrl: string, ctaText: string, automationConfig: string): Promise<JourneyStep>;
    updateSubscriptionTier(churchId: string, tier: SubscriptionTier, status: string): Promise<Subscription>;
    updateUserRole(userId: Principal, role: Role): Promise<User>;
}
