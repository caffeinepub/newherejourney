import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import OutCall "http-outcalls/outcall";
import Stripe "stripe/stripe";
import MixinStorage "blob-storage/Mixin";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type Role = { #superAdmin; #admin; #pastor; #volunteer };
  public type SubscriptionTier = { #starter; #growth; #pro };
  public type FeatureFlags = { onboarding : Bool; extraFeatures : Bool };

  public type UserProfile = {
    name : Text;
    email : Text;
    churchId : Text;
    role : Role;
  };

  public type Church = {
    id : Text;
    name : Text;
    subdomain : Text;
    logoUrl : Text;
    primaryColor : Text;
    settings : Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  public type User = {
    id : Principal;
    churchId : Text;
    role : Role;
    email : Text;
  };

  public type Guest = {
    id : Text;
    churchId : Text;
    name : Text;
    phone : Text;
    email : Text;
    interests : [Text];
    currentStep : Nat;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  public type GuestAction = {
    id : Text;
    guestId : Text;
    actionType : Text;
    status : Text;
    assignedTo : Text;
  };

  public type JourneyStep = {
    id : Text;
    churchId : Text;
    stepNumber : Nat;
    title : Text;
    description : Text;
    videoUrl : Text;
    ctaText : Text;
    automationConfig : Text;
  };

  public type Subscription = {
    id : Text;
    churchId : Text;
    tier : SubscriptionTier;
    stripeCustomerId : Text;
    stripeSubscriptionId : Text;
    status : Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  public type GlobalAnalytics = {
    totalChurches : Nat;
    totalGuests : Nat;
    totalSubscriptions : Nat;
  };

  public type CreateChurchArgs = {
    id : Text;
    name : Text;
    subdomain : Text;
    branding : ?Branding;
  };

  public type Branding = {
    logoUrl : Text;
    primaryColor : Text;
    settings : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let churches = Map.empty<Text, Church>();
  let users = Map.empty<Principal, User>();
  let guests = Map.empty<Text, Guest>();
  let guestActions = Map.empty<Text, GuestAction>();
  let journeySteps = Map.empty<Text, JourneyStep>();
  let subscriptions = Map.empty<Text, Subscription>();
  let featureFlags = Map.empty<Text, FeatureFlags>();

  stable var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  public query func isStripeConfigured() : async Bool {
    switch (stripeConfiguration) {
      case (?_config) { true };
      case (null) { false };
    };
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot create checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  func isAppAdmin(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) { return true };
    switch (users.get(caller)) {
      case (?user) { user.role == #admin or user.role == #superAdmin };
      case (null) { false };
    };
  };

  func isAppUser(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) { return true };
    switch (users.get(caller)) {
      case (?_user) { true };
      case (null) { false };
    };
  };

  func isChurchAdmin(caller : Principal, churchId : Text) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) { return true };
    switch (users.get(caller)) {
      case (?user) {
        user.churchId == churchId and (user.role == #admin or user.role == #superAdmin)
      };
      case (null) { false };
    };
  };

  func isChurchMember(caller : Principal, churchId : Text) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) { return true };
    switch (users.get(caller)) {
      case (?user) { user.churchId == churchId };
      case (null) { false };
    };
  };

  func getCallerChurchId(caller : Principal) : ?Text {
    switch (users.get(caller)) {
      case (?user) { ?user.churchId };
      case (null) { null };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot access profiles");
    };
    if (caller != user and not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot save profiles");
    };

    userProfiles.add(caller, profile);

    let user : User = {
      id = caller;
      churchId = profile.churchId;
      role = profile.role;
      email = profile.email;
    };
    users.add(caller, user);
  };

  public shared ({ caller }) func createChurch(args : CreateChurchArgs) : async Church {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot create a church");
    };

    if (churches.get(args.id) != null) {
      Runtime.trap("Church already exists");
    };

    let branding = switch (args.branding) {
      case (null) {
        { logoUrl = ""; primaryColor = ""; settings = "" };
      };
      case (?data) { data };
    };

    let newChurch : Church = {
      id = args.id;
      name = args.name;
      subdomain = args.subdomain;
      logoUrl = branding.logoUrl;
      primaryColor = branding.primaryColor;
      settings = branding.settings;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    churches.add(args.id, newChurch);

    let newUser : User = {
      id = caller;
      churchId = args.id;
      role = #admin;
      email = "";
    };
    users.add(caller, newUser);

    let newProfile : UserProfile = {
      name = "";
      email = "";
      churchId = args.id;
      role = #admin;
    };
    userProfiles.add(caller, newProfile);

    newChurch;
  };

  public query func getChurch(id : Text) : async Church {
    switch (churches.get(id)) {
      case (null) { Runtime.trap("Church not found") };
      case (?church) { church };
    };
  };

  public shared ({ caller }) func updateChurchBranding(id : Text, logoUrl : Text, primaryColor : Text, subdomain : Text, settings : Text) : async Church {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot update church branding");
    };
    if (not isChurchAdmin(caller, id)) {
      Runtime.trap("Unauthorized: Only admins of this church can update branding");
    };
    switch (churches.get(id)) {
      case (null) { Runtime.trap("Church not found") };
      case (?church) {
        let updatedChurch : Church = {
          church with
          logoUrl;
          primaryColor;
          subdomain;
          settings;
          updatedAt = Time.now();
        };
        churches.add(id, updatedChurch);
        updatedChurch;
      };
    };
  };

  public query ({ caller }) func listAllChurches() : async [Church] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot list churches");
    };
    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all churches");
    };
    churches.values().toArray().sort(func(a : Church, b : Church) : Order.Order {
      Text.compare(a.id, b.id)
    });
  };

  public shared func registerGuest(id : Text, churchId : Text, name : Text, phone : Text, email : Text, interests : [Text]) : async Guest {
    if (guests.get(id) != null) { Runtime.trap("Guest already exists") };
    if (churches.get(churchId) == null) { Runtime.trap("Church not found") };
    let newGuest : Guest = {
      id;
      churchId;
      name;
      phone;
      email;
      interests;
      currentStep = 0;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    guests.add(id, newGuest);
    newGuest;
  };

  public query ({ caller }) func getGuest(id : Text) : async Guest {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot view guest records");
    };
    if (not isAppUser(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view guest records");
    };
    switch (guests.get(id)) {
      case (null) { Runtime.trap("Guest not found") };
      case (?guest) {
        if (not isChurchMember(caller, guest.churchId)) {
          Runtime.trap("Unauthorized: Can only view guests from your church");
        };
        guest;
      };
    };
  };

  public query ({ caller }) func listGuests(churchId : Text) : async [Guest] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot list guests");
    };
    if (not isAppUser(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can list guests");
    };
    if (not isChurchMember(caller, churchId)) {
      Runtime.trap("Unauthorized: Can only list guests from your church");
    };
    guests.values()
      .filter(func(g : Guest) : Bool { g.churchId == churchId })
      .toArray()
      .sort(func(a : Guest, b : Guest) : Order.Order {
        Int.compare(a.createdAt, b.createdAt)
      });
  };

  public shared func updateGuestStep(id : Text, newStep : Nat) : async Guest {
    switch (guests.get(id)) {
      case (null) { Runtime.trap("Guest not found") };
      case (?guest) {
        let updated : Guest = {
          guest with
          currentStep = newStep;
          updatedAt = Time.now();
        };
        guests.add(id, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func updateGuestInfo(id : Text, name : Text, phone : Text, email : Text, interests : [Text]) : async Guest {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot update guest info");
    };
    if (not isAppUser(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can update guest info");
    };
    switch (guests.get(id)) {
      case (null) { Runtime.trap("Guest not found") };
      case (?guest) {
        if (not isChurchMember(caller, guest.churchId)) {
          Runtime.trap("Unauthorized: Can only update guests from your church");
        };
        let updated : Guest = {
          guest with
          name;
          phone;
          email;
          interests;
          updatedAt = Time.now();
        };
        guests.add(id, updated);
        updated;
      };
    };
  };

  public shared func addGuestAction(id : Text, guestId : Text, actionType : Text, status : Text, assignedTo : Text) : async GuestAction {
    if (guestActions.get(id) != null) { Runtime.trap("Guest action already exists") };
    if (guests.get(guestId) == null) { Runtime.trap("Guest not found") };
    let newAction : GuestAction = { id; guestId; actionType; status; assignedTo };
    guestActions.add(id, newAction);
    newAction;
  };

  public query ({ caller }) func listGuestActions(guestId : Text) : async [GuestAction] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot list guest actions");
    };
    if (not isAppUser(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can list guest actions");
    };
    switch (guests.get(guestId)) {
      case (null) { Runtime.trap("Guest not found") };
      case (?guest) {
        if (not isChurchMember(caller, guest.churchId)) {
          Runtime.trap("Unauthorized: Can only view actions for guests from your church");
        };
      };
    };
    guestActions.values()
      .filter(func(a : GuestAction) : Bool { a.guestId == guestId })
      .toArray();
  };

  public shared ({ caller }) func createJourneyStep(id : Text, churchId : Text, stepNumber : Nat, title : Text, description : Text, videoUrl : Text, ctaText : Text, automationConfig : Text) : async JourneyStep {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot create journey steps");
    };
    if (not isChurchAdmin(caller, churchId)) {
      Runtime.trap("Unauthorized: Only admins of this church can create journey steps");
    };
    if (journeySteps.get(id) != null) { Runtime.trap("Journey step already exists") };
    let newStep : JourneyStep = {
      id;
      churchId;
      stepNumber;
      title;
      description;
      videoUrl;
      ctaText;
      automationConfig;
    };
    journeySteps.add(id, newStep);
    newStep;
  };

  public shared ({ caller }) func updateJourneyStep(id : Text, stepNumber : Nat, title : Text, description : Text, videoUrl : Text, ctaText : Text, automationConfig : Text) : async JourneyStep {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot update journey steps");
    };
    switch (journeySteps.get(id)) {
      case (null) { Runtime.trap("Journey step not found") };
      case (?step) {
        if (not isChurchAdmin(caller, step.churchId)) {
          Runtime.trap("Unauthorized: Only admins of this church can update journey steps");
        };
        let updated : JourneyStep = {
          step with
          stepNumber;
          title;
          description;
          videoUrl;
          ctaText;
          automationConfig;
        };
        journeySteps.add(id, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func deleteJourneyStep(id : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot delete journey steps");
    };
    switch (journeySteps.get(id)) {
      case (null) { Runtime.trap("Journey step not found") };
      case (?step) {
        if (not isChurchAdmin(caller, step.churchId)) {
          Runtime.trap("Unauthorized: Only admins of this church can delete journey steps");
        };
        journeySteps.remove(id);
      };
    };
  };

  public shared ({ caller }) func reorderJourneySteps(orderedIds : [Text]) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot reorder journey steps");
    };
    var churchId : ?Text = null;
    for (id in orderedIds.vals()) {
      switch (journeySteps.get(id)) {
        case (null) { /* skip unknown ids */ };
        case (?step) {
          switch (churchId) {
            case (null) {
              churchId := ?step.churchId;
              if (not isChurchAdmin(caller, step.churchId)) {
                Runtime.trap("Unauthorized: Only admins of this church can reorder journey steps");
              };
            };
            case (?cid) {
              if (step.churchId != cid) {
                Runtime.trap("Cannot reorder steps from different churches");
              };
            };
          };
        };
      };
    };
    var stepNumber : Nat = 1;
    for (id in orderedIds.vals()) {
      switch (journeySteps.get(id)) {
        case (null) { /* skip unknown ids */ };
        case (?step) {
          let updated : JourneyStep = { step with stepNumber };
          journeySteps.add(id, updated);
        };
      };
      stepNumber += 1;
    };
  };

  public query func listJourneySteps(churchId : Text) : async [JourneyStep] {
    journeySteps.values()
      .filter(func(j : JourneyStep) : Bool { j.churchId == churchId })
      .toArray()
      .sort(func(a : JourneyStep, b : JourneyStep) : Order.Order {
        if (a.stepNumber < b.stepNumber) { #less } else if (a.stepNumber > b.stepNumber) { #greater } else { #equal };
      });
  };

  public shared ({ caller }) func inviteUser(userId : Principal, churchId : Text, email : Text, role : Role) : async User {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot invite users");
    };
    if (not isChurchAdmin(caller, churchId)) {
      Runtime.trap("Unauthorized: Only admins of this church can invite users");
    };
    let newUser : User = { id = userId; churchId; role; email };
    users.add(userId, newUser);
    newUser;
  };

  public query ({ caller }) func listUsers(churchId : Text) : async [User] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot list users");
    };
    if (not isAppUser(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can list team members");
    };
    if (not isChurchMember(caller, churchId)) {
      Runtime.trap("Unauthorized: Can only list users from your church");
    };
    users.values()
      .filter(func(u : User) : Bool { u.churchId == churchId })
      .toArray();
  };

  public shared ({ caller }) func updateUserRole(userId : Principal, role : Role) : async User {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot update user roles");
    };
    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?existingUser) {
        if (not isChurchAdmin(caller, existingUser.churchId)) {
          Runtime.trap("Unauthorized: Only admins of this church can update user roles");
        };
        let updated : User = {
          existingUser with role
        };
        users.add(userId, updated);
        switch (userProfiles.get(userId)) {
          case (null) { () };
          case (?profile) {
            let updatedProfile = {
              profile with role
            };
            userProfiles.add(userId, updatedProfile);
          };
        };
        updated;
      };
    };
  };

  public shared ({ caller }) func removeUser(userId : Principal) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot remove users");
    };
    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?existingUser) {
        if (not isChurchAdmin(caller, existingUser.churchId)) {
          Runtime.trap("Unauthorized: Only admins of this church can remove users");
        };
        users.remove(userId);
        switch (userProfiles.get(userId)) {
          case (null) { () };
          case (?_profile) {
            userProfiles.remove(userId);
          };
        };
      };
    };
  };

  public shared ({ caller }) func recordSubscription(churchId : Text, tier : SubscriptionTier, stripeCustomerId : Text, stripeSubscriptionId : Text, status : Text) : async Subscription {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot record subscriptions");
    };
    if (not isChurchAdmin(caller, churchId)) {
      Runtime.trap("Unauthorized: Only admins of this church can record subscriptions");
    };
    let sub : Subscription = {
      id = churchId;
      churchId;
      tier;
      stripeCustomerId;
      stripeSubscriptionId;
      status;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    subscriptions.add(churchId, sub);
    sub;
  };

  public query ({ caller }) func getSubscription(churchId : Text) : async Subscription {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot view subscriptions");
    };
    if (not isAppUser(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view subscriptions");
    };
    switch (subscriptions.get(churchId)) {
      case (null) { Runtime.trap("Subscription not found") };
      case (?subscription) { subscription };
    };
  };

  public shared ({ caller }) func updateSubscriptionTier(churchId : Text, tier : SubscriptionTier, status : Text) : async Subscription {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot update subscription tiers");
    };
    if (not isChurchAdmin(caller, churchId)) {
      Runtime.trap("Unauthorized: Only admins of this church can update subscription tiers");
    };
    switch (subscriptions.get(churchId)) {
      case (null) { Runtime.trap("Subscription not found") };
      case (?sub) {
        let updated : Subscription = {
          sub with
          tier;
          status;
          updatedAt = Time.now();
        };
        subscriptions.add(churchId, updated);
        updated;
      };
    };
  };

  public query ({ caller }) func listAllSubscriptions() : async [Subscription] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot list subscriptions");
    };
    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can list all subscriptions");
    };
    subscriptions.values().toArray();
  };

  public shared ({ caller }) func setFeatureFlag(churchId : Text, onboarding : Bool, extraFeatures : Bool) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot set feature flags");
    };
    if (not isChurchAdmin(caller, churchId)) {
      Runtime.trap("Unauthorized: Only admins of this church can set feature flags");
    };
    featureFlags.add(churchId, { onboarding; extraFeatures });
  };

  public query ({ caller }) func getFeatureFlags(churchId : Text) : async ?FeatureFlags {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot view feature flags");
    };
    if (not isAppUser(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view feature flags");
    };
    featureFlags.get(churchId);
  };

  public query ({ caller }) func getGlobalAnalytics() : async GlobalAnalytics {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot view global analytics");
    };
    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view global analytics");
    };
    {
      totalChurches = churches.size();
      totalGuests = guests.size();
      totalSubscriptions = subscriptions.size();
    };
  };
};
