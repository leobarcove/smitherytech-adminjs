import { ComponentLoader } from "adminjs";
import path from "path";

const componentLoader = new ComponentLoader();

// componentLoader.override('Login', path.resolve(""));

const Components = {
  InsuraWizConversationView: componentLoader.add(
    "InsuraWizConversationView",
    path.resolve("./components/insurawiz-conversation-view.jsx")
  ),
  FileUrlDisplay: componentLoader.add(
    "FileUrlDisplay",
    path.resolve("./components/file-url-display.jsx")
  ),
  ReviewClaim: componentLoader.add(
    "ReviewClaim",
    path.resolve("./components/review-claim.jsx")
  ),
  ClaimDocuments: componentLoader.add(
    "ClaimDocuments",
    path.resolve("./components/claim-documents.jsx")
  ),
  WrsProConversationView: componentLoader.add(
    "WrsProConversationView",
    path.resolve("./components/wrspro-conversation-view.jsx")
  ),
  CalendarView: componentLoader.add(
    "CalendarView",
    path.resolve("./components/calendar-view.jsx")
  ),
  ClientInfoDisplay: componentLoader.add(
    "ClientInfoDisplay",
    path.resolve("./components/client-info-display.jsx")
  ),
  StatusTag: componentLoader.add(
    "StatusTag",
    path.resolve("./components/status-tag.jsx")
  ),
  AppointmentDetails: componentLoader.add(
    "AppointmentDetails",
    path.resolve("./components/appointment-details.jsx")
  ),
  LendLyxConversationView: componentLoader.add(
    "LendLyxConversationView",
    path.resolve("./components/lendlyx-conversation-view.jsx")
  ),
  Dashboard: componentLoader.add(
    "Dashboard",
    path.resolve("./components/dashboard.jsx")
  ),
  ReviewLoan: componentLoader.add(
    "ReviewLoan",
    path.resolve("./components/review-loan.jsx")
  ),
  LoanDocuments: componentLoader.add(
    "LoanDocuments",
    path.resolve("./components/loan-documents.jsx")
  ),
  ServiceTypeSelect: componentLoader.add(
    "ServiceTypeSelect",
    path.resolve("./components/service-type-select.jsx")
  ),
  FutureDatePicker: componentLoader.add(
    "FutureDatePicker",
    path.resolve("./components/future-date-picker.jsx")
  ),
};

export { componentLoader, Components };
